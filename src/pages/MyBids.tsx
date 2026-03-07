import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Briefcase,
  DollarSign,
  MapPin,
  Send,
  Trophy,
  ArrowLeft,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/lib/i18n-utils';

// Mock data
const mockBids = [
  {
    id: '1',
    job_title: 'Instalação de ar condicionado split',
    job_location: 'São Paulo, SP - Zona Sul',
    quoted_price: 750,
    status: 'submitted',
    submitted_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    job_budget: 'R$500 - R$1.000',
    total_bids: 3,
  },
  {
    id: '2',
    job_title: 'Pintura interna apartamento',
    job_location: 'São Paulo, SP - Moema',
    quoted_price: 2800,
    status: 'accepted',
    submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    job_budget: 'R$2.000 - R$3.500',
    total_bids: 5,
  },
  {
    id: '3',
    job_title: 'Limpeza de caixa d\'água',
    job_location: 'São Paulo, SP - Jardins',
    quoted_price: 200,
    status: 'declined',
    submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    job_budget: 'R$150 - R$300',
    total_bids: 4,
  },
];

export default function MyBids() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('active');
  const dateLocale = getDateFnsLocale(i18n);

  if (!user) {
    return (
      <>
        <Helmet>
          <title>{t('jobs.myBids')} - Brasil Base</title>
        </Helmet>
        <AppLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Send className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('jobs.myBids')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('jobs.loginToViewProposals')}
            </p>
            <Button onClick={() => navigate('/auth')}>{t('auth.signIn')}</Button>
          </div>
        </AppLayout>
      </>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {t('jobs.waiting')}</Badge>;
      case 'under_review':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700"><Clock className="w-3 h-3 mr-1" /> {t('jobs.underReview')}</Badge>;
      case 'accepted':
        return <Badge className="bg-green-600"><Trophy className="w-3 h-3 mr-1" /> {t('jobs.accepted')}!</Badge>;
      case 'declined':
        return <Badge variant="outline" className="text-muted-foreground"><XCircle className="w-3 h-3 mr-1" /> {t('jobs.notSelected')}</Badge>;
      case 'withdrawn':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" /> {t('jobs.withdrawn')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeBids = mockBids.filter(b => ['submitted', 'under_review'].includes(b.status));
  const historyBids = mockBids.filter(b => ['accepted', 'declined', 'withdrawn', 'expired'].includes(b.status));

  // Stats
  const totalBids = mockBids.length;
  const acceptedBids = mockBids.filter(b => b.status === 'accepted').length;
  const winRate = totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0;

  return (
    <>
      <Helmet>
        <title>{t('jobs.myBids')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('jobs.myBids')}</h1>
              <p className="text-muted-foreground">{t('jobs.trackYourProposals')}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{totalBids}</p>
                <p className="text-xs text-muted-foreground">{t('jobs.sent')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{acceptedBids}</p>
                <p className="text-xs text-muted-foreground">{t('jobs.accepted')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{winRate}%</p>
                <p className="text-xs text-muted-foreground">{t('jobs.successRate')}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="active">
                {t('jobs.active')} ({activeBids.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                {t('jobs.history')} ({historyBids.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeBids.length === 0 ? (
                <div className="text-center py-12">
                  <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">{t('jobs.noActiveProposals')}</p>
                  <Button onClick={() => navigate('/jobs')}>
                    <Briefcase className="w-4 h-4 mr-1" /> {t('jobs.viewJobs')}
                  </Button>
                </div>
              ) : (
                activeBids.map((bid) => (
                  <Card 
                    key={bid.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/bid/${bid.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          {getStatusBadge(bid.status)}
                          <h3 className="font-semibold mt-2">{bid.job_title}</h3>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-3 h-3" />
                        <span>{bid.job_location}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 font-medium text-primary">
                            <DollarSign className="w-4 h-4" />
                            R${bid.quoted_price.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            {t('jobs.jobBudget')}: {bid.job_budget}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {bid.total_bids} {t('jobs.proposals')}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        {t('jobs.sent')} {formatDistanceToNow(new Date(bid.submitted_at), { addSuffix: true, locale: dateLocale })}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {historyBids.map((bid) => (
                <Card 
                  key={bid.id} 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${bid.status === 'accepted' ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}`}
                  onClick={() => navigate(`/bid/${bid.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {getStatusBadge(bid.status)}
                        <h3 className="font-semibold mt-2">{bid.job_title}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 font-medium">
                        <DollarSign className="w-4 h-4 text-primary" />
                        R${bid.quoted_price.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(bid.submitted_at), { addSuffix: true, locale: dateLocale })}
                      </span>
                    </div>

                    {bid.status === 'accepted' && (
                      <Button className="w-full mt-3" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/active-job/${bid.id}`);
                      }}>
                        {t('jobs.viewActiveJob')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </>
  );
}
