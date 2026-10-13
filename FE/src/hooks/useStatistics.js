// src/hooks/useStatistics.js

import { useState, useEffect } from 'react';
import { LuCalendarDays, LuUsers, LuTriangleAlert } from 'react-icons/lu';
import { statsApi } from '../lib/api';
import { useDoctor } from '../contexts/DoctorContext';

const useStatistics = () => {
  const [kpis,             setKpis]             = useState([]);
  const [weeklyAppts,      setWeeklyAppts]      = useState([]);
  const [monthlyTrend,     setMonthlyTrend]     = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [loading,          setLoading]          = useState(true);

  const { doctor } = useDoctor();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await statsApi.getDashboard();
        const data = statsRes.data;

        setKpis([
          {
            id: 'appointments', Icon: LuCalendarDays, iconColor: '#6366F1', label: 'Programări săptămâna asta',
            value: data.weeklyAppointments, trend: data.weeklyTrend,     trendType: 'up',   bg: '#EFF6FF',
          },
          {
            id: 'patients', Icon: LuUsers, iconColor: '#10B981', label: 'Pacienți noi luna asta',
            value: data.newPatientsMonth,   trend: data.newPatientsTrend, trendType: 'up',   bg: '#ECFDF5',
          },
          {
            id: 'noshows', Icon: LuTriangleAlert, iconColor: '#F59E0B', label: 'No-show-uri luna asta',
            value: data.noShowsMonth,       trend: data.noShowsPct,       trendType: 'warn', bg: '#FFFBEB',
          },
        ]);

        setWeeklyAppts(data.weeklyAppts ?? []);
        setMonthlyTrend(
          (data.monthlyTrend ?? []).map((m) => ({ ...m, appts: m.appointments })),
        );
        setServiceBreakdown(data.serviceBreakdown ?? []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [doctor]);

  return {
    doctor,
    kpis,
    weeklyAppts,
    monthlyTrend,
    serviceBreakdown,
    loading,
  };
};

export default useStatistics;
