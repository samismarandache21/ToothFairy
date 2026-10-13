// src/contexts/DoctorContext.jsx
// Single source of truth for the logged-in doctor.
// On mount validates the JWT against /cabinet/me and keeps the doctor state fresh.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cabinetApi, removeToken, saveCabinetToStorage } from '../lib/api';

// clinicStatus: null = individual (no clinic), 'pending' = waiting approval, 'active' = in clinic

const DoctorContext = createContext(null);

const mapDoctor = (c) => ({
  id:           c.id           ?? null,
  firstName:    c.firstName    ?? '',
  lastName:     c.lastName     ?? '',
  name:         c.name         ?? '',
  cabinetName:  c.name         ?? '',
  email:        c.email        ?? '',
  phone:        c.phone        ?? '',
  city:         c.city         ?? '',
  address:      c.address      ?? '',
  description:  c.description  ?? '',
  slug:         c.slug         ?? '',
  website:      c.website      ?? '',
  specialties:  c.specialties  ?? '[]',
  languages:    c.languages    ?? '[]',
  workingHours: c.workingHours ?? null,
  plan:         c.plan         ?? 'starter',
  smsCredits:   c.smsCredits   ?? 0,
  rating:       c.rating       ?? 0,
  reviewCount:  c.reviewCount  ?? 0,
  profilePhoto:    c.profilePhoto    ?? null,
  coverPhoto:      c.coverPhoto      ?? null,
  clinicAccountId: c.clinicAccountId ?? null,
});

export const DoctorProvider = ({ children }) => {
  const [doctor,       setDoctorRaw]    = useState(null);
  const [clinicStatus, setClinicStatus] = useState(null); // null | 'pending' | 'active'
  const [loading,      setLoading]      = useState(true);

  const setDoctor = useCallback((cabinetData) => {
    if (!cabinetData) { setDoctorRaw(null); return; }
    const mapped = mapDoctor(cabinetData);
    setDoctorRaw(mapped);
    saveCabinetToStorage(cabinetData); // keep localStorage in sync for token-only hooks
  }, []);

  // Refresh from API — callable externally (e.g. after profile photo upload)
  const refreshDoctor = useCallback(async () => {
    try {
      const { data } = await cabinetApi.getMe();
      setDoctor(data);
    } catch {
      // silently ignore; auth interceptor handles 401
    }
  }, [setDoctor]);

  // On every mount: validate JWT → fetch fresh doctor data + clinic status
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    cabinetApi.getMe()
      .then(async ({ data }) => {
        setDoctor(data);
        if (data.clinicAccountId) {
          setClinicStatus('active');
        } else {
          try {
            const { data: reqs } = await cabinetApi.getMyJoinRequests();
            const hasPending = reqs.some(r => r.status === 'PENDING');
            setClinicStatus(hasPending ? 'pending' : null);
          } catch {
            setClinicStatus(null);
          }
        }
      })
      .catch(() => {
        removeToken();
      })
      .finally(() => setLoading(false));
  }, [setDoctor]);

  const logout = useCallback(() => {
    removeToken();
    setDoctorRaw(null);
    setClinicStatus(null);
  }, []);

  return (
    <DoctorContext.Provider value={{ doctor, setDoctor, refreshDoctor, loading, logout, clinicStatus, setClinicStatus }}>
      {children}
    </DoctorContext.Provider>
  );
};

export const useDoctor = () => {
  const ctx = useContext(DoctorContext);
  if (!ctx) throw new Error('useDoctor must be used inside DoctorProvider');
  return ctx;
};

export default DoctorContext;
