// src/utils/greeting.js
// Logică pură — zero UI, zero React. Ușor de testat.

/**
 * Returnează salutul potrivit în funcție de ora din zi.
 * @param {Date} [now] - opțional, pentru testare (default: Date curentă)
 * @returns {{ greeting: string, emoji: string, period: string }}
 */
export const getGreeting = (now = new Date()) => {
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return {
      greeting: 'Bună dimineața',
      emoji: '☀️',
      period: 'morning',
    };
  }

  if (hour >= 12 && hour < 18) {
    return {
      greeting: 'Bună ziua',
      emoji: '🌤️',
      period: 'afternoon',
    };
  }

  if (hour >= 18 && hour < 22) {
    return {
      greeting: 'Bună seara',
      emoji: '🌙',
      period: 'evening',
    };
  }

  // 22:00 – 04:59
  return {
    greeting: 'Noapte bună',
    emoji: '🌟',
    period: 'night',
  };
};

/**
 * Returnează textul complet de greeting pentru un doctor.
 * @param {string} doctorName
 * @param {Date}   [now]
 * @returns {string}  ex: "Bună dimineața, Dr. Popescu! ☀️"
 */
export const getDoctorGreeting = (doctorName, now = new Date()) => {
  const { greeting } = getGreeting(now);
  return `${greeting}, Dr. ${doctorName}!`;
};
