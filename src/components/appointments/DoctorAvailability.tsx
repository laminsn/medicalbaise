import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Clock, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DaySchedule {
  day: string;
  dayOfWeek: number; // 0=Monday … 6=Sunday (matches DB day_of_week convention)
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  teleconsultation: boolean;
}

const DAYS: { label: string; dayOfWeek: number }[] = [
  { label: 'Monday', dayOfWeek: 1 },
  { label: 'Tuesday', dayOfWeek: 2 },
  { label: 'Wednesday', dayOfWeek: 3 },
  { label: 'Thursday', dayOfWeek: 4 },
  { label: 'Friday', dayOfWeek: 5 },
  { label: 'Saturday', dayOfWeek: 6 },
  { label: 'Sunday', dayOfWeek: 0 },
];

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map(({ label, dayOfWeek }) => ({
  day: label,
  dayOfWeek,
  enabled: dayOfWeek >= 1 && dayOfWeek <= 5,
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: 30,
  teleconsultation: true,
}));

export function DoctorAvailability() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedule = async () => {
      if (!user) return;

      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!providerData) return;
      setProviderId(providerData.id);

      const { data: rows } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('provider_id', providerData.id);

      if (!rows || rows.length === 0) return;

      setSchedule((prev) =>
        prev.map((entry) => {
          const row = rows.find((r) => r.day_of_week === entry.dayOfWeek);
          if (!row) return entry;
          return {
            ...entry,
            enabled: row.is_available ?? entry.enabled,
            startTime: row.start_time ?? entry.startTime,
            endTime: row.end_time ?? entry.endTime,
          };
        }),
      );
    };

    loadSchedule();
  }, [user]);

  const updateDay = (index: number, updates: Partial<DaySchedule>) => {
    setSchedule((prev) =>
      prev.map((day, i) => (i === index ? { ...day, ...updates } : day)),
    );
  };

  const handleSave = async () => {
    if (!user || !providerId) return;
    setSaving(true);

    try {
      // Upsert one row per day into provider_availability
      const upsertRows = schedule.map((entry) => ({
        provider_id: providerId,
        day_of_week: entry.dayOfWeek,
        is_available: entry.enabled,
        start_time: entry.startTime,
        end_time: entry.endTime,
      }));

      const { error } = await supabase
        .from('provider_availability')
        .upsert(upsertRows, { onConflict: 'provider_id,day_of_week' });

      if (error) throw error;

      // Also persist slot duration + teleconsultation per-day in local storage
      // as the DB table doesn't have these columns; they're used client-side
      // for slot generation in the calendar component.
      const meta = Object.fromEntries(
        schedule.map((e) => [
          e.dayOfWeek,
          { slotDuration: e.slotDuration, teleconsultation: e.teleconsultation },
        ]),
      );
      localStorage.setItem(`availability_meta_${providerId}`, JSON.stringify(meta));

      toast({ title: 'Schedule saved', description: 'Your availability has been updated.' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save schedule.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Weekly Availability
        </h3>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>

      <div className="space-y-3">
        {schedule.map((day, i) => (
          <div
            key={day.day}
            className="flex flex-wrap items-center gap-3 p-3 bg-card border border-border rounded-lg"
          >
            <label className="flex items-center gap-2 w-28 shrink-0">
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={(e) => updateDay(i, { enabled: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm font-medium">{day.day.slice(0, 3)}</span>
            </label>

            {day.enabled ? (
              <>
                <input
                  type="time"
                  value={day.startTime}
                  onChange={(e) => updateDay(i, { startTime: e.target.value })}
                  className="px-2 py-1 bg-background border border-border rounded text-sm"
                />
                <span className="text-muted-foreground text-sm">to</span>
                <input
                  type="time"
                  value={day.endTime}
                  onChange={(e) => updateDay(i, { endTime: e.target.value })}
                  className="px-2 py-1 bg-background border border-border rounded text-sm"
                />
                <select
                  value={day.slotDuration}
                  onChange={(e) => updateDay(i, { slotDuration: Number(e.target.value) })}
                  className="px-2 py-1 bg-background border border-border rounded text-sm"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={day.teleconsultation}
                    onChange={(e) => updateDay(i, { teleconsultation: e.target.checked })}
                    className="h-3 w-3"
                  />
                  Video
                </label>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Unavailable</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
