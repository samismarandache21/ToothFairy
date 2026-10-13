// src/utils/calendarData.js
// Mock calendar data — înlocuiește cu API calls când backend-ul e gata

const getWeekMonday = () => {
  const today = new Date();
  const day   = today.getDay();
  const diff  = today.getDate() - day + (day === 0 ? -6 : 1);
  const mon   = new Date(today);
  mon.setDate(diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
};

export const toISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const MONDAY = getWeekMonday();

export const WORK_DAYS = Array.from({ length: 5 }, (_, i) => {
  const d = new Date(MONDAY);
  d.setDate(MONDAY.getDate() + i);
  return d;
});

export const CALENDAR_APPOINTMENTS = [
  { id: 1, patient: 'Ion Popescu',          serviceId: 1, service: 'Detartraj',          date: toISO(WORK_DAYS[0]), startTime: '09:00', duration: 45, color: '#3B82F6', status: 'confirmed', smsEnabled: true  },
  { id: 2, patient: 'Ana Maria Constantin', serviceId: 2, service: 'Plombă',              date: toISO(WORK_DAYS[0]), startTime: '10:00', duration: 30, color: '#F59E0B', status: 'pending',   smsEnabled: true  },
  { id: 3, patient: 'Vlad Toma',            serviceId: 3, service: 'Control',             date: toISO(WORK_DAYS[1]), startTime: '09:00', duration: 15, color: '#10B981', status: 'confirmed', smsEnabled: false },
  { id: 4, patient: 'Maria Ionescu',        serviceId: 4, service: 'Extracție',           date: toISO(WORK_DAYS[1]), startTime: '11:00', duration: 60, color: '#F43F5E', status: 'confirmed', smsEnabled: true  },
  { id: 5, patient: 'George Stancu',        serviceId: 1, service: 'Detartraj',           date: toISO(WORK_DAYS[2]), startTime: '10:00', duration: 45, color: '#3B82F6', status: 'confirmed', smsEnabled: true  },
  { id: 6, patient: 'Cristina Munteanu',    serviceId: 5, service: 'Albire profesională', date: toISO(WORK_DAYS[2]), startTime: '14:00', duration: 90, color: '#8B5CF6', status: 'confirmed', smsEnabled: true  },
  { id: 7, patient: 'Bogdan Radu',          serviceId: 2, service: 'Plombă',              date: toISO(WORK_DAYS[3]), startTime: '08:30', duration: 30, color: '#F59E0B', status: 'pending',   smsEnabled: true  },
  { id: 8, patient: 'Ioana Dumitrescu',     serviceId: 3, service: 'Control',             date: toISO(WORK_DAYS[4]), startTime: '15:00', duration: 15, color: '#10B981', status: 'confirmed', smsEnabled: false },
];
