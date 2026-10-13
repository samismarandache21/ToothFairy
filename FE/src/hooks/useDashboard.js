// src/hooks/useDashboard.js

import { useState, useEffect, useCallback } from 'react';
import { LuCalendarDays, LuUsers, LuTriangleAlert } from 'react-icons/lu';
import { getDoctorGreeting }   from '../utils/greeting';
import { formatFullDate }      from '../utils/dateFormatter';
import { appointmentsApi, statsApi, treatmentTypesApi } from '../lib/api';
import { useDoctor } from '../contexts/DoctorContext';

const useDashboard = () => {
  const [greeting,    setGreeting]    = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const { doctor } = useDoctor();

  // API state
  const [stats,        setStats]        = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services,     setServices]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // ── Greeting timer ──
  useEffect(() => {
    const update = () => {
      setCurrentDate(formatFullDate());
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  // Update greeting când avem doctor-ul
  useEffect(() => {
    if (doctor?.lastName) {
      setGreeting(getDoctorGreeting(doctor.lastName));
    }
  }, [doctor]);

  // ── Fetch date din API ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, todayRes, servicesRes] = await Promise.all([
        statsApi.getDashboard(),
        appointmentsApi.getToday(),
        treatmentTypesApi.getAll(),
      ]);

      const statsData = statsRes.data;
      const todayAppts = todayRes.data;
      const treatmentTypes = servicesRes.data;

      // Mapare stats → shape compatibil cu StatsGrid
      setStats([
        {
          id: 'appointments',
          Icon: LuCalendarDays, iconColor: '#6366F1',
          label: 'Programări săptămâna asta',
          value: statsData.weeklyAppointments ?? 0,
          trend: statsData.weeklyTrend ?? '',
          trendType: 'up',
          bg: '#EFF6FF',
        },
        {
          id: 'patients',
          Icon: LuUsers, iconColor: '#10B981',
          label: 'Pacienți noi luna asta',
          value: statsData.newPatientsMonth ?? 0,
          trend: statsData.newPatientsTrend ?? '',
          trendType: 'up',
          bg: '#ECFDF5',
        },
        {
          id: 'noshows',
          Icon: LuTriangleAlert, iconColor: '#F59E0B',
          label: 'No-show-uri luna asta',
          value: statsData.noShowsMonth ?? 0,
          trend: statsData.noShowsPct ?? '',
          trendType: 'warn',
          bg: '#FFFBEB',
        },
      ]);

      // Mapare appointments → shape compatibil cu AppointmentsList
      setAppointments(
        todayAppts.map((a) => ({
          id:       a.id,
          time:     a.startTime?.substring(11, 16) ?? '',   // "HH:MM" din "YYYY-MM-DDTHH:MM:SS"
          duration: a.durationMinutes ?? 30,
          patient:  `${a.patientFirstName ?? ''} ${a.patientLastName ?? ''}`.trim(),
          type:     a.treatmentTypeName ?? '',
          color:    a.treatmentTypeColor ?? '#3B82F6',
          status:   a.status ?? 'confirmed',
        })),
      );

      // Treatment types → services shape
      setServices(
        treatmentTypes.map((t) => ({
          id:       t.id,
          name:     t.name,
          duration: t.durationMinutes,
          price:    t.price,
          color:    t.color ?? '#2DD4BF',
        })),
      );
    } catch (err) {
      setError(err.response?.data?.message ?? 'Eroare la încărcarea datelor.');
    } finally {
      setLoading(false);
    }
  }, [doctor]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const todayCount = appointments.filter((a) => a.status !== 'cancelled').length;

  const statusLabel = {
    confirmed: { label: 'Confirmată',   css: 's-confirmed' },
    pending:   { label: 'Neconfirmată', css: 's-pending'   },
    cancelled: { label: 'Anulată',      css: 's-cancelled' },
    completed: { label: 'Finalizată',   css: 's-confirmed' },
    no_show:   { label: 'Neprezent',    css: 's-cancelled' },
  };

  return {
    doctor,
    stats,
    appointments,
    services,
    reviews:      [],           // reviews nu sunt implementate în backend încă
    loading,
    error,
    greeting,
    currentDate,
    todayCount,
    statusLabel,
    profileOpen,
    openProfile:  () => setProfileOpen(true),
    closeProfile: () => setProfileOpen(false),
    refresh:      fetchAll,
  };
};

export default useDashboard;
