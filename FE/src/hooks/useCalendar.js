// src/hooks/useCalendar.js

import { useState, useEffect, useCallback } from 'react';
import { appointmentsApi, treatmentTypesApi, patientsApi, breaksApi } from '../lib/api';
import { useDoctor } from '../contexts/DoctorContext';

// ── WORK_DAYS: current week Mon–Fri ──────────────────────────────────────────
const getWeekMonday = () => {
  const today = new Date();
  const day   = today.getDay();
  const diff  = today.getDate() - day + (day === 0 ? -6 : 1);
  const mon   = new Date(today);
  mon.setDate(diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
};

const toISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getWorkDays = (offsetWeeks) => {
  const monday = getWeekMonday();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offsetWeeks * 7 + i);
    return d;
  });
};

// ── Map backend appointment → calendar shape ─────────────────────────────────
const mapAppt = (a) => ({
  id:         a.id,
  patientId:  a.patientId,
  patient:    `${a.patientFirstName} ${a.patientLastName}`,
  serviceId:  a.treatmentTypeId,
  service:    a.treatmentTypeName  ?? '',
  date:       a.startTime.slice(0, 10),
  startTime:  a.startTime.slice(11, 16),
  duration:   a.durationMinutes,
  color:      a.treatmentTypeColor ?? '#3B82F6',
  status:     a.status,
  notes:      a.notes              ?? '',
  smsEnabled: !a.smsSent,
});

