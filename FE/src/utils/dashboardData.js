// src/utils/dashboardData.js
// Date mock — înlocuiește cu API calls când backend-ul e gata

export const DOCTOR = {
  firstName:   'Ion',
  lastName:    'Popescu',
  cabinetName: 'Cabinet Dr. Popescu',
  city:        'Cluj-Napoca',
  rating:      4.9,
  reviewCount: 47,
  smsCredits:  142,
  specialties: ['Implantologie', 'Estetică dentară', 'Pedodonție'],
};

export const STATS = [
  { id: 'appointments', icon: '📅', label: 'Programări săptămâna asta', value: 34, trend: '+12%',  trendType: 'up',   bg: '#EFF6FF' },
  { id: 'patients',     icon: '👥', label: 'Pacienți noi luna asta',    value: 12, trend: '+5',     trendType: 'up',   bg: '#ECFDF5' },
  { id: 'noshows',      icon: '⚠️', label: 'No-show-uri luna asta',     value: 3,  trend: '6.2%',   trendType: 'warn', bg: '#FFFBEB' },
  { id: 'sms',          icon: '💬', label: 'Credite SMS rămase',        value: 142, trend: '94% livrate', trendType: 'up', bg: '#F0FDFA' },
];

export const APPOINTMENTS_TODAY = [
  { id: 1, time: '08:00', duration: 45, patient: 'Ion Popescu',           type: 'Detartraj',  color: '#3B82F6', status: 'confirmed'  },
  { id: 2, time: '10:00', duration: 30, patient: 'Ana Maria Constantin',  type: 'Plombă',     color: '#F59E0B', status: 'pending'    },
  { id: 3, time: '11:00', duration: 15, patient: 'Vlad Toma',             type: 'Control',    color: '#10B981', status: 'confirmed'  },
  { id: 4, time: '13:00', duration: 60, patient: 'Maria Ionescu',         type: 'Extracție',  color: '#F43F5E', status: 'cancelled'  },
  { id: 5, time: '14:00', duration: 45, patient: 'George Stancu',         type: 'Detartraj',  color: '#3B82F6', status: 'confirmed'  },
  { id: 6, time: '15:30', duration: 90, patient: 'Cristina Munteanu',     type: 'Albire',     color: '#8B5CF6', status: 'confirmed'  },
];

export const SERVICES = [
  { id: 1, name: 'Detartraj',           duration: 45,  price: 150, color: '#3B82F6', isConsultation: false, requiresConsultForNew: true  },
  { id: 2, name: 'Plombă',              duration: 30,  price: 200, color: '#F59E0B', isConsultation: false, requiresConsultForNew: true  },
  { id: 3, name: 'Control',             duration: 15,  price: 80,  color: '#10B981', isConsultation: true,  requiresConsultForNew: false },
  { id: 4, name: 'Extracție',           duration: 60,  price: 250, color: '#F43F5E', isConsultation: false, requiresConsultForNew: true  },
  { id: 5, name: 'Albire profesională', duration: 90,  price: 450, color: '#8B5CF6', isConsultation: false, requiresConsultForNew: true  },
];

export const REVIEWS = [
  { id: 1,  name: 'Maria D.',        stars: 5, text: 'Foarte profesionist și răbdător. Recomand cu toată încrederea!',                    date: 'acum 2 zile',       platform: 'Google'   },
  { id: 2,  name: 'Alexandru P.',    stars: 5, text: 'Cabinet modern, doctor excelent. Am scăpat de durere rapid.',                       date: 'acum 5 zile',       platform: 'Google'   },
  { id: 3,  name: 'Elena M.',        stars: 4, text: 'Experiență plăcută, personal amabil. Mă voi întoarce!',                             date: 'acum 1 săptămână',  platform: 'Facebook' },
  { id: 4,  name: 'Bogdan R.',       stars: 5, text: 'Mi-a fost frică de dentist toată viața, dar Dr. Popescu m-a făcut să mă relaxez.',  date: 'acum 2 săptămâni',  platform: 'Google'   },
  { id: 5,  name: 'Cristina M.',     stars: 5, text: 'Albirea a ieșit perfect! Sunt foarte mulțumită de rezultat.',                       date: 'acum 3 săptămâni',  platform: 'Google'   },
  { id: 6,  name: 'Vlad T.',         stars: 3, text: 'Servicii bune, dar timpul de așteptare a fost mai lung decât mă așteptam.',         date: 'acum 1 lună',       platform: 'Facebook' },
  { id: 7,  name: 'Ioana D.',        stars: 5, text: 'Cel mai bun dentist din Cluj! Personal super amabil și cabinet curat.',             date: 'acum 1 lună',       platform: 'Google'   },
  { id: 8,  name: 'George S.',       stars: 4, text: 'Programările sunt respectate la timp, apreciez asta enorm.',                        date: 'acum 6 săptămâni',  platform: 'Google'   },
  { id: 9,  name: 'Andrei M.',       stars: 5, text: 'Am venit pentru implant și totul a decurs fără durere. Recomand!',                  date: 'acum 2 luni',       platform: 'Facebook' },
  { id: 10, name: 'Elena Gh.',       stars: 4, text: 'Prima mea vizită și am plecat cu un zâmbet. Mulțumesc!',                           date: 'acum 2 luni',       platform: 'Google'   },
];
