// src/hooks/usePatientAuth.js

import { useState } from 'react';
import {
  patientAuthApi,
  setPatientToken,
  removePatientToken,
  getPatientFromStorage,
  savePatientToStorage,
} from '../lib/api';

const usePatientAuth = () => {
  const [patient, setPatient] = useState(getPatientFromStorage());

  const login = async (email, password) => {
    const res = await patientAuthApi.login({ email, password });
    setPatientToken(res.data.token);
    savePatientToStorage(res.data.patient);
    setPatient(res.data.patient);
  };

  const register = async (data) => {
    const res = await patientAuthApi.register(data);
    setPatientToken(res.data.token);
    savePatientToStorage(res.data.patient);
    setPatient(res.data.patient);
  };

  const logout = () => {
    removePatientToken();
    setPatient(null);
  };

  return { patient, login, logout, register };
};

export default usePatientAuth;
