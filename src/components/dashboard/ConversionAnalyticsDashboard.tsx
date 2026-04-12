import { escapeHtml } from "@/lib/sanitize";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  ExternalLink, 
  Eye, 
  MessageSquare, 
  Phone, 
  FileText, 
  Heart, 
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  CalendarDays,
  Download
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, differenceInDays, eachDayOfInterval } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { AnalyticsReportScheduler } from './AnalyticsReportScheduler';

interface ConversionEvent {
  id: string;
  event_type: string;
  event_name: string;
  source: string;
  created_at: string;
}

interface EventSummary {
  type: string;
  count: number;
  icon: React.ElementType;
  color: string;
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  profile_view: { icon: Eye, color: 'hsl(var(--chart-1))', label: 'Profile Views' },
  quote_request: { icon: FileText, color: 'hsl(var(--chart-2))', label: 'Quote Requests' },
  message_click: { icon: MessageSquare, color: 'hsl(var(--chart-3))', label: 'Messages' },
  phone_click: { icon: Phone, color: 'hsl(var(--chart-4))', label: 'Phone Calls' },
  add_to_favorites: { icon: Heart, color: 'hsl(var(--chart-5))', label: 'Favorites' },
  booking_initiated: { icon: CalendarIcon, color: 'hsl(var(--primary))', label: 'Bookings' },
};

