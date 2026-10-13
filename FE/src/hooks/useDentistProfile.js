// src/hooks/useDentistProfile.js

import { useState, useEffect } from 'react';
import { publicApi } from '../lib/api';

const mapCabinet = (c) => ({
  id:           c.id,
  slug:         c.slug ?? c.id,
  name:         c.name,
  firstName:    c.firstName   ?? '',
  lastName:     c.lastName    ?? '',
  specialty:    (() => { try { return JSON.parse(c.specialties ?? '[]')[0] ?? ''; } catch { return ''; } })(),
  city:         c.city        ?? '',
  address:      c.address     ?? '',
  phone:        c.phone       ?? '',
  email:        c.email       ?? '',
  website:      c.website     ?? '',
  about:        c.description ?? '',
  title:        'Dr.',
  rating:       c.rating      ?? 0,
  reviewCount:  c.reviewCount ?? 0,
  profilePhoto: c.profilePhoto ?? null,
  coverPhoto:   c.coverPhoto   ?? null,
  services:    (c.services ?? []).map((s) => ({
    id:                    s.id,
    name:                  s.name,
    durationMinutes:       Number(s.durationMinutes ?? s.duration ?? 30),
    price:                 Number(s.price ?? 0),
    color:                 s.color ?? '#6366F1',
    isConsultation:        s.isConsultation        ?? (s.name ?? '').toLowerCase().includes('consult'),
    requiresConsultForNew: s.requiresConsultForNew ?? false,
  })),
  workingHours: (() => { try { return JSON.parse(c.workingHours ?? 'null'); } catch { return null; } })(),
  reviews:     [],
});

const useDentistProfile = (slug) => {
  const [dentist,            setDentist]            = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [bookingOpen,        setBookingOpen]        = useState(false);
  const [preSelectedService, setPreSelectedService] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      publicApi.getCabinet(slug),
      publicApi.getReviews(slug),
    ])
      .then(([cabRes, revRes]) => {
        const mapped = mapCabinet(cabRes.data);
        mapped.reviews = (revRes.data ?? []).map((r) => ({
          id:     r.id,
          author: r.author,
          rating: r.rating,
          text:   r.text,
          date:   r.date,
        }));
        setDentist(mapped);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const openBooking  = (service = null) => { setPreSelectedService(service); setBookingOpen(true); };
  const closeBooking = ()               => { setBookingOpen(false); setPreSelectedService(null); };

  return {
    dentist,
    loading,
    bookingOpen,
    openBooking,
    closeBooking,
    preSelectedService,
  };
};

export default useDentistProfile;
