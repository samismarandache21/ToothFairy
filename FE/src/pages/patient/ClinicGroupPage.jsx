// src/pages/patient/ClinicGroupPage.jsx

import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LuMapPin, LuPhone, LuMail, LuCalendarDays, LuStar, LuUsers,
  LuSun, LuCloud, LuCheck, LuChevronDown, LuChevronRight,
  LuStethoscope, LuClock, LuUser,
} from 'react-icons/lu';
import useClinicGroup from '../../hooks/useClinicGroup';
import MapView        from '../../components/ui/MapView';
import PatientTopbar  from '../../components/patient/PatientTopbar';
import usePatientAuth from '../../hooks/usePatientAuth';
import { publicApi }  from '../../lib/api';

import '../../styles/globals.css';
import '../../styles/patient-portal.css';

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const DAY_NAMES   = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parseSpecs    = (raw) => { try { return JSON.parse(raw ?? '[]'); } catch { return []; } };
const RO_DAYS_ORDER = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

const ClinicGroupPage = () => {
  const navigate       = useNavigate();
  const { state }      = useLocation();
  const { patient }    = usePatientAuth();
  const rawMembers     = state?.groupMembers ?? [];

  const clinicContact = state?.clinicContact ?? null;

  const { enrichedMembers, days, selectedDay, setSelectedDay } = useClinicGroup(rawMembers);

  const primary = (enrichedMembers.length > 0 ? enrichedMembers : rawMembers).reduce(
    (best, m) => Number(m.rating ?? 0) > Number(best.rating ?? 0) ? m : best,
    (enrichedMembers.length > 0 ? enrichedMembers : rawMembers)[0] ?? {}
  );

  // Union schedule: earliest open time and latest close time across all members, per day
  const unionSchedule = useMemo(() => {
    const members = enrichedMembers.length > 0 ? enrichedMembers : rawMembers;
    const dayMap = {};
    members.forEach((m) => {
      let parsed = null;
      try { parsed = JSON.parse(m.workingHours ?? 'null'); } catch { /* ignore */ }
      if (!Array.isArray(parsed)) return;
      parsed.forEach((entry) => {
        if (!entry.open) return;
        if (!dayMap[entry.day]) {
          dayMap[entry.day] = { day: entry.day, open: true, start: entry.start, end: entry.end };
        } else {
          if (entry.start < dayMap[entry.day].start) dayMap[entry.day].start = entry.start;
          if (entry.end   > dayMap[entry.day].end)   dayMap[entry.day].end   = entry.end;
        }
      });
    });
    return RO_DAYS_ORDER.map((day) => dayMap[day] ?? { day, open: false, start: '08:00', end: '18:00' });
  }, [enrichedMembers, rawMembers]);

  // Weighted average rating across all members
  const { avgRating, totalReviews } = useMemo(() => {
    const members = enrichedMembers.length > 0 ? enrichedMembers : rawMembers;
    const totalReviews = members.reduce((s, m) => s + (Number(m.reviewCount) || 0), 0);
    if (totalReviews === 0) return { avgRating: Number(primary.rating) || 0, totalReviews: Number(primary.reviewCount) || 0 };
    const weightedSum = members.reduce((s, m) => s + (Number(m.rating) || 0) * (Number(m.reviewCount) || 0), 0);
    return { avgRating: weightedSum / totalReviews, totalReviews };
  }, [enrichedMembers, rawMembers, primary]);

  // ── Booking flow state ──────────────────────────────────────────────────────
  const [step,                 setStep]                 = useState(0);
  const [selectedDoctorSlugs,  setSelectedDoctorSlugs]  = useState(new Set()); // empty = all
  const [expandedService,      setExpandedService]      = useState(null); // service name
  const [selectedService,      setSelectedService]      = useState(null);
  // selectedService = { name, isConsultation, doctors: [{slug, firstName, lastName, price, durationMinutes, serviceId, color}] }

  const [slotAvailability,     setSlotAvailability]     = useState({}); // { "HH:MM": [doctorObj, ...] }
  const [slotsLoading,         setSlotsLoading]         = useState(false);
  const [selectedSlot,         setSelectedSlot]         = useState(null);   // "HH:MM"
  const [selectedSlotDate,     setSelectedSlotDate]     = useState(null);   // "YYYY-MM-DD"
  const [selectedDoctor,       setSelectedDoctor]       = useState(null);   // doctorObj
  const [showDoctorPicker,     setShowDoctorPicker]     = useState(false);

  const [notes,        setNotes]        = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [bookingError, setBookingError] = useState('');

  const toggleDoctor = (slug) => {
    setSelectedDoctorSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
    setSelectedService(null);
    setExpandedService(null);
  };

  // ── Aggregate services across members ──────────────────────────────────────
  const aggregatedServices = useMemo(() => {
    const relevant = selectedDoctorSlugs.size > 0
      ? enrichedMembers.filter((m) => selectedDoctorSlugs.has(m.slug))
      : enrichedMembers;

    const map = new Map();
    relevant.forEach((member) => {
      (member.services ?? []).forEach((svc) => {
        const key = svc.name.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, { name: svc.name, isConsultation: svc.isConsultation ?? false, doctors: [] });
        }
        map.get(key).doctors.push({
          slug:            member.slug,
          firstName:       member.firstName,
          lastName:        member.lastName,
          price:           svc.price,
          durationMinutes: svc.durationMinutes,
          serviceId:       svc.id,
          color:           svc.color,
        });
      });
    });
    return Array.from(map.values());
  }, [enrichedMembers, selectedDoctorSlugs]);

  // ── Fetch slots when entering step 1 or day changes ────────────────────────
  useEffect(() => {
    if (step !== 1 || !selectedService || !days[selectedDay]) return;
    setSlotsLoading(true);
    setSlotAvailability({});
    setSelectedSlot(null);
    setSelectedDoctor(null);
    setShowDoctorPicker(false);

    const iso = toISO(days[selectedDay]);
    setSelectedSlotDate(iso);

    const availability = {};
    const promises = selectedService.doctors.map((doctor) =>
      publicApi.getSlots(doctor.slug, iso, doctor.durationMinutes)
        .then((res) => {
          (res.data ?? []).forEach((timeStr) => {
            if (!availability[timeStr]) availability[timeStr] = [];
            availability[timeStr].push(doctor);
          });
        })
        .catch(() => {})
    );

    Promise.all(promises)
      .then(() => setSlotAvailability({ ...availability }))
      .finally(() => setSlotsLoading(false));
  }, [step, selectedService, selectedDay, days]);

  // ── AM/PM slot lists ────────────────────────────────────────────────────────
  const { amSlots, pmSlots, showLunchSeparator } = useMemo(() => {
    const am = [], pm = [];
    const isToday = selectedDay === 0;
    const now = new Date();
    Object.keys(slotAvailability).sort().forEach((timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      if (isToday) {
        const slotMins = h * 60 + m;
        const nowMins  = now.getHours() * 60 + now.getMinutes();
        if (slotMins <= nowMins) return;
      }
      const entry = { time: timeStr, doctors: slotAvailability[timeStr] };
      if (h < 13) am.push(entry); else pm.push(entry);
    });
    const allTimes = [...am.map((e) => e.time), ...pm.map((e) => e.time)];
    const hasLunchSlots = allTimes.some((t) => t.startsWith('13:'));
    return { amSlots: am, pmSlots: pm, showLunchSeparator: !hasLunchSlots && (am.length > 0 || pm.length > 0) };
  }, [slotAvailability, selectedDay]);

  const handleSlotSelect = (timeStr) => {
    setSelectedSlot(timeStr);
    setSelectedDoctor(null);
    setShowDoctorPicker(false);
    const docs = slotAvailability[timeStr] ?? [];
    if (docs.length === 1) {
      setSelectedDoctor(docs[0]);
    } else if (docs.length > 1) {
      setShowDoctorPicker(true);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDoctor || !selectedSlot || !selectedSlotDate) return;
    setSubmitting(true);
    setBookingError('');
    try {
      const [hr, min]    = selectedSlot.split(':').map(Number);
      const [yr, mo, dy] = selectedSlotDate.split('-').map(Number);
      const start = new Date(yr, mo - 1, dy, hr, min, 0);
      const end   = new Date(start.getTime() + selectedDoctor.durationMinutes * 60_000);
      const fmt   = (dt) =>
        `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;

      await publicApi.book(selectedDoctor.slug, {
        firstName:       patient?.firstName?.trim() || 'Pacient',
        lastName:        patient?.lastName?.trim()  || '',
        phone:           patient?.phone?.trim()     || '',
        startTime:       fmt(start),
        endTime:         fmt(end),
        treatmentTypeId: selectedDoctor.serviceId,
        notes,
      });
      setStep(3);
    } catch (err) {
      setBookingError(err.response?.data?.message ?? 'Programarea nu a putut fi salvată. Încearcă din nou.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (!rawMembers.length) {
    return (
      <div className="clinic-profile-page">
        <PatientTopbar patient={patient} />
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-muted)' }}>
          Clinica nu a fost găsită.
        </div>
      </div>
    );
  }

  const specs       = parseSpecs(primary.specialties);
  const ratingStars = Math.round(avgRating);
  const memberCount = enrichedMembers.length || rawMembers.length;

  // Contact: prefer clinic-level info passed from ClinicCard, fall back to primary
  const contactPhone   = clinicContact?.phone   || primary.phone   || null;
  const contactEmail   = clinicContact?.email   || primary.email   || null;
  const contactAddress = clinicContact?.address || primary.address || null;
  const contactCity    = clinicContact?.city    || primary.city    || null;

  const slotDisplayFull = (selectedSlot && selectedSlotDate)
    ? (() => {
        const d = new Date(selectedSlotDate);
        return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}, ${selectedSlot}`;
      })()
    : '';

  const STEP_LABELS = ['Serviciu', 'Data și ora', 'Confirmare'];

  const canGoToSlots   = !!selectedService;
  const canGoToConfirm = !!selectedSlot && !!selectedDoctor;

  return (
    <div className="clinic-profile-page">
      <PatientTopbar patient={patient} />

      {/* ── Hero ── */}
      <div className="clinic-profile-hero" style={primary.coverPhoto ? {
        backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.45), rgba(15,23,42,0.88)), url(${primary.coverPhoto})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      } : {}}>
        <button className="clinic-profile-hero__back" onClick={() => navigate('/patient/explore')}>
          ← Înapoi la explorare
        </button>
        <div className="clinic-profile-hero__content">
          <div className="clinic-profile-hero__logo animate-fadeUp" style={{ animationDelay: '0ms' }}>
            {primary.name?.[0] ?? 'C'}
          </div>
          <div style={{ flex: 1 }}>
            <div className="clinic-profile-hero__name animate-fadeUp" style={{ animationDelay: '60ms' }}>
              {primary.name}
            </div>
            <div className="clinic-profile-hero__tagline animate-fadeUp" style={{ animationDelay: '100ms' }}>
              {primary.description ?? ''}
            </div>
            <div className="clinic-profile-hero__meta animate-fadeUp" style={{ animationDelay: '140ms' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <LuMapPin size={13} /> {primary.city}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <LuUsers size={13} /> {memberCount} medic{memberCount !== 1 ? 'i' : ''}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#FBBF24' }}>
                {Array.from({ length: ratingStars }).map((_, i) => (
                  <LuStar key={i} size={13} color="#FBBF24" fill="#FBBF24" />
                ))}
              </span>
              <span>{avgRating.toFixed(1)} ({totalReviews} recenzii)</span>
            </div>
          </div>
          <button
            className="clinic-profile-hero__book-btn animate-fadeUp"
            style={{ animationDelay: '200ms' }}
            onClick={() => document.getElementById('clinic-booking')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Programează-te →
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="clinic-profile-body">

        {/* Specialități */}
        {specs.length > 0 && (
          <div className="profile-section animate-fadeUp">
            <div className="profile-section__title">Specialități</div>
            <div className="clinic-specialties-grid">
              {specs.map((s, i) => (
                <div key={i} className="clinic-specialty-card" style={{ background: '#D1FAE5' }}>
                  <div className="clinic-specialty-card__name">{s}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Booking Flow ── */}
        <div id="clinic-booking" className="profile-section animate-fadeUp">
          <div className="profile-section__title">Programare online</div>

          {/* Step progress bar */}
          {step < 3 && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
              {STEP_LABELS.map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      background: i < step ? '#2DD4BF' : i === step ? '#0F172A' : '#E2E8F0',
                      color: i <= step ? '#fff' : '#94A3B8',
                    }}>
                      {i < step ? <LuCheck size={13} /> : i + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', color: i === step ? '#0F172A' : '#94A3B8' }}>
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div style={{ flex: 1, height: 1, background: i < step ? '#2DD4BF' : '#E2E8F0', margin: '0 12px' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Step 0: Service selection ── */}
          {step === 0 && (
            <div>
              {/* Doctor filter */}
              {enrichedMembers.length > 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {/* "Toți medicii" clears selection */}
                  <button
                    onClick={() => { setSelectedDoctorSlugs(new Set()); setSelectedService(null); setExpandedService(null); }}
                    style={{
                      padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s', outline: 'none',
                      border: selectedDoctorSlugs.size === 0 ? '2px solid #2DD4BF' : '1.5px solid #E2E8F0',
                      background: selectedDoctorSlugs.size === 0 ? '#F0FDFA' : '#fff',
                      color: selectedDoctorSlugs.size === 0 ? '#0F766E' : '#374151',
                    }}
                  >
                    Toți medicii
                  </button>
                  {enrichedMembers.map((m) => {
                    const active = selectedDoctorSlugs.has(m.slug);
                    return (
                      <button
                        key={m.slug}
                        onClick={() => toggleDoctor(m.slug)}
                        style={{
                          padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s', outline: 'none',
                          border: active ? '2px solid #6366F1' : '1.5px solid #E2E8F0',
                          background: active ? '#EEF2FF' : '#fff',
                          color: active ? '#4338CA' : '#374151',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        {active && <LuCheck size={12} color="#4338CA" />}
                        Dr. {m.firstName} {m.lastName}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Services accordion */}
              {enrichedMembers.length === 0
                ? <p style={{ color: 'var(--color-muted)', fontSize: 14, padding: '12px 0' }}>Se încarcă serviciile...</p>
                : aggregatedServices.length === 0
                  ? <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Niciun serviciu disponibil.</p>
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                      {aggregatedServices.map((svcGroup) => {
                        const isSelected = selectedService?.name.toLowerCase() === svcGroup.name.toLowerCase();
                        const isExpanded = expandedService === svcGroup.name;
                        return (
                          <div
                            key={svcGroup.name}
                            style={{
                              border: isSelected ? '2px solid #2DD4BF' : '1.5px solid #E2E8F0',
                              borderRadius: 10, overflow: 'hidden',
                              background: isSelected ? '#F0FDFA' : '#fff',
                              transition: 'border-color 0.15s, background 0.15s',
                            }}
                          >
                            {/* Header row */}
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                              onClick={() => setExpandedService(isExpanded ? null : svcGroup.name)}
                            >
                              <input
                                type="radio"
                                name="service-select"
                                checked={isSelected}
                                onChange={() => {}}
                                onClick={(e) => { e.stopPropagation(); setSelectedService(isSelected ? null : svcGroup); }}
                                style={{ width: 16, height: 16, accentColor: '#2DD4BF', flexShrink: 0, cursor: 'pointer' }}
                              />
                              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#111827' }}>
                                {svcGroup.name}
                                {svcGroup.isConsultation && (
                                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, background: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4', borderRadius: 20, padding: '1px 7px' }}>
                                    Consultație
                                  </span>
                                )}
                              </span>
                              <span style={{ fontSize: 12, color: '#9CA3AF', marginRight: 6 }}>
                                {svcGroup.doctors.length} medic{svcGroup.doctors.length !== 1 ? 'i' : ''}
                              </span>
                              {isExpanded
                                ? <LuChevronDown size={15} color="#9CA3AF" />
                                : <LuChevronRight size={15} color="#9CA3AF" />
                              }
                            </div>

                            {/* Expanded doctor list */}
                            {isExpanded && (
                              <div style={{ borderTop: '1px solid #F3F4F6', padding: '4px 16px 12px' }}>
                                {svcGroup.doctors.map((doc) => (
                                  <div key={doc.slug} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 0', borderBottom: '1px solid #F9FAFB',
                                  }}>
                                    <div style={{
                                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                      background: (doc.color ?? '#6366F1') + '22',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 11, fontWeight: 700, color: doc.color ?? '#6366F1',
                                    }}>
                                      {doc.firstName[0]}{doc.lastName[0]}
                                    </div>
                                    <span style={{ flex: 1, fontSize: 13, color: '#374151', fontWeight: 500 }}>
                                      Dr. {doc.firstName} {doc.lastName}
                                    </span>
                                    <span style={{ fontSize: 12, color: '#6B7280', marginRight: 12 }}>
                                      {doc.durationMinutes} min
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 64, textAlign: 'right' }}>
                                      {doc.price} RON
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
              }

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  disabled={!canGoToSlots}
                  onClick={() => { setStep(1); setSelectedDay(0); }}
                  style={{
                    padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                    border: 'none', cursor: canGoToSlots ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                    background: canGoToSlots ? 'linear-gradient(135deg, #0F766E, #2DD4BF)' : '#E2E8F0',
                    color: canGoToSlots ? '#fff' : '#94A3B8',
                    boxShadow: canGoToSlots ? '0 4px 14px rgba(45,212,191,0.35)' : 'none',
                  }}
                >
                  Continuă →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Date + slot + doctor selection ── */}
          {step === 1 && (
            <div>
              {/* Service chip */}
              <div style={{
                background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10,
                padding: '10px 14px', marginBottom: 16, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <LuStethoscope size={14} color="#2DD4BF" />
                <strong>{selectedService.name}</strong>
                <span style={{ color: '#0F766E' }}>
                  · {selectedService.doctors.length} medic{selectedService.doctors.length !== 1 ? 'i' : ''} disponibil{selectedService.doctors.length !== 1 ? 'i' : ''}
                </span>
              </div>

              {/* Date strip */}
              <div className="avail-calendar__days-strip" style={{ marginBottom: 16 }}>
                {days.map((day, i) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <button
                      key={i}
                      className={`avail-day-btn${selectedDay === i ? ' avail-day-btn--selected' : ''}${isToday ? ' avail-day-btn--today' : ''}`}
                      onClick={() => setSelectedDay(i)}
                    >
                      <div className="avail-day-label">{DAY_NAMES[day.getDay()]}</div>
                      <div className="avail-day-num">{day.getDate()}</div>
                      <div className="avail-day-label">{MONTH_NAMES[day.getMonth()]}</div>
                    </button>
                  );
                })}
              </div>

              {/* Slots */}
              {slotsLoading
                ? <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '20px 0' }}>Se încarcă orele disponibile...</p>
                : (
                  <>
                    {amSlots.length > 0 && (
                      <div className="avail-period" style={{ marginBottom: 12 }}>
                        <div className="avail-period__label">
                          <LuSun size={13} style={{ marginRight: 5, color: '#F59E0B' }} /> Dimineața
                        </div>
                        <div className="avail-slots-row">
                          {amSlots.map(({ time, doctors }) => (
                            <button
                              key={time}
                              className={`avail-slot-btn${selectedSlot === time ? ' avail-slot-btn--selected' : ''}`}
                              onClick={() => handleSlotSelect(time)}
                            >
                              {time}
                              {doctors.length > 1 && (
                                <span style={{ marginLeft: 4, fontSize: 9, background: '#6366F120', color: '#6366F1', borderRadius: 8, padding: '0 4px', fontWeight: 700 }}>
                                  ×{doctors.length}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {showLunchSeparator && (
                      <div className="avail-lunch-break">
                        <span className="avail-lunch-break__icon">🍽️</span>
                        <span>Pauză de masă</span>
                      </div>
                    )}

                    {pmSlots.length > 0 && (
                      <div className="avail-period" style={{ marginBottom: 12 }}>
                        <div className="avail-period__label">
                          <LuCloud size={13} style={{ marginRight: 5, color: '#6366F1' }} /> După-amiaza
                        </div>
                        <div className="avail-slots-row">
                          {pmSlots.map(({ time, doctors }) => (
                            <button
                              key={time}
                              className={`avail-slot-btn${selectedSlot === time ? ' avail-slot-btn--selected' : ''}`}
                              onClick={() => handleSlotSelect(time)}
                            >
                              {time}
                              {doctors.length > 1 && (
                                <span style={{ marginLeft: 4, fontSize: 9, background: '#6366F120', color: '#6366F1', borderRadius: 8, padding: '0 4px', fontWeight: 700 }}>
                                  ×{doctors.length}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {amSlots.length === 0 && pmSlots.length === 0 && (
                      <p className="avail-no-slots">Nicio disponibilitate în această zi.</p>
                    )}

                    {/* Doctor picker — shown only when multiple doctors share the selected slot */}
                    {showDoctorPicker && selectedSlot && (
                      <div style={{
                        marginTop: 16, background: '#FFFBEB', border: '1px solid #FDE68A',
                        borderRadius: 10, padding: '14px 16px',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 12 }}>
                          Mai mulți medici sunt disponibili la ora {selectedSlot}. Alege:
                        </div>
                        {(slotAvailability[selectedSlot] ?? []).map((doc) => (
                          <label
                            key={doc.slug}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '10px 12px', marginBottom: 6, borderRadius: 8, cursor: 'pointer',
                              background: selectedDoctor?.slug === doc.slug ? '#FEF3C7' : '#fff',
                              border: `1.5px solid ${selectedDoctor?.slug === doc.slug ? '#FCD34D' : '#F3F4F6'}`,
                              transition: 'all 0.15s',
                            }}
                          >
                            <input
                              type="radio"
                              name="doctor-pick"
                              checked={selectedDoctor?.slug === doc.slug}
                              onChange={() => setSelectedDoctor(doc)}
                              style={{ accentColor: '#F59E0B', flexShrink: 0 }}
                            />
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                              background: (doc.color ?? '#6366F1') + '22',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: doc.color ?? '#6366F1',
                            }}>
                              {doc.firstName[0]}{doc.lastName[0]}
                            </div>
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#111827' }}>
                              Dr. {doc.firstName} {doc.lastName}
                            </span>
                            <span style={{ fontSize: 12, color: '#6B7280', marginRight: 8 }}>{doc.durationMinutes} min</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>{doc.price} RON</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                )
              }

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                <button
                  onClick={() => { setStep(0); setSelectedSlot(null); setSelectedDoctor(null); setShowDoctorPicker(false); }}
                  style={{ padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: '#fff', border: '1.5px solid #E2E8F0', color: '#374151', cursor: 'pointer' }}
                >
                  ← Înapoi
                </button>
                <button
                  disabled={!canGoToConfirm}
                  onClick={() => setStep(2)}
                  style={{
                    padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                    border: 'none', cursor: canGoToConfirm ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                    background: canGoToConfirm ? 'linear-gradient(135deg, #0F766E, #2DD4BF)' : '#E2E8F0',
                    color: canGoToConfirm ? '#fff' : '#94A3B8',
                    boxShadow: canGoToConfirm ? '0 4px 14px rgba(45,212,191,0.35)' : 'none',
                  }}
                >
                  Continuă →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Confirm ── */}
          {step === 2 && (
            <div>
              <div style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
                padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <LuStethoscope size={14} color="#2DD4BF" />
                  <strong>{selectedService?.name}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <LuUser size={14} color="#6B7280" />
                  Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <LuCalendarDays size={14} color="#6366F1" />
                  {slotDisplayFull}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <LuClock size={14} color="#6B7280" />
                  {selectedDoctor?.durationMinutes} min · <strong>{selectedDoctor?.price} RON</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Observații (opțional)</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: alergii, frică de ace..."
                />
              </div>

              {bookingError && (
                <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
                  {bookingError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: '#fff', border: '1.5px solid #E2E8F0', color: '#374151', cursor: 'pointer' }}
                >
                  ← Înapoi
                </button>
                <button
                  disabled={submitting}
                  onClick={handleConfirm}
                  style={{
                    padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                    border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                    background: 'linear-gradient(135deg, #0F766E, #2DD4BF)', color: '#fff',
                    boxShadow: '0 4px 14px rgba(45,212,191,0.35)', opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Se trimite...' : 'Confirmă programarea'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#F0FDFA', border: '2px solid #2DD4BF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <LuCheck size={28} color="#2DD4BF" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                Programare confirmată!
              </div>
              <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
                Vei primi o confirmare pe email și un SMS de reminder cu 24h înainte.
              </div>
              <div style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
                padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
                textAlign: 'left', maxWidth: 380, margin: '0 auto 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <LuStethoscope size={14} color="#2DD4BF" />
                  <strong>{selectedService?.name}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <LuUser size={14} color="#6B7280" />
                  Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <LuMapPin size={14} color="#6B7280" />
                  {contactAddress}{contactCity ? `, ${contactCity}` : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <LuCalendarDays size={14} color="#6366F1" />
                  {slotDisplayFull}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <LuClock size={14} color="#6B7280" />
                  {selectedDoctor?.durationMinutes} min · <strong>{selectedDoctor?.price} RON</strong>
                </div>
              </div>
              <button
                onClick={() => navigate('/patient/explore')}
                style={{ padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#F0FDFA', border: '1.5px solid #2DD4BF', color: '#0F766E', cursor: 'pointer' }}
              >
                Înapoi la explorare
              </button>
            </div>
          )}
        </div>

        {/* ── Contact ── */}
        <div className="profile-section animate-fadeUp">
          <div className="profile-section__title">Contact și program</div>
          <div className="clinic-contact-grid">
            <div className="clinic-contact-info">
              {contactAddress && (
                <div className="clinic-contact-item">
                  <LuMapPin size={14} style={{ marginRight: 6, flexShrink: 0 }} />
                  {contactAddress}{contactCity ? `, ${contactCity}` : ''}
                </div>
              )}
              {contactPhone && (
                <div className="clinic-contact-item">
                  <LuPhone size={14} style={{ marginRight: 6, flexShrink: 0 }} />
                  <a href={`tel:${contactPhone}`}>{contactPhone}</a>
                </div>
              )}
              {contactEmail && (
                <div className="clinic-contact-item">
                  <LuMail size={14} style={{ marginRight: 6, flexShrink: 0 }} />
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <MapView address={contactAddress} city={contactCity} label={primary.name} height={260} />
              </div>
            </div>
            {unionSchedule.some((e) => e.open) && (
              <div className="clinic-contact-hours">
                <div className="clinic-hours-title">Program</div>
                {unionSchedule.map((entry) => (
                  <div
                    key={entry.day}
                    className={`clinic-hours-row${!entry.open ? ' clinic-hours-row--closed' : ''}`}
                  >
                    <span>{entry.day}</span>
                    <span>{entry.open ? `${entry.start} – ${entry.end}` : 'Închis'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Floating CTA */}
      {step < 3 && (
        <div className="profile-floating-cta">
          <button
            className="profile-floating-cta__btn"
            onClick={() => document.getElementById('clinic-booking')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <LuCalendarDays size={14} style={{ marginRight: 6 }} />
            Programează-te acum
          </button>
        </div>
      )}
    </div>
  );
};

export default ClinicGroupPage;
