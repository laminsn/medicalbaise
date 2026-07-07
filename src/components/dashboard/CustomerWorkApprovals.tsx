import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Image, Clock, CheckCircle, XCircle, PenLine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SignaturePad } from '@/components/signature/SignaturePad';

interface WorkApprovalMedia {
  id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  status: string;
  created_at: string;
  active_job: {
    id: string;
    job: {
      title: string;
    } | null;
  } | null;
}

interface ProviderWorkSignoff {
  id: string;
  title: string;
  signoff_type: string;
  status: string;
  signer_name: string | null;
  signer_email: string | null;
  signature_data_url: string | null;
  signed_at: string | null;
  notes: string | null;
  created_at: string;
  provider: {
    business_name: string | null;
  } | null;
  quote: {
    title: string | null;
    quote_number: string | null;
  } | null;
  project: {
    project_name: string | null;
  } | null;
}

interface ProviderWorkAttachment {
  id: string;
  signoff_id: string | null;
  file_name: string;
  file_path: string;
  bucket_id: string;
  mime_type: string | null;
  attachment_type: string;
  caption: string | null;
  signed_url?: string | null;
  created_at: string;
}

export function CustomerWorkApprovals() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [signatureForms, setSignatureForms] = useState<Record<string, { signerName: string; signatureDataUrl: string }>>({});

  const { data: approvals, isLoading, refetch } = useQuery({
    queryKey: ['customer-work-approvals', user?.id],
    queryFn: async () => {
      // First get all active jobs for this customer
      const { data: activeJobs, error: jobsError } = await supabase
        .from('active_jobs')
        .select('id')
        .eq('customer_id', user?.id);

      if (jobsError) throw jobsError;
      if (!activeJobs?.length) return [];

      const activeJobIds = activeJobs.map(j => j.id);

      // Then get work approval media for those jobs
      const { data, error } = await supabase
        .from('work_approval_media')
        .select(`
          id,
          media_url,
          media_type,
          caption,
          status,
          created_at,
          active_job:active_jobs (
            id,
            job:jobs_posted (
              title
            )
          )
        `)
        .in('active_job_id', activeJobIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as WorkApprovalMedia[];
    },
    enabled: !!user,
  });

  const { data: signoffData, isLoading: isLoadingSignoffs, refetch: refetchSignoffs } = useQuery({
    queryKey: ['customer-provider-signoffs', user?.id],
    queryFn: async () => {
      const [signoffsRes, attachmentsRes] = await Promise.all([
        supabase
          .from('provider_work_signoffs')
          .select(`
            id,
            title,
            signoff_type,
            status,
            signer_name,
            signer_email,
            signature_data_url,
            signed_at,
            notes,
            created_at,
            provider:providers (business_name),
            quote:provider_quote_records (title, quote_number),
            project:provider_projects (project_name)
          `)
          .eq('customer_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('provider_work_attachments')
          .select('id, signoff_id, file_name, file_path, bucket_id, mime_type, attachment_type, caption, created_at')
          .eq('customer_id', user?.id)
          .order('created_at', { ascending: false }),
      ]);

      if (signoffsRes.error) throw signoffsRes.error;
      if (attachmentsRes.error) throw attachmentsRes.error;

      const attachments = await Promise.all(
        ((attachmentsRes.data || []) as ProviderWorkAttachment[]).map(async (attachment) => {
          const { data } = await supabase.storage
            .from(attachment.bucket_id || 'provider-work-media')
            .createSignedUrl(attachment.file_path, 60 * 60);
          return { ...attachment, signed_url: data?.signedUrl || null };
        }),
      );

      return {
        signoffs: (signoffsRes.data || []) as unknown as ProviderWorkSignoff[],
        attachments,
      };
    },
    enabled: !!user,
  });

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('work_approval_media')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error(t('workApproval.approveError'));
    } else {
      toast.success(t('workApproval.approveSuccess'));
      refetch();
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('work_approval_media')
      .update({ status: 'rejected', rejected_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error(t('workApproval.rejectError'));
    } else {
      toast.success(t('workApproval.rejectSuccess'));
      refetch();
    }
  };

  const handleSignOff = async (signoff: ProviderWorkSignoff) => {
    const form = signatureForms[signoff.id];
    if (!form?.signatureDataUrl) {
      toast.error(t('workApproval.signatureRequired', 'Please add your signature first.'));
      return;
    }

    const { error } = await supabase
      .from('provider_work_signoffs')
      .update({
        status: 'signed',
        signer_name: form.signerName || signoff.signer_name || user?.email || null,
        signature_data_url: form.signatureDataUrl,
        signature_method: 'drawn',
        signed_by: user?.id,
        signed_at: new Date().toISOString(),
        signed_user_agent: navigator.userAgent,
      })
      .eq('id', signoff.id)
      .eq('customer_id', user?.id);

    if (error) {
      toast.error(t('workApproval.signError', 'Could not save signature.'));
      return;
    }

    toast.success(t('workApproval.signSuccess', 'Sign-off saved.'));
    setSignatureForms((prev) => {
      const next = { ...prev };
      delete next[signoff.id];
      return next;
    });
    refetchSignoffs();
  };

  const pendingApprovals = approvals?.filter(a => a.status === 'pending') || [];
  const recentApprovals = approvals?.slice(0, 5) || [];
  const signoffs = signoffData?.signoffs || [];
  const proofAttachments = signoffData?.attachments || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              {t('workApproval.signoffsTitle', 'Client sign-offs')}
            </CardTitle>
            {signoffs.filter((item) => item.status === 'requested').length > 0 && (
              <Badge variant="destructive">
                {signoffs.filter((item) => item.status === 'requested').length} {t('customerDashboard.workApprovals.pending')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSignoffs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : signoffs.length > 0 ? (
            <div className="space-y-4">
              {signoffs.slice(0, 6).map((signoff) => {
                const form = signatureForms[signoff.id] || { signerName: signoff.signer_name || '', signatureDataUrl: '' };
                const attachments = proofAttachments.filter((attachment) => attachment.signoff_id === signoff.id);
                return (
                  <div key={signoff.id} className="rounded-lg border border-border/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{signoff.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {signoff.provider?.business_name || signoff.quote?.title || signoff.project?.project_name || format(new Date(signoff.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Badge className={
                        signoff.status === 'signed' ? 'bg-green-500/20 text-green-500' :
                        signoff.status === 'declined' ? 'bg-red-500/20 text-red-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }>
                        {signoff.status}
                      </Badge>
                    </div>
                    {signoff.notes && <p className="mt-2 text-sm text-muted-foreground">{signoff.notes}</p>}
                    {attachments.length > 0 && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {attachments.slice(0, 4).map((attachment) => (
                          attachment.signed_url ? (
                            <a key={attachment.id} href={attachment.signed_url} target="_blank" rel="noreferrer" className="rounded-md border p-2 text-sm hover:bg-muted">
                              {attachment.mime_type?.startsWith('image/') ? (
                                <img src={attachment.signed_url} alt={attachment.caption || attachment.file_name} className="mb-2 h-24 w-full rounded object-cover" />
                              ) : null}
                              <span className="line-clamp-1">{attachment.caption || attachment.file_name}</span>
                            </a>
                          ) : (
                            <div key={attachment.id} className="rounded-md border p-2 text-sm text-muted-foreground">
                              <span className="line-clamp-1">{attachment.caption || attachment.file_name}</span>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                    {signoff.status === 'requested' && (
                      <div className="mt-4 space-y-3">
                        <Input
                          value={form.signerName}
                          placeholder={t('workApproval.signerName', 'Your name')}
                          onChange={(event) => setSignatureForms((prev) => ({
                            ...prev,
                            [signoff.id]: { ...form, signerName: event.target.value },
                          }))}
                        />
                        <SignaturePad
                          value={form.signatureDataUrl}
                          onChange={(signatureDataUrl) => setSignatureForms((prev) => ({
                            ...prev,
                            [signoff.id]: { ...form, signatureDataUrl },
                          }))}
                          clearLabel={t('workApproval.clearSignature', 'Clear signature')}
                          placeholder={t('workApproval.signHere', 'Sign here')}
                        />
                        <Button size="sm" onClick={() => handleSignOff(signoff)}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t('workApproval.signOff', 'Sign off')}
                        </Button>
                      </div>
                    )}
                    {signoff.status === 'signed' && signoff.signature_data_url && (
                      <img src={signoff.signature_data_url} alt={signoff.title} className="mt-3 max-h-20 rounded border bg-background object-contain" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <PenLine className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                {t('workApproval.noSignoffs', 'No client sign-offs are waiting right now.')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="h-5 w-5" />
            {t('customerDashboard.workApprovals.title')}
          </CardTitle>
          {pendingApprovals.length > 0 && (
            <Badge variant="destructive">{pendingApprovals.length} {t('customerDashboard.workApprovals.pending')}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentApprovals.length > 0 ? (
          <div className="space-y-3">
            {recentApprovals.map((item) => (
              <div 
                key={item.id} 
                className="flex gap-3 p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item.media_type === 'video' ? (
                    <video src={item.media_url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.media_url} alt={item.active_job?.job?.title || 'Work photo'} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm truncate">
                        {item.active_job?.job?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge className={
                      item.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                      item.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }>
                      {item.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {item.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                      {item.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {t(`workApproval.${item.status}`)}
                    </Badge>
                  </div>
                  {item.caption && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.caption}</p>
                  )}
                  {item.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="default" onClick={() => handleApprove(item.id)}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('workApproval.approve')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(item.id)}>
                        <XCircle className="h-3 w-3 mr-1" />
                        {t('workApproval.reject')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              {t('customerDashboard.workApprovals.noApprovals')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('customerDashboard.workApprovals.description')}
            </p>
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
}
