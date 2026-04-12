import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Users, Plus, Mail, Shield, MoreVertical, 
  Check, X, Trash2, Edit, Crown, Building2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  avatar?: string;
  status: 'active' | 'pending';
  permissions: string[];
}

export default function Team() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['services', 'jobs', 'messages']);

  const currentUserMember: TeamMember = {
    id: user?.id || '1',
    name: profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : t('team.you'),
    email: user?.email || '',
    role: 'owner',
    status: 'active',
    permissions: ['all'],
  };

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([currentUserMember]);

  const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    owner: { label: t('team.owner'), color: 'bg-primary text-primary-foreground' },
    admin: { label: t('team.admin'), color: 'bg-foreground text-background' },
    manager: { label: t('team.manager'), color: 'bg-primary/20 text-primary' },
    member: { label: t('team.member'), color: 'bg-muted text-muted-foreground' },
  };

  const PERMISSIONS = [
    { id: 'account', label: t('team.accountSettings'), description: t('team.accountSettingsDesc') },
    { id: 'services', label: t('team.servicesGigs'), description: t('team.servicesGigsDesc') },
    { id: 'jobs', label: t('team.jobsBids'), description: t('team.jobsBidsDesc') },
    { id: 'messages', label: t('team.messagesPermission'), description: t('team.messagesPermissionDesc') },
    { id: 'analytics', label: t('team.analytics'), description: t('team.analyticsDesc') },
    { id: 'team', label: t('team.teamManagement'), description: t('team.teamManagementDesc') },
  ];

  // For now, check if user is enterprise tier (this would be from provider data)
  // In production, this would come from the provider's subscription_tier
  const isEnterprise = true; // Simulated for demo

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('team.loginRequired')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('team.loginToAccess')}
          </p>
          <Button onClick={() => navigate('/auth')}>{t('auth.signIn')}</Button>
        </div>
      </AppLayout>
    );
  }

  if (!isEnterprise) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center mb-4">
            <Crown className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('team.enterpriseFeature')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('team.enterpriseOnly')}
          </p>
          <Button onClick={() => navigate('/subscription')}>{t('team.upgradeToEnterprise')}</Button>
        </div>
      </AppLayout>
    );
  }

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error(t('team.enterEmail'));
      return;
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole as TeamMember['role'],
      status: 'pending',
      permissions: selectedPermissions,
    };

    setTeamMembers([...teamMembers, newMember]);
    toast.success(t('team.invitationSent', { email: inviteEmail }));
    setIsInviteOpen(false);
    setInviteEmail('');
    setInviteRole('member');
    setSelectedPermissions(['services', 'jobs', 'messages']);
  };

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== memberId));
    toast.success(t('team.memberRemoved'));
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <>
      <Helmet>
        <title>{t('team.title')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="rounded-xl bg-gradient-to-br from-primary/10 via-card to-card gradient-border p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">{t('team.title')}</h1>
                <p className="text-muted-foreground">
                  {t('team.subtitle')}
                </p>
              </div>
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('team.inviteMember')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('team.inviteTitle')}</DialogTitle>
                    <DialogDescription>
                      {t('team.inviteDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('team.emailAddress')}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('team.emailPlaceholder')}
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('team.role')}</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{t('team.adminFull')}</SelectItem>
                          <SelectItem value="manager">{t('team.managerLimited')}</SelectItem>
                          <SelectItem value="member">{t('team.memberBasic')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('team.permissions')}</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {PERMISSIONS.map((permission) => (
                          <button
                            key={permission.id}
                            onClick={() => togglePermission(permission.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                              selectedPermissions.includes(permission.id)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                              selectedPermissions.includes(permission.id)
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground'
                            }`}>
                              {selectedPermissions.includes(permission.id) && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{permission.label}</p>
                              <p className="text-xs text-muted-foreground">{permission.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleInvite}>
                      <Mail className="w-4 h-4 mr-2" />
                      {t('team.sendInvitation')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Team Members List */}
          <div className="rounded-xl gradient-border overflow-hidden">
            <div className="bg-card">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">{t('team.teamMembers')}</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {teamMembers.length} {teamMembers.length === 1 ? t('team.member') : t('team.members')}
                  </Badge>
                </div>
              </div>
              <div className="divide-y divide-border">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{member.name}</p>
                        {member.status === 'pending' && (
                          <Badge variant="outline" className="text-xs">{t('team.pending')}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <Badge className={ROLE_LABELS[member.role].color}>
                      {ROLE_LABELS[member.role].label}
                    </Badge>
                    {member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            {t('team.editPermissions')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="w-4 h-4 mr-2" />
                            {t('team.changeRole')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('team.remove')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions Info */}
          <div className="mt-6 rounded-xl bg-gradient-to-br from-primary/10 via-card to-card gradient-border p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground mb-1">{t('team.aboutPermissions')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('team.permissionsDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
