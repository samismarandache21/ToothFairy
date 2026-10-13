// src/hooks/useServices.js

import { useState, useEffect, useCallback } from 'react';
import { treatmentTypesApi } from '../lib/api';
import { useDoctor } from '../contexts/DoctorContext';

const useServices = () => {
  const [services,       setServices]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editingService, setEditingService] = useState(null);

  const { doctor } = useDoctor();

  const load = useCallback(async () => {
    try {
      const res = await treatmentTypesApi.getAll();
      setServices(res.data.map((s) => ({
        id:                    s.id,
        name:                  s.name,
        duration:              s.durationMinutes,
        price:                 s.price,
        color:                 s.color,
        isConsultation:        s.isConsultation        ?? false,
        requiresConsultForNew: s.requiresConsultForNew ?? false,
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd    = ()    => { setEditingService(null); setModalOpen(true); };
  const openEdit   = (svc) => { setEditingService(svc);  setModalOpen(true); };
  const closeModal = ()    => { setModalOpen(false); setEditingService(null); };

  const saveService = async (svc) => {
    const payload = {
      name:                  svc.name,
      durationMinutes:       svc.duration,
      price:                 svc.price,
      color:                 svc.color,
      isConsultation:        svc.isConsultation        ?? false,
      requiresConsultForNew: svc.requiresConsultForNew ?? false,
    };
    if (svc.id) {
      await treatmentTypesApi.update(svc.id, payload);
    } else {
      await treatmentTypesApi.create(payload);
    }
    await load();
    closeModal();
  };

  const deleteService = async (id) => {
    await treatmentTypesApi.delete(id);
    await load();
  };

  return {
    doctor,
    services,
    loading,
    modalOpen,
    editingService,
    openAdd,
    openEdit,
    closeModal,
    saveService,
    deleteService,
  };
};

export default useServices;
