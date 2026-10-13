import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  clinicAdminApi,
  setClinicToken,
  removeClinicToken,
  saveClinicToStorage,
} from '../lib/api';

const ClinicAdminContext = createContext(null);

export const ClinicAdminProvider = ({ children }) => {
  const [clinic,  setClinicRaw] = useState(null);
  const [loading, setLoading]   = useState(true);

  const setClinic = useCallback((data) => {
    if (!data) { setClinicRaw(null); return; }
    setClinicRaw(data);
    saveClinicToStorage(data);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('clinicToken');
    if (!token) { setLoading(false); return; }

    clinicAdminApi.getMe()
      .then(({ data }) => setClinic(data))
      .catch(() => removeClinicToken())
      .finally(() => setLoading(false));
  }, [setClinic]);

  const login = useCallback(async (email, password) => {
    const { data } = await clinicAdminApi.login({ email, password });
    setClinicToken(data.token);
    setClinic(data.clinic);
    return data;
  }, [setClinic]);

  const register = useCallback(async (formData) => {
    const { data } = await clinicAdminApi.register(formData);
    setClinicToken(data.token);
    setClinic(data.clinic);
    return data;
  }, [setClinic]);

  const refreshClinic = useCallback(async () => {
    try {
      const { data } = await clinicAdminApi.getMe();
      setClinic(data);
    } catch { /* silently ignore */ }
  }, [setClinic]);

  const logout = useCallback(() => {
    removeClinicToken();
    setClinicRaw(null);
  }, []);

  return (
    <ClinicAdminContext.Provider value={{ clinic, setClinic, refreshClinic, loading, login, register, logout }}>
      {children}
    </ClinicAdminContext.Provider>
  );
};

export const useClinicAdmin = () => {
  const ctx = useContext(ClinicAdminContext);
  if (!ctx) throw new Error('useClinicAdmin must be used inside ClinicAdminProvider');
  return ctx;
};

export default ClinicAdminContext;
