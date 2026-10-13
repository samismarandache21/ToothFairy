// src/hooks/useClinicGroup.js
import { useState, useMemo, useEffect } from 'react';
import { publicApi } from '../lib/api';

const DAYS_AHEAD = 14;
const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const mapMember = (raw) => ({
  id:           raw.id,
  slug:         raw.slug ?? String(raw.id),
  firstName:    raw.firstName   ?? '',
  lastName:     raw.lastName    ?? '',
  name:         raw.name        ?? `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim(),
  specialty:    (() => { try { return JSON.parse(raw.specialties ?? '[]')[0] ?? ''; } catch { return ''; } })(),
  specialties:  raw.specialties ?? '[]',
  city:         raw.city        ?? '',
  address:      raw.address     ?? '',
  phone:        raw.phone       ?? '',
  email:        raw.email       ?? '',
  description:  raw.description ?? '',
  coverPhoto:   raw.coverPhoto  ?? null,
  rating:       raw.rating      ?? 0,
  reviewCount:  raw.reviewCount ?? 0,
  workingHours: raw.workingHours ?? null,
  services:    (raw.services ?? []).map((s) => ({
    id:                    s.id,
    name:                  s.name,
    durationMinutes:       Number(s.durationMinutes ?? s.duration ?? 30),
    price:                 Number(s.price ?? 0),
    color:                 s.color ?? '#6366F1',
    isConsultation:        s.isConsultation ?? false,
    requiresConsultForNew: s.requiresConsultForNew ?? false,
  })),
});

const useClinicGroup = (rawMembers) => {
  const [enrichedMembers, setEnrichedMembers] = useState([]);
  const [selectedDay,     setSelectedDay]     = useState(0);

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

  // Fetch full cabinet profile for each member to get services + full data
  useEffect(() => {
    if (!rawMembers?.length) return;
    Promise.all(
      rawMembers.map((m) => {
        const slug = m.slug ?? String(m.id);
        return publicApi.getCabinet(slug)
          .then((res) => mapMember(res.data))
          .catch(() => mapMember(m));
      })
    ).then(setEnrichedMembers);
  }, [rawMembers]);

  return {
    enrichedMembers,
    days,
    selectedDay,
    setSelectedDay,
  };
};

export default useClinicGroup;
