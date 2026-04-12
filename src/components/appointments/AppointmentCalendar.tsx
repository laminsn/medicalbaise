import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Video,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/currency';
import { useStartConversation } from '@/hooks/useMessages';
import { useNavigate } from 'react-router-dom';

interface Props {
  doctorId: string;
  doctorName: string;
  consultationFee: number | null;
  consultationDuration: number | null;
  teleconsultationAvailable: boolean;
}

interface AvailabilityRow {
  day_of_week: number;
  is_available: boolean | null;
  start_time: string | null;
  end_time: string | null;
}

interface SlotMeta {
  slotDuration: number;
  teleconsultation: boolean;
}

type AppointmentType = 'in_person' | 'teleconsult';

interface BookedSlot {
  slotDate: string; // 'YYYY-MM-DD'
  slotTime: string; // 'HH:MM'
}

interface ConfirmedBooking {
  conversationId: string;
  slotDate: string;
  slotTime: string;
  appointmentType: AppointmentType;
  doctorName: string;
  fee: number | null;
}

/** Convert a JS Date weekday (0=Sunday) to DB day_of_week (Mon=1…Sun=0). */
function jsDayToDbDay(jsDay: number): number {
  return jsDay === 0 ? 0 : jsDay;
}

function generateTimeSlots(startTime: string, endTime: string, durationMins: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;
  while (current + durationMins <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    current += durationMins;
  }
  return slots;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function AppointmentCalendar({
  doctorId,
  doctorName,
  consultationFee,
  consultationDuration,
  teleconsultationAvailable,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { startConversation } = useStartConversation();
  const navigate = useNavigate();

  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [slotMeta, setSlotMeta] = useState<Record<number, SlotMeta>>({});
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('in_person');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);

  const [dateOffset, setDateOffset] = useState(0); // page index for date strip

  const DAYS_VISIBLE = 7;
  const TOTAL_DAYS = 14;

  // Build the next 14 days starting from today
  const allDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const visibleDates = allDates.slice(dateOffset, dateOffset + DAYS_VISIBLE);

  // Load availability from DB
  useEffect(() => {
    const load = async () => {
      setLoadingAvailability(true);

      const { data: avRows } = await supabase
        .from('provider_availability')
        .select('day_of_week, is_available, start_time, end_time')
        .eq('provider_id', doctorId);

      if (avRows) setAvailability(avRows);

      // Load slot meta from localStorage (saved by DoctorAvailability component)
      const raw = localStorage.getItem(`availability_meta_${doctorId}`);
      if (raw) {
        try {
          setSlotMeta(JSON.parse(raw));
        } catch {
          // ignore parse errors
        }
      }

      // Load booked slots: query messages with appointment booking marker
      const { data: msgs } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', doctorId); // This is refined below

      // Load booked slots via conversations linked to this provider
      const { data: convos } = await supabase
        .from('conversations')
        .select('id')
        .eq('provider_id', doctorId);

      if (convos && convos.length > 0) {
        const convoIds = convos.map((c) => c.id);
        const { data: bookedMsgs } = await supabase
          .from('messages')
          .select('content')
          .in('conversation_id', convoIds);

        if (bookedMsgs) {
          const parsed: BookedSlot[] = [];
          for (const msg of bookedMsgs) {
            try {
              const obj = JSON.parse(msg.content);
              if (obj.__type === 'appointment_booking' && obj.slot_date && obj.slot_time) {
                parsed.push({ slotDate: obj.slot_date, slotTime: obj.slot_time });
              }
            } catch {
              // plain text message, skip
            }
          }
          setBookedSlots(parsed);
        }
      }

      setLoadingAvailability(false);
    };

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  // Compute available slots for selectedDate
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dbDay = jsDayToDbDay(selectedDate.getDay());
    const avRow = availability.find((r) => r.day_of_week === dbDay);
    if (!avRow || !avRow.is_available || !avRow.start_time || !avRow.end_time) return [];

    const meta = slotMeta[dbDay];
    const duration = meta?.slotDuration ?? consultationDuration ?? 30;
    const allSlots = generateTimeSlots(avRow.start_time, avRow.end_time, duration);
    const dateStr = toDateString(selectedDate);
    return allSlots.filter(
      (slot) => !bookedSlots.some((b) => b.slotDate === dateStr && b.slotTime === slot),
    );
  }, [selectedDate, availability, slotMeta, bookedSlots, consultationDuration]);

  const isDayAvailable = (date: Date): boolean => {
    const dbDay = jsDayToDbDay(date.getDay());
    const avRow = availability.find((r) => r.day_of_week === dbDay);
    return !!(avRow?.is_available);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleConfirm = async () => {
    if (!user || !selectedDate || !selectedSlot) return;
    setSubmitting(true);

    try {
      const conversationId = await startConversation(doctorId);
      if (!conversationId) throw new Error('Failed to start conversation');

      const bookingPayload = {
        __type: 'appointment_booking',
        slot_date: toDateString(selectedDate),
        slot_time: selectedSlot,
        appointment_type: appointmentType,
        status: 'confirmed',
        notes: notes.trim(),
        doctor_name: doctorName,
        fee: consultationFee,
      };

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: JSON.stringify(bookingPayload),
      });

      if (error) throw error;

      setConfirmed({
        conversationId,
        slotDate: toDateString(selectedDate),
        slotTime: selectedSlot,
        appointmentType,
        doctorName,
        fee: consultationFee,
      });

      // Mark slot as booked optimistically
      setBookedSlots((prev) => [
        ...prev,
        { slotDate: toDateString(selectedDate), slotTime: selectedSlot },
      ]);

      toast({ title: 'Appointment confirmed!', description: `Booked for ${formatDateLabel(selectedDate)} at ${selectedSlot}` });
    } catch {
      toast({ title: 'Error', description: 'Could not confirm appointment.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!confirmed) return;
    const start = `${confirmed.slotDate.replace(/-/g, '')}T${confirmed.slotTime.replace(':', '')}00`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Appointment+with+${encodeURIComponent(confirmed.doctorName)}&dates=${start}/${start}&details=${encodeURIComponent(confirmed.appointmentType === 'teleconsult' ? 'Teleconsultation' : 'In-person appointment')}`;
    window.open(url, '_blank');
  };

  if (loadingAvailability) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="p-4 bg-green-500/10 rounded-full">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Appointment Confirmed</h3>
            <p className="text-muted-foreground mt-1">Your booking has been sent to the doctor.</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm text-left space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">
                {new Date(confirmed.slotDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">{confirmed.slotTime}</span>
            </div>
            <div className="flex items-center gap-3">
              {confirmed.appointmentType === 'teleconsult' ? (
                <Video className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <MapPin className="h-4 w-4 text-primary shrink-0" />
              )}
              <span className="text-sm font-medium capitalize">
                {confirmed.appointmentType === 'teleconsult' ? 'Teleconsultation' : 'In-person'}
              </span>
            </div>
            {confirmed.fee ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Fee:</span>
                <span className="text-sm font-semibold text-primary">{formatPrice(confirmed.fee)}</span>
              </div>
            ) : null}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleAddToCalendar} className="gap-2">
              <Calendar className="h-4 w-4" />
              Add to Calendar
            </Button>
            <Button onClick={() => navigate(`/chat/${confirmed.conversationId}`)}>
              View in Chat
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Select Date
          </h4>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={dateOffset === 0}
              onClick={() => setDateOffset((o) => Math.max(0, o - DAYS_VISIBLE))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={dateOffset + DAYS_VISIBLE >= TOTAL_DAYS}
              onClick={() =>
                setDateOffset((o) => Math.min(TOTAL_DAYS - DAYS_VISIBLE, o + DAYS_VISIBLE))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {visibleDates.map((date) => {
            const available = isDayAvailable(date);
            const isSelected =
              selectedDate && toDateString(selectedDate) === toDateString(date);
            return (
              <button
                key={toDateString(date)}
                disabled={!available}
                onClick={() => handleDateSelect(date)}
                className={[
                  'flex flex-col items-center justify-center rounded-xl border px-3 py-2 min-w-[60px] transition-all',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : available
                    ? 'border-border bg-card hover:border-primary hover:bg-primary/5 cursor-pointer'
                    : 'border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed',
                ].join(' ')}
              >
                <span className="text-xs font-medium">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-lg font-bold leading-tight">{date.getDate()}</span>
                <span className="text-xs">
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Available Times — {formatDateLabel(selectedDate)}
          </h4>
          {availableSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No available slots for this day. Please choose another date.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={[
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                    selectedSlot === slot
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary hover:bg-primary/5',
                  ].join(' ')}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation form */}
      {selectedDate && selectedSlot && (
        <div className="space-y-4 border border-border rounded-xl p-4 bg-card">
          <h4 className="font-semibold text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Confirm Appointment
          </h4>

          {/* Appointment type */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Appointment type</p>
            <div className="flex gap-2">
              <button
                onClick={() => setAppointmentType('in_person')}
                className={[
                  'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                  appointmentType === 'in_person'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:border-primary/50',
                ].join(' ')}
              >
                <MapPin className="h-4 w-4" />
                In-person
              </button>
              {teleconsultationAvailable && (
                <button
                  onClick={() => setAppointmentType('teleconsult')}
                  className={[
                    'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                    appointmentType === 'teleconsult'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background hover:border-primary/50',
                  ].join(' ')}
                >
                  <Video className="h-4 w-4" />
                  Teleconsultation
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm text-muted-foreground block mb-1">
              Notes <span className="text-xs">(optional)</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your symptoms or reason for the visit…"
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{formatDateLabel(selectedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{selectedSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="outline" className="text-xs capitalize">
                {appointmentType === 'teleconsult' ? 'Teleconsultation' : 'In-person'}
              </Badge>
            </div>
            {consultationFee ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-semibold text-primary">{formatPrice(consultationFee)}</span>
              </div>
            ) : null}
          </div>

          <Button className="w-full gap-2" onClick={handleConfirm} disabled={submitting || !user}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm Booking
              </>
            )}
          </Button>

          {!user && (
            <p className="text-xs text-center text-muted-foreground">
              You need to be logged in to book an appointment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
