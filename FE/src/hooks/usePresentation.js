// src/hooks/usePresentation.js

import { useState, useEffect, useCallback } from 'react';
import { cabinetApi } from '../lib/api';
import { useDoctor } from '../contexts/DoctorContext';

export const ALL_SPECIALTIES = [
  'Implantologie', 'Estetică dentară', 'Pedodonție', 'Ortodonție',
  'Endodonție', 'Parodontologie', 'Chirurgie orală', 'Protetica dentară',
];

const DEFAULT_HOURS = [
  { day: 'Luni',     open: true,  start: '09:00', end: '18:00' },
  { day: 'Marți',    open: true,  start: '09:00', end: '18:00' },
  { day: 'Miercuri', open: true,  start: '09:00', end: '18:00' },
  { day: 'Joi',      open: true,  start: '09:00', end: '18:00' },
  { day: 'Vineri',   open: true,  start: '09:00', end: '18:00' },
  { day: 'Sâmbătă',  open: false, start: '09:00', end: '13:00' },
  { day: 'Duminică', open: false, start: '09:00', end: '13:00' },
];

const EMPTY_INFO = {
  name: '', slug: '', description: '', address: '', city: '',
  phone: '', email: '', website: '', specialties: [], languages: [],
};

const usePresentation = () => {
  const [info,      setInfo]      = useState(EMPTY_INFO);
  const [hours,     setHours]     = useState(DEFAULT_HOURS);
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [preview,   setPreview]   = useState(false);

  const { doctor } = useDoctor();

  useEffect(() => {
    cabinetApi.getMe().then((res) => {
      const c = res.data;
      setInfo({
        name:        c.name        ?? '',
        slug:        c.slug        ?? '',
        description: c.description ?? '',
        address:     c.address     ?? '',
        city:        c.city        ?? '',
        phone:       c.phone       ?? '',
        email:       c.email       ?? '',
        website:     c.website     ?? '',
        specialties: JSON.parse(c.specialties ?? '[]'),
        languages:   JSON.parse(c.languages   ?? '[]'),
      });
      setHours(JSON.parse(c.workingHours ?? 'null') ?? DEFAULT_HOURS);
    }).finally(() => setLoading(false));
  }, []);

  const updateInfo = (field, value) =>
    setInfo((prev) => ({ ...prev, [field]: value }));

  const toggleSpecialty = (spec) => {
    setInfo((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter((s) => s !== spec)
        : [...prev.specialties, spec],
    }));
  };

  const updateHour = (index, field, value) =>
    setHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)),
    );

  const handleSave = useCallback(async () => {
    setSaveError('');
    try {
      await cabinetApi.updateMe({
        name:         info.name,
        slug:         info.slug.trim() || null,
        description:  info.description,
        address:      info.address,
        city:         info.city,
        phone:        info.phone,
        website:      info.website,
        specialties:  JSON.stringify(info.specialties),
        languages:    JSON.stringify(info.languages),
        workingHours: JSON.stringify(hours),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err.response?.data?.message ?? 'Salvarea a eșuat. Încearcă din nou.');
    }
  }, [info, hours]);

  return {
    doctor,
    info,
    hours,
    allSpecialties: ALL_SPECIALTIES,
    saved,
    saveError,
    loading,
    preview,
    setPreview,
    updateInfo,
    toggleSpecialty,
    updateHour,
    handleSave,
  };
};

export default usePresentation;
