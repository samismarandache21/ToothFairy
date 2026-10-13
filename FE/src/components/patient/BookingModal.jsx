// src/components/patient/BookingModal.jsx

import { useState, useEffect, useMemo } from 'react';
import { LuX, LuCheck, LuStethoscope, LuCalendarDays, LuClock, LuMapPin, LuUser, LuInfo } from 'react-icons/lu';
import usePatientAuth from '../../hooks/usePatientAuth';
import AvailabilityCalendar from './AvailabilityCalendar';
import { publicApi, patientAuthApi } from '../../lib/api';

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');
const DAYS_AHEAD = 90;

const toISO = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const BookingModal = ({
  dentist,
  onClose,
  preSelectedService = null,
}) => {
  const { patient } = usePatientAuth();
  const [isNewPatient,         setIsNewPatient]         = useState(false);
  const [isNewPatientChecking, setIsNewPatientChecking] = useState(false);

  useEffect(() => {
    if (!patient) {
      setIsNewPatient(false);
      setIsNewPatientChecking(false);
      return;
    }
    setIsNewPatientChecking(true);
    patientAuthApi.getBookings()
      .then((res) => {
        const hasBooking = res.data.some(
          (b) => b.cabinetSlug === dentist.slug && b.status !== 'cancelled'
        );
        setIsNewPatient(!hasBooking);
      })
      .catch(() => setIsNewPatient(false))
      .finally(() => setIsNewPatientChecking(false));
  }, [patient, dentist.slug]);

  // Steps: 0=service, 1=slot, 2=confirm, 3=done
  const [step, setStep]                       = useState(preSelectedService ? 1 : 0);
  const [selectedService, setSelectedService] = useState(preSelectedService);

  // ── Derived durations (must be before the slots useEffect) ──────────────────
  const consultSvc    = dentist.services.find((s) => s.isConsultation);
  const autoConsult   = isNewPatient && selectedService?.requiresConsultForNew && consultSvc;
  const totalPrice    = (selectedService?.price           || 0) + (autoConsult ? consultSvc.price           : 0);
  const totalDuration = (selectedService?.durationMinutes || 0) + (autoConsult ? consultSvc.durationMinutes : 0);

  // ── Slot selection ──────────────────────────────────────────────────────────
  const days = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const [selectedDay,    setSelectedDay]    = useState(0);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot,   setSelectedSlot]   = useState(null);
  const [slotsLoading,   setSlotsLoading]   = useState(false);

  // Fetch available slots whenever step 1 is entered, day changes, or total duration changes.
  // totalDuration (incl. auto-consult) ensures slots that would extend past closing are excluded.
  useEffect(() => {
    if (step !== 1 || !selectedService || !days[selectedDay]) return;
    setSlotsLoading(true);
    const iso = toISO(days[selectedDay]);
    publicApi.getSlots(dentist.slug, iso, totalDuration || selectedService.durationMinutes)
      .then((res) => { setAvailableSlots(res.data ?? []); setSelectedSlot(null); })
      .catch(() => setAvailableSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [step, selectedService, selectedDay, days, dentist.slug, totalDuration]);

  const slots = useMemo(() => {
    const am = [], pm = [];
    const isToday = selectedDay === 0;
    const now = new Date();
    availableSlots.forEach((timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      if (isToday) {
        const slotMinutes = h * 60 + m;
        const nowMinutes  = now.getHours() * 60 + now.getMinutes();
        if (slotMinutes <= nowMinutes) return;
      }
      const slot = { key: `${toISO(days[selectedDay])} ${timeStr}`, label: timeStr, booked: false };
      if (h < 13) am.push(slot); else pm.push(slot);
    });
    return { am, pm };
  }, [availableSlots, days, selectedDay]);

  // ── Booking ─────────────────────────────────────────────────────────────────
  const [notes,        setNotes]        = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [bookingError, setBookingError] = useState('');

  const slotDisplay = selectedSlot
    ? (() => {
        const [datePart, timePart] = selectedSlot.key.split(' ');
        const d = new Date(datePart);
        return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}, ${timePart}`;
      })()
    : '';

  const handleConfirm = async () => {
    setSubmitting(true);
    setBookingError('');
    try {
      const [datePart, timePart] = selectedSlot.key.split(' ');
      const [yr, mo, dy] = datePart.split('-').map(Number);
      const [hr, min]    = timePart.split(':').map(Number);
      const start = new Date(yr, mo - 1, dy, hr, min, 0);
      const end   = new Date(start.getTime() + totalDuration * 60_000);
      const fmt   = (dt) =>
        `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;

      await publicApi.book(dentist.slug, {
        firstName:       patient?.firstName?.trim() || 'Pacient',
        lastName:        patient?.lastName?.trim()  || '',
        phone:           patient?.phone?.trim()     || '',
        startTime:       fmt(start),
        endTime:         fmt(end),
        treatmentTypeId: selectedService.id,
        notes,
      });
      setStep(3);
    } catch (err) {
      setBookingError(err.response?.data?.message ?? 'Programarea nu a putut fi salvată. Încearcă din nou.');
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_LABELS = ['Serviciu', 'Data și ora', 'Confirmare'];

  return (
    <div className="booking-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="booking-modal">

        {/* Header */}
        <div className="booking-modal__header">
          <div>
            <div className="booking-modal__title">
              {step < 3 ? 'Programare nouă' : 'Programare confirmată!'}
            </div>
            {step < 3 && (
              <div className="booking-modal__subtitle">
                {dentist.title} {dentist.firstName} {dentist.lastName} · {dentist.city}
              </div>
            )}
          </div>
          <button className="booking-modal__close" onClick={onClose}><LuX size={16} /></button>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="booking-steps">
            {STEP_LABELS.map((label, i) => (
              <div
                key={label}
                className={`booking-step${i === step ? ' booking-step--active' : ''}${i < step ? ' booking-step--done' : ''}`}
              >
                <div className="booking-step__dot">
                  {i < step ? <LuCheck size={12} /> : i + 1}
                </div>
                <div className="booking-step__label">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="booking-modal__body">

          {/* ── Step 0: Choose service ── */}
          {step === 0 && (
            <div className="booking-services-list">
              {dentist.services.map((svc) => {
                const willAddConsult = isNewPatient && svc.requiresConsultForNew && consultSvc;
                return (
                  <div
                    key={svc.id}
                    className={`booking-service-option${selectedService?.id === svc.id ? ' booking-service-option--selected' : ''}`}
                    onClick={() => setSelectedService(svc)}
                  >
                    <div className="booking-service-option__dot" style={{ background: svc.color }} />
                    <div style={{ flex: 1 }}>
                      <div className="booking-service-option__name">{svc.name}</div>
                      <div className="booking-service-option__meta">
                        {svc.durationMinutes} min
                        {willAddConsult && (
                          <span style={{ marginLeft: 8, fontSize: 11, background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 20, padding: '1px 7px', fontWeight: 700 }}>
                            + consultație {consultSvc.durationMinutes} min
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="booking-service-option__price">{svc.price} RON</div>
                      {willAddConsult && (
                        <div style={{ fontSize: 11, color: '#D97706' }}>+{consultSvc.price} RON</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {isNewPatient && consultSvc && dentist.services.some((s) => s.requiresConsultForNew) && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400E', display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8 }}>
                  <LuInfo size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Ești pacient nou la Dr. {dentist.lastName}. La serviciile marcate se adaugă automat o <strong>consultație ({consultSvc.durationMinutes} min · {consultSvc.price} RON)</strong>.</span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: Choose date & slot ── */}
          {step === 1 && (
            <div>
              <div style={{
                background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10,
                padding: '10px 14px', marginBottom: 14, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedService.color, flexShrink: 0 }} />
                <span>
                  <strong>{selectedService.name}</strong>
                  {' · '}{selectedService.durationMinutes} min · {selectedService.price} RON
                  {autoConsult && (
                    <span style={{ color: '#D97706' }}> +consultație {consultSvc.durationMinutes} min</span>
                  )}
                </span>
              </div>
              {slotsLoading
                ? <p style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '24px 0' }}>Se încarcă orele disponibile...</p>
                : <AvailabilityCalendar
                    days={days}
                    selectedDay={selectedDay}
                    onSelectDay={setSelectedDay}
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                  />
              }
            </div>
          )}

          {/* ── Step 2: Confirm ── */}
          {step === 2 && (
            <>
              <div className="booking-summary">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LuStethoscope size={13} color="#2DD4BF" />
                  <strong>{selectedService?.name}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LuCalendarDays size={13} color="#6366F1" />
                  {slotDisplay}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LuClock size={13} color="#6B7280" />
                  {totalDuration} min · <strong>{totalPrice} RON</strong>
                </div>
              </div>
              <div className="booking-form" style={{ marginTop: 16 }}>
                <div className="form-group">
                  <label>Observații (opțional)</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: alergii, frică de ace..."
                  />
                </div>
                {bookingError && (
                  <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                    {bookingError}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <div className="booking-confirmation">
              <div className="booking-confirmation__icon">
                <LuStethoscope size={32} color="#2DD4BF" />
              </div>
              <div className="booking-confirmation__title">Programare confirmată!</div>
              <div className="booking-confirmation__text">
                Vei primi o confirmare pe email și un SMS de reminder cu 24h înainte.
              </div>
              <div className="booking-confirmation__card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LuStethoscope size={13} color="#2DD4BF" />
                  <strong>{selectedService?.name}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LuUser size={13} color="#6B7280" />
                  {dentist.title} {dentist.firstName} {dentist.lastName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LuMapPin size={13} color="#6B7280" />
                  {dentist.address}, {dentist.city}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LuCalendarDays size={13} color="#6366F1" />
                  {slotDisplay}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LuClock size={13} color="#6B7280" />
                  {totalDuration} min · <strong>{totalPrice} RON</strong>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="booking-modal__footer">
          {step === 1 && (
            <button className="booking-btn-back" onClick={() => { setStep(0); setSelectedSlot(null); }}>← Înapoi</button>
          )}
          {step === 2 && (
            <button className="booking-btn-back" onClick={() => setStep(1)}>← Înapoi</button>
          )}
          {step === 0 && (
            <button
              className="booking-btn-next"
              onClick={() => setStep(1)}
              disabled={!selectedService || isNewPatientChecking}
            >
              {isNewPatientChecking ? 'Se verifică...' : 'Continuă →'}
            </button>
          )}
          {step === 1 && (
            <button
              className="booking-btn-next"
              onClick={() => setStep(2)}
              disabled={!selectedSlot}
            >
              Continuă →
            </button>
          )}
          {step === 2 && (
            <button
              className="booking-btn-next"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? 'Se trimite...' : 'Confirmă programarea'}
            </button>
          )}
          {step === 3 && (
            <button className="booking-btn-next" onClick={onClose}>Închide</button>
          )}
        </div>

      </div>
    </div>
  );
};

export default BookingModal;
