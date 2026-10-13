// src/utils/dateFormatter.js

const DAYS   = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'];
const MONTHS = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
                'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];

export const formatFullDate = (date = new Date()) =>
  `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

export const formatTime = (date = new Date()) =>
  date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
