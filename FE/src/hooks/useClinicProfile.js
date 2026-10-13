// src/hooks/useClinicProfile.js

import { useState, useMemo, useEffect } from 'react';
import { publicApi } from '../lib/api';

const DAYS_AHEAD = 14;

const pad = (n) => String(n).padStart(2, '0');

const toISO = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const mapCabinet = (c) => ({
  id:          c.id,
  slug:        c.slug ?? c.id,
  name:        c.name,
  tagline:     c.description ?? '',
  firstName:   c.firstName  ?? '',
  lastName:    c.lastName   ?? '',
  city:        c.city       ?? '',
  address:     c.address    ?? '',
  phone:       c.phone      ?? '',
  email:       c.email      ?? '',
  website:     c.website    ?? '',
  about:       c.description ?? '',
  rating:      c.rating     ?? 0,
  reviewCount: c.reviewCount ?? 0,
  services:    (c.services ?? []).map((s) => ({
    id:                    s.id,
    name:                  s.name,
    duration:              s.durationMinutes ?? s.duration ?? 30,
    price:                 Number(s.price ?? 0),
    color:                 s.color ?? '#6366F1',
    isConsultation:        s.isConsultation        ?? (s.name ?? '').toLowerCase().includes('consult'),
    requiresConsultForNew: s.requiresConsultForNew ?? false,
  })),
  specialties: (() => {
    try {
      return JSON.parse(c.specialties ?? '[]').map((s, i) => ({
        id: i, name: s, color: '#D1FAE5',
      }));
    } catch { return []; }
  })(),
  workingHours: (() => { try { return JSON.parse(c.workingHours ?? 'null'); } catch { return null; } })(),
  gallery:     [],
  doctorSlugs: [],
});

const useClinicProfile = (slug) => {
  const [clinic,         setClinic]         = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [bookingOpen,    setBookingOpen]    = useState(false);
  const [bookingDentist, setBookingDentist] = useState(null);
  const [selectedDay,    setSelectedDay]    = useState(0);

  // Build 14-day strip
  const days = useMemo(() => {
    const arr   = [];
    const today = new Date();
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  // Fetch clinic (cabinet) data
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    publicApi.getCabinet(slug)
      .then((res) => setClinic(mapCabinet(res.data)))
      .finally(() => setLoading(false));
  }, [slug]);

  // Fetch slots when date or booking dentist changes
  useEffect(() => {
    if (!slug || !days[selectedDay]) return;
    const iso = toISO(days[selectedDay]);
    publicApi.getSlots(slug, iso)
      .then((res) => setAvailableSlots(res.data))
      .catch(() => setAvailableSlots([]));
  }, [slug, selectedDay, days]);

  // Build AM/PM slots from available list
  const slots = useMemo(() => {
    const am = [];
    const pm = [];
    availableSlots.forEach((timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      const slot = { key: `${toISO(days[selectedDay])} ${timeStr}`, h, m, label: timeStr, booked: false };
      if (h < 13) am.push(slot);
      else        pm.push(slot);
    });
    return { am, pm };
  }, [availableSlots, days, selectedDay]);

  // team: simplificare — cabinet solo
  const team = useMemo(() => {
    if (!clinic) return [];
    return [{
      id:        clinic.id,
      slug:      clinic.slug,
      firstName: clinic.firstName,
      lastName:  clinic.lastName,
      title:     'Dr.',
      specialty: clinic.specialties[0]?.name ?? '',
      rating:    clinic.rating,
      reviewCount: clinic.reviewCount,
    }];
  }, [clinic]);

  const [preSelectedSlot, setPreSelectedSlot] = useState(null);

  const openBookingFor = (dentist, slot = null) => {
    // Merge clinic services into the dentist object so BookingModal has them
    const dentistWithServices = {
      ...dentist,
      services: clinic?.services ?? [],
      slug:     clinic?.slug ?? dentist.slug,
    };
    setBookingDentist(dentistWithServices);
    setPreSelectedSlot(slot ?? null);
    setSelectedDay(0);
    setBookingOpen(true);
  };

  const closeBooking = () => {
    setBookingOpen(false);
    setBookingDentist(null);
    setPreSelectedSlot(null);
  };

  return {
    clinic,
    team,
    bookingOpen,
    bookingDentist,
    preSelectedSlot,
    openBookingFor,
    closeBooking,
    days,
    selectedDay,
    setSelectedDay,
    slots,
    loading,
  };
};

export default useClinicProfile;