const useCalendar = () => {
  const [appointments,  setAppointments]  = useState([]);
  const [services,      setServices]      = useState([]);
  const [patients,      setPatients]      = useState([]);
  const [breaks,        setBreaks]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editingAppt,   setEditingAppt]   = useState(null);
  const [slotInfo,      setSlotInfo]      = useState(null);
  const [weekOffset,    setWeekOffset]    = useState(0);
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [editingBreak,   setEditingBreak]   = useState(null);

  const workDays = getWorkDays(weekOffset);

  const prevWeek = () => setWeekOffset((o) => o - 1);
  const nextWeek = () => setWeekOffset((o) => o + 1);
  const goToday  = () => setWeekOffset(0);

  const { doctor } = useDoctor();

  const load = useCallback(async () => {
    try {
      const [apptRes, svcRes, patRes, brkRes] = await Promise.all([
        appointmentsApi.getAll(),
        treatmentTypesApi.getAll(),
        patientsApi.getAll(),
        breaksApi.getAll(),
      ]);
      setAppointments(apptRes.data.map(mapAppt));
      setServices(svcRes.data.map((s) => ({
        id:       s.id,
        name:     s.name,
        duration: s.durationMinutes,
        price:    s.price,
        color:    s.color,
      })));
      setPatients(patRes.data);
      setBreaks(brkRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNewAppt  = (date, time) => { setEditingAppt(null); setSlotInfo({ date, time }); setModalOpen(true); };
  const openEditAppt = (appt)       => { setEditingAppt(appt); setSlotInfo(null); setModalOpen(true); };
  const closeModal   = ()           => { setModalOpen(false); setEditingAppt(null); setSlotInfo(null); };

  // ── Break helpers ────────────────────────────────────────────────────────
  const openNewBreak  = ()      => { setEditingBreak(null); setBreakModalOpen(true); };
  const openEditBreak = (brk)   => { setEditingBreak(brk);  setBreakModalOpen(true); };
  const closeBreakModal = ()    => { setBreakModalOpen(false); setEditingBreak(null); };

  const saveBreak = async (form) => {
    const payload = {
      title:           form.title,
      startTime:       form.startTime,
      durationMinutes: Number(form.durationMinutes),
      recurrenceType:  form.recurrenceType,
      dayOfWeek:       form.recurrenceType === 'WEEKLY'  ? Number(form.dayOfWeek)  : null,
      dayOfMonth:      form.recurrenceType === 'MONTHLY' ? Number(form.dayOfMonth) : null,
      date:            form.recurrenceType === 'NONE'    ? form.date               : null,
      color:           form.color || '#F59E0B',
    };
    if (form.id) {
      await breaksApi.update(form.id, payload);
    } else {
      await breaksApi.create(payload);
    }
    await load();
    closeBreakModal();
  };

  const deleteBreak = async (id) => {
    await breaksApi.delete(id);
    await load();
    closeBreakModal();
  };

  // Returns breaks active on a given Date
  const getBreaksForDay = (date) => {
    const javaDow = date.getDay() === 0 ? 7 : date.getDay(); // 1=Mon…7=Sun
    const dom     = date.getDate();
    const iso     = toISO(date);
    return breaks.filter((b) => {
      if (b.recurrenceType === 'DAILY')   return true;
      if (b.recurrenceType === 'WEEKLY')  return b.dayOfWeek  === javaDow;
      if (b.recurrenceType === 'MONTHLY') return b.dayOfMonth === dom;
      if (b.recurrenceType === 'NONE')    return b.date === iso;
      return false;
    });
  };

  const saveAppointment = async (form) => {
    const pad2 = (n) => String(n).padStart(2, '0');
    const startDt = new Date(`${form.date}T${form.startTime}:00`);
    const endDt   = new Date(startDt.getTime() + Number(form.duration) * 60_000);
    const fmtDt   = (dt) =>
      `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:00`;

    let patientId = form.patientId;

    // Auto-create patient from typed name if not matched to an existing one
    if (!patientId && form.patient?.trim()) {
      const name = form.patient.trim();
      const lastSpace = name.lastIndexOf(' ');
      const firstName = lastSpace > -1 ? name.slice(0, lastSpace).trim() : name;
      const lastName  = lastSpace > -1 ? name.slice(lastSpace + 1).trim() : null;
      const res = await patientsApi.create({ firstName, lastName });
      patientId = res.data.id;
    }

    if (!patientId) throw new Error('Introdu numele pacientului.');

    const payload = {
      patientId,
      treatmentTypeId: form.serviceId || null,
      startTime:       fmtDt(startDt),
      endTime:         fmtDt(endDt),
      status:          form.status,
      notes:           form.notes || null,
    };
    if (form.id) {
      await appointmentsApi.update(form.id, payload);
    } else {
      await appointmentsApi.create(payload);
    }
    await load();
    closeModal();
  };

  const deleteAppointment = async (id) => {
    await appointmentsApi.delete(id);
    await load();
    closeModal();
  };

  const getApptsForDay = (date) => {
    const iso = toISO(date);
    return appointments.filter((a) => a.date === iso && a.status !== 'cancelled');
  };

  const weekAppts = workDays.flatMap((d) => getApptsForDay(d));
  const activeAppts    = weekAppts.filter((a) => a.status !== 'cancelled');
  const cancelledCount = weekAppts.filter((a) => a.status === 'cancelled').length;
  const totalThisWeek  = activeAppts.length;

  // Occupancy: active appointment minutes vs 5 workdays × 8h
  const totalApptMins       = activeAppts.reduce((s, a) => s + (a.duration ?? 30), 0);
  const totalAvailableMins  = 5 * 8 * 60;
  const occupancyPct        = Math.min(100, Math.round((totalApptMins / totalAvailableMins) * 100));
  const occupancyHours      = Math.round(totalApptMins / 60 * 10) / 10;

  // Unique patients this week
  const uniquePatients = new Set(activeAppts.map((a) => a.patientId)).size;

  const weekStats = {
    total:         totalThisWeek,
    cancelled:     cancelledCount,
    occupancyPct,
    occupancyHours,
    availableHours: Math.round(totalAvailableMins / 60),
    uniquePatients,
  };

  return {
    doctor,
    workDays,
    weekOffset,
    prevWeek,
    nextWeek,
    goToday,
    appointments,
    patients,
    services,
    loading,
    modalOpen,
    editingAppt,
    slotInfo,
    totalThisWeek,
    weekStats,
    openNewAppt,
    openEditAppt,
    closeModal,
    saveAppointment,
    deleteAppointment,
    getApptsForDay,
    // Breaks
    breaks,
    breakModalOpen,
    editingBreak,
    openNewBreak,
    openEditBreak,
    closeBreakModal,
    saveBreak,
    deleteBreak,
    getBreaksForDay,
    reload: load,
  };
};

export default useCalendar;
