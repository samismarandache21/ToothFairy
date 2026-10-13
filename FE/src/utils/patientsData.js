// src/utils/patientsData.js
// Mock patients data — înlocuiește cu API calls când backend-ul e gata

export const PATIENTS = [
  { id: 1,  firstName: 'Ion',      lastName: 'Popescu',    phone: '0740 123 456', email: 'ion.popescu@email.com',      birthDate: '1985-03-15', totalVisits: 12, lastVisit: '2024-01-08', nextAppt: '2024-01-20', notes: 'Sensibil la anestezie locală.' },
  { id: 2,  firstName: 'Ana',      lastName: 'Constantin', phone: '0751 234 567', email: 'ana.constantin@email.com',    birthDate: '1992-07-22', totalVisits: 5,  lastVisit: '2023-12-15', nextAppt: null,         notes: '' },
  { id: 3,  firstName: 'Vlad',     lastName: 'Toma',       phone: '0762 345 678', email: 'vlad.toma@email.com',         birthDate: '1978-11-30', totalVisits: 8,  lastVisit: '2024-01-05', nextAppt: '2024-01-22', notes: 'Control la 6 luni.' },
  { id: 4,  firstName: 'Maria',    lastName: 'Ionescu',    phone: '0723 456 789', email: 'maria.ionescu@email.com',     birthDate: '1995-04-10', totalVisits: 3,  lastVisit: '2023-11-20', nextAppt: null,         notes: '' },
  { id: 5,  firstName: 'George',   lastName: 'Stancu',     phone: '0734 567 890', email: 'george.stancu@email.com',     birthDate: '1988-09-05', totalVisits: 15, lastVisit: '2024-01-09', nextAppt: '2024-01-23', notes: 'Preferă programări dimineața.' },
  { id: 6,  firstName: 'Cristina', lastName: 'Munteanu',   phone: '0745 678 901', email: 'cristina.munteanu@email.com', birthDate: '1990-01-25', totalVisits: 7,  lastVisit: '2024-01-03', nextAppt: '2024-01-24', notes: '' },
  { id: 7,  firstName: 'Bogdan',   lastName: 'Radu',       phone: '0756 789 012', email: 'bogdan.radu@email.com',        birthDate: '1983-06-18', totalVisits: 2,  lastVisit: '2023-10-14', nextAppt: null,         notes: 'Pacient nou.' },
  { id: 8,  firstName: 'Ioana',    lastName: 'Dumitrescu', phone: '0767 890 123', email: 'ioana.dumitrescu@email.com',  birthDate: '2000-12-03', totalVisits: 4,  lastVisit: '2023-12-28', nextAppt: '2024-01-25', notes: '' },
  { id: 9,  firstName: 'Andrei',   lastName: 'Marinescu',  phone: '0778 901 234', email: 'andrei.marinescu@email.com',  birthDate: '1975-08-14', totalVisits: 20, lastVisit: '2024-01-06', nextAppt: null,         notes: 'Implanturi, urmărire pe termen lung.' },
  { id: 10, firstName: 'Elena',    lastName: 'Gheorghe',   phone: '0789 012 345', email: 'elena.gheorghe@email.com',    birthDate: '1999-02-28', totalVisits: 1,  lastVisit: '2024-01-10', nextAppt: '2024-01-26', notes: 'Prima vizită.' },
];

export const PATIENT_HISTORY = {
  1: [
    { id: 101, date: '2024-01-08', service: 'Detartraj',          duration: 45, price: 150, status: 'completed' },
    { id: 102, date: '2023-07-12', service: 'Plombă',             duration: 30, price: 200, status: 'completed' },
    { id: 103, date: '2023-01-20', service: 'Control',            duration: 15, price: 80,  status: 'completed' },
    { id: 104, date: '2022-07-05', service: 'Detartraj',          duration: 45, price: 150, status: 'completed' },
  ],
  3: [
    { id: 301, date: '2024-01-05', service: 'Control',            duration: 15, price: 80,  status: 'completed' },
    { id: 302, date: '2023-07-05', service: 'Extracție',          duration: 60, price: 250, status: 'completed' },
    { id: 303, date: '2023-01-10', service: 'Detartraj',          duration: 45, price: 150, status: 'completed' },
  ],
  5: [
    { id: 501, date: '2024-01-09', service: 'Detartraj',          duration: 45, price: 150, status: 'completed' },
    { id: 502, date: '2023-09-14', service: 'Albire profesională',duration: 90, price: 450, status: 'completed' },
    { id: 503, date: '2023-05-22', service: 'Plombă',             duration: 30, price: 200, status: 'completed' },
    { id: 504, date: '2022-11-30', service: 'Control',            duration: 15, price: 80,  status: 'no_show'   },
  ],
  9: [
    { id: 901, date: '2024-01-06', service: 'Control implant',    duration: 30, price: 120, status: 'completed' },
    { id: 902, date: '2023-07-06', service: 'Control implant',    duration: 30, price: 120, status: 'completed' },
    { id: 903, date: '2023-01-06', service: 'Implant dentar',     duration: 120,price: 3500,status: 'completed' },
  ],
};
