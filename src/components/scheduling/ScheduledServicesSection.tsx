import { useTranslation } from 'react-i18next';
import { Repeat, Loader2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useScheduledServices } from '@/hooks/useScheduledServices';
import { ScheduledServiceCard } from './ScheduledServiceCard';

export function ScheduledServicesSection() {
  const { t } = useTranslation();
  const {
    activeServices,
    pausedServices,
    isLoading,
    updateServiceStatus,
  } = useScheduledServices();

  const handlePause = (id: string) => updateServiceStatus(id, 'paused');
  const handleResume = (id: string) => updateServiceStatus(id, 'active');
  const handleCancel = (id: string) => updateServiceStatus(id, 'cancelled');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasServices = activeServices.length > 0 || pausedServices.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Repeat className="h-5 w-5" />
          {t('scheduling.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasServices ? (
          <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                {t('scheduling.active')} ({activeServices.length})
              </TabsTrigger>
              <TabsTrigger value="paused">
                {t('scheduling.paused')} ({pausedServices.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4 space-y-4">
              {activeServices.length > 0 ? (
                activeServices.map((service) => (
                  <ScheduledServiceCard
                    key={service.id}
                    service={service}
                    onPause={handlePause}
                    onResume={handleResume}
                    onCancel={handleCancel}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  {t('scheduling.noActiveServices')}
                </p>
              )}
            </TabsContent>

            <TabsContent value="paused" className="mt-4 space-y-4">
              {pausedServices.length > 0 ? (
                pausedServices.map((service) => (
                  <ScheduledServiceCard
                    key={service.id}
                    service={service}
                    onPause={handlePause}
                    onResume={handleResume}
                    onCancel={handleCancel}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  {t('scheduling.noPausedServices')}
                </p>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              {t('scheduling.noScheduledServices')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('scheduling.scheduleFromProvider')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
