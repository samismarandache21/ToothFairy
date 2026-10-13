// src/utils/presentationData.js
// Mock presentation / cabinet data — înlocuiește cu API calls când backend-ul e gata

export const CABINET_INFO = {
  name:        'Cabinet Dr. Popescu',
  slug:        'dr-popescu-cluj',
  description: 'Cabinet stomatologic modern în inima Clujului, cu o experiență de peste 15 ani în stomatologie estetică și implantologie. Oferim servicii complete pentru întreaga familie, într-un mediu relaxant și profesionist.',
  address:     'Str. Eroilor nr. 24, Cluj-Napoca',
  phone:       '0740 123 456',
  email:       'cabinet@dr-popescu.ro',
  website:     'www.dr-popescu.ro',
  specialties: ['Implantologie', 'Estetică dentară', 'Pedodonție', 'Ortodonție'],
  languages:   ['Română', 'Engleză'],
};

export const WORKING_HOURS = [
  { day: 'Luni',     open: true,  start: '08:00', end: '17:00' },
  { day: 'Marți',    open: true,  start: '08:00', end: '17:00' },
  { day: 'Miercuri', open: true,  start: '10:00', end: '19:00' },
  { day: 'Joi',      open: true,  start: '08:00', end: '17:00' },
  { day: 'Vineri',   open: true,  start: '08:00', end: '15:00' },
  { day: 'Sâmbătă',  open: false, start: '09:00', end: '13:00' },
  { day: 'Duminică', open: false, start: '09:00', end: '13:00' },
];

export const ALL_SPECIALTIES = [
  'Implantologie', 'Estetică dentară', 'Pedodonție', 'Ortodonție',
  'Endodonție', 'Parodontologie', 'Chirurgie orală', 'Protetica dentară',
];