const PRESET_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export function ConversionAnalyticsDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [events, setEvents] = useState<ConversionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [metaPixelId, setMetaPixelId] = useState<string | null>(null);
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    if (!user) return;

    async function fetchProviderData() {
      try {
        const { data: provider } = await supabase
          .from('providers')
          .select('id, meta_pixel_id, google_analytics_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (provider) {
          setProviderId(provider.id);
          setMetaPixelId(provider.meta_pixel_id);
          setGoogleAnalyticsId(provider.google_analytics_id);
        }
      } catch (error) {

      }
    }

    fetchProviderData();
  }, [user]);

  useEffect(() => {
    if (!providerId || !dateRange.from) return;

    async function fetchEvents() {
      setLoading(true);
      try {
        const fromDate = startOfDay(dateRange.from!).toISOString();
        const toDate = endOfDay(dateRange.to || dateRange.from!).toISOString();
        
        const { data: eventsData } = await supabase
          .from('conversion_events')
          .select('*')
          .eq('provider_id', providerId)
          .gte('created_at', fromDate)
          .lte('created_at', toDate)
          .order('created_at', { ascending: false });

        setEvents(eventsData || []);
      } catch (error) {

      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [providerId, dateRange]);

  const handlePresetClick = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
  };

  // Calculate event summaries
  const eventSummaries: EventSummary[] = Object.entries(EVENT_CONFIG).map(([eventName, config]) => ({
    type: eventName,
    count: events.filter(e => e.event_name === eventName).length,
    icon: config.icon,
    color: config.color,
  }));

  // Calculate daily data for chart based on date range
  const daysInRange = dateRange.from && dateRange.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 7;
  
  const chartDays = Math.min(daysInRange, 14); // Show max 14 days on chart
  
  const dailyData = dateRange.from && dateRange.to 
    ? eachDayOfInterval({ 
        start: subDays(dateRange.to, chartDays - 1), 
        end: dateRange.to 
      }).map(date => {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const dayEvents = events.filter(e => {
          const eventDate = new Date(e.created_at);
          return eventDate >= dayStart && eventDate <= dayEnd;
        });

        return {
          date: format(date, chartDays <= 7 ? 'EEE' : 'MMM d'),
          views: dayEvents.filter(e => e.event_name === 'profile_view').length,
          leads: dayEvents.filter(e => ['quote_request', 'message_click', 'phone_click'].includes(e.event_name)).length,
        };
      })
    : [];

  // Calculate conversion rate
  const totalViews = events.filter(e => e.event_name === 'profile_view').length;
  const totalLeads = events.filter(e => ['quote_request', 'message_click', 'phone_click'].includes(e.event_name)).length;
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0';

  // Pie chart data
  const pieData = eventSummaries
    .filter(s => s.count > 0)
    .map(s => ({
      name: EVENT_CONFIG[s.type]?.label || s.type,
      value: s.count,
      color: s.color,
    }));

  // Format date range display
  const dateRangeLabel = dateRange.from && dateRange.to
    ? `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`
    : dateRange.from
    ? format(dateRange.from, 'MMM d, yyyy')
    : t('tracking.selectDateRange', 'Select date range');

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Event', 'Type', 'Source', 'Date'];
    const rows = events.map(event => [
      EVENT_CONFIG[event.event_name]?.label || event.event_name,
      event.event_type,
      event.source || 'direct',
      format(new Date(event.created_at), 'yyyy-MM-dd HH:mm:ss')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `conversion-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Export to PDF (printable report)
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;

    const summaryRows = eventSummaries.map(s => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(EVENT_CONFIG[s.type]?.label || s.type)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${s.count}</td>
      </tr>
    `).join('');

    const eventRows = events.slice(0, 50).map(event => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(EVENT_CONFIG[event.event_name]?.label || event.event_name)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(event.event_type)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(event.source || 'direct')}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${format(new Date(event.created_at), 'MMM d, yyyy HH:mm')}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Conversion Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #047857; }
          h2 { color: #555; margin-top: 30px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th { background-color: #047857; color: white; padding: 10px; text-align: left; }
          .metrics { display: flex; gap: 20px; margin: 20px 0; }
          .metric { background: #f5f5f5; padding: 15px; border-radius: 8px; flex: 1; }
          .metric-value { font-size: 24px; font-weight: bold; color: #047857; }
          .metric-label { font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Conversion Analytics Report</h1>
        <p>Period: ${dateRangeLabel}</p>
        <p>Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}</p>
        
        <div class="metrics">
          <div class="metric">
            <div class="metric-value">${conversionRate}%</div>
            <div class="metric-label">Conversion Rate</div>
          </div>
          <div class="metric">
            <div class="metric-value">${totalViews}</div>
            <div class="metric-label">Total Visitors</div>
          </div>
          <div class="metric">
            <div class="metric-value">${totalLeads}</div>
            <div class="metric-label">Total Leads</div>
          </div>
        </div>
        
        <h2>Event Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Event Type</th>
              <th style="text-align: right;">Count</th>
            </tr>
          </thead>
          <tbody>${summaryRows}</tbody>
        </table>
        
        <h2>Recent Events (Last 50)</h2>
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Type</th>
              <th>Source</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${eventRows}</tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading && !events.length) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Picker and External Links */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 justify-start min-w-[260px]">
              <CalendarDays className="h-4 w-4" />
              {dateRangeLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex flex-wrap gap-2">
                {PRESET_RANGES.map((preset) => (
                  <Button
                    key={preset.days}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(preset.days)}
                    className="text-xs"
                  >
                    {t(`tracking.preset${preset.days}`, preset.label)}
                  </Button>
                ))}
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range) => range && setDateRange(range)}
              numberOfMonths={2}
              disabled={(date) => date > new Date()}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* External Dashboard Links */}
        {metaPixelId && (
          <Button variant="outline" asChild>
            <a 
              href="https://business.facebook.com/events_manager" 
              target="_blank" 
              rel="noopener noreferrer"
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {t('tracking.openMetaDashboard', 'Open Meta Events Manager')}
            </a>
          </Button>
        )}
        {googleAnalyticsId && (
          <Button variant="outline" asChild>
            <a 
              href="https://analytics.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {t('tracking.openGoogleAnalytics', 'Open Google Analytics')}
            </a>
          </Button>
        )}

        {/* Export Buttons */}
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            {t('tracking.exportCSV', 'Export CSV')}
          </Button>
          <Button variant="outline" onClick={exportToPDF} className="gap-2">
            <Download className="h-4 w-4" />
            {t('tracking.exportPDF', 'Export PDF')}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {eventSummaries.map((summary) => {
          const Icon = summary.icon;
          return (
            <Card key={summary.type}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="p-2 rounded-lg" 
                    style={{ backgroundColor: `${summary.color}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: summary.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold">{summary.count}</div>
                <div className="text-xs text-muted-foreground">
                  {EVENT_CONFIG[summary.type]?.label || summary.type}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">{t('tracking.conversionRate', 'Conversion Rate')}</span>
            </div>
            <div className="text-3xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('tracking.viewsToLeads', 'Profile views to leads')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">{t('tracking.totalVisitors', 'Total Visitors')}</span>
            </div>
            <div className="text-3xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('tracking.selectedPeriod', 'Selected period')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">{t('tracking.totalLeads', 'Total Leads')}</span>
            </div>
            <div className="text-3xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('tracking.quotesMessagesPhones', 'Quotes, messages & calls')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('tracking.dailyActivity', 'Daily Activity')}</CardTitle>
            <CardDescription>
              {t('tracking.lastXDays', { count: chartDays, defaultValue: `Last ${chartDays} days` })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="views" name="Views" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leads" name="Leads" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Event Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('tracking.eventDistribution', 'Event Distribution')}</CardTitle>
            <CardDescription>{t('tracking.byType', 'By event type')}</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                {t('tracking.noData', 'No conversion data yet')}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }} 
                  />
                  <span className="text-xs">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('tracking.recentEvents', 'Recent Events')}</CardTitle>
          <CardDescription>{t('tracking.last20Events', 'Last 20 conversion events')}</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tracking.event', 'Event')}</TableHead>
                  <TableHead>{t('tracking.type', 'Type')}</TableHead>
                  <TableHead>{t('tracking.source', 'Source')}</TableHead>
                  <TableHead>{t('tracking.date', 'Date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 20).map((event) => {
                  const config = EVENT_CONFIG[event.event_name];
                  const Icon = config?.icon || Eye;
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{config?.label || event.event_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{event.event_type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {event.source || 'direct'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(event.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('tracking.noEventsYet', 'No conversion events recorded yet. Events will appear here as visitors interact with your profile.')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Report Scheduler */}
      <AnalyticsReportScheduler />
    </div>
  );
}