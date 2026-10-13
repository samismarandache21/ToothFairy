// src/utils/statisticsData.js
// Mock statistics data — înlocuiește cu API calls când backend-ul e gata

export const WEEKLY_APPOINTMENTS = [
  { day: 'Lun', count: 7  },
  { day: 'Mar', count: 9  },
  { day: 'Mie', count: 6  },
  { day: 'Joi', count: 8  },
  { day: 'Vin', count: 4  },
];

export const MONTHLY_TREND = [
  { month: 'Aug', appts: 89,  patients: 54, revenue: 18200 },
  { month: 'Sep', appts: 102, patients: 61, revenue: 21500 },
  { month: 'Oct', appts: 98,  patients: 58, revenue: 20100 },
  { month: 'Nov', appts: 115, patients: 70, revenue: 24800 },
  { month: 'Dec', appts: 87,  patients: 52, revenue: 17900 },
  { month: 'Ian', appts: 124, patients: 76, revenue: 26400 },
];

export const KPI_CARDS = [
  { id: 'total',    icon: '📅', label: 'Total programări luna asta', value: 124, trend: '+12%',  trendType: 'up',   bg: '#EFF6FF', detail: 'față de luna trecută'    },
  { id: 'patients', icon: '👥', label: 'Pacienți noi luna asta',     value: 18,  trend: '+5',     trendType: 'up',   bg: '#ECFDF5', detail: 'pacienți înregistrați'  },
  { id: 'noshows',  icon: '⚠️', label: 'Rata no-show',              value: '5.6%', trend: '-1.2%', trendType: 'up',  bg: '#FFFBEB', detail: 'îmbunătățire față de avg' },
  { id: 'revenue',  icon: '💰', label: 'Venit estimat luna asta',   value: '26.4k', trend: '+8%', trendType: 'up',  bg: '#F0FDFA', detail: 'RON, fără taxe'         },
];

export const SERVICE_BREAKDOWN = [
  { service: 'Detartraj',          count: 38, pct: 31, color: '#3B82F6' },
  { service: 'Plombă',             count: 27, pct: 22, color: '#F59E0B' },
  { service: 'Control',            count: 24, pct: 19, color: '#10B981' },
  { service: 'Extracție',          count: 19, pct: 15, color: '#F43F5E' },
  { service: 'Albire profesională',count: 10, pct: 8,  color: '#8B5CF6' },
  { service: 'Altele',             count: 6,  pct: 5,  color: '#94A3B8' },
];
