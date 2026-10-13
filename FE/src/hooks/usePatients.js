// src/hooks/usePatients.js

import { useState, useMemo, useCallback, useEffect } from 'react';
import { patientsApi } from '../lib/api';
import { useDoctor } from '../contexts/DoctorContext';

const usePatients = () => {
  const [patients,        setPatients]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalOpen,       setModalOpen]       = useState(false);

  const { doctor } = useDoctor();

  const load = useCallback(async () => {
    try {
      const res = await patientsApi.getAll();
      setPatients(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () =>
      patients.filter((p) => {
        const q = search.toLowerCase();
        return (
          (p.firstName ?? '').toLowerCase().includes(q) ||
          (p.lastName  ?? '').toLowerCase().includes(q)  ||
          (p.phone     ?? '').replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
          (p.email     ?? '').toLowerCase().includes(q)
        );
      }),
    [patients, search],
  );

  const openPatient = (patient) => { setSelectedPatient(patient); setModalOpen(true); };
  const closeModal  = ()        => { setModalOpen(false); setSelectedPatient(null); };

  const getHistory = async (id) => {
    const res = await patientsApi.getFullHistory(id);
    return res.data ?? [];
  };

  const savePatient = async (patient) => {
    const payload = {
      firstName:    patient.firstName,
      lastName:     patient.lastName,
      phone:        patient.phone,
      email:        patient.email,
      birthDate:    patient.birthDate ?? null,
      medicalNotes: patient.notes ?? patient.medicalNotes ?? null,
    };
    if (patient.id) {
      await patientsApi.update(patient.id, payload);
    } else {
      await patientsApi.create(payload);
    }
    await load();
    closeModal();
  };

  const deletePatient = async (id) => {
    await patientsApi.delete(id);
    await load();
    closeModal();
  };

  return {
    doctor,
    patients: filtered,
    totalCount: patients.length,
    loading,
    search,
    setSearch,
    selectedPatient,
    modalOpen,
    openPatient,
    closeModal,
    getHistory,
    savePatient,
    deletePatient,
  };
};

export default usePatients;
