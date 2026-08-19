import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type InviteRow = {
  id: string;
  status: string;
  created_at: string;
};

type ItemRow = {
  invite_id: string;
  title: string;
  approval_status: string;
  payment_status: string;
};

export function ClientInviteStatusCard() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['client-invite-status', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data: invites, error } = await supabase
        .from('provider_client_invites')
        .select('id, status, created_at')
        .eq('redeemed_by', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) return { invites: [] as InviteRow[], items: [] as ItemRow[] };

      const inviteRows = (invites || []) as InviteRow[];
      const ids = inviteRows.map((row) => row.id);
      if (ids.length === 0) return { invites: inviteRows, items: [] as ItemRow[] };

      const { data: items } = await supabase
        .from('provider_client_invite_items')
        .select('invite_id, title, approval_status, payment_status')
        .in('invite_id', ids);

      return { invites: inviteRows, items: (items || []) as ItemRow[] };
    },
  });

  if (!data?.invites.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invited services</CardTitle>
        <CardDescription>Services from your provider invitation. Payment status is view-only.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.invites.map((invite) => {
          const items = data.items.filter((item) => item.invite_id === invite.id);
          return (
            <div key={invite.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Invitation</p>
                <Badge variant="outline">{invite.status}</Badge>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No proposed services on this invitation.</p>
              ) : (
                items.map((item, index) => (
                  <div key={`${invite.id}-${index}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>{item.title}</span>
                    <span className="text-muted-foreground">
                      {item.approval_status} · {item.payment_status}
                    </span>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
