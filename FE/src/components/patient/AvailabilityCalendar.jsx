// src/components/patient/AvailabilityCalendar.jsx

import { LuSun, LuCloud } from 'react-icons/lu';

const DAY_NAMES = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AvailabilityCalendar = ({
  days,
  selectedDay,
  onSelectDay,
  slots,
  selectedSlot,
  onSelectSlot,
}) => {
  const today = new Date();

  // Show lunch separator only when there are no slots in the 13:xx window
  // (i.e. the backend blocked that time — likely a real lunch break)
  const allSlotKeys = [...slots.am.map((s) => s.label), ...slots.pm.map((s) => s.label)];
  const hasLunchSlots = allSlotKeys.some((t) => t.startsWith('13:'));
  const showLunchSeparator = !hasLunchSlots && (slots.am.length > 0 || slots.pm.length > 0);

  return (
    <div className="avail-calendar">
      {/* Day strip */}
      <div className="avail-calendar__days-strip">
        {days.map((day, i) => {
          const isToday = day.toDateString() === today.toDateString();
          return (
            <button
              key={i}
              className={`avail-day-btn${selectedDay === i ? ' avail-day-btn--selected' : ''}${isToday ? ' avail-day-btn--today' : ''}`}
              onClick={() => onSelectDay(i)}
            >
              <div className="avail-day-label">{DAY_NAMES[day.getDay()]}</div>
              <div className="avail-day-num">{day.getDate()}</div>
              <div className="avail-day-label">{MONTH_NAMES[day.getMonth()]}</div>
            </button>
          );
        })}
      </div>

      {/* Slots for selected day */}
      <div className="avail-calendar__slots">
        {slots.am.length > 0 && (
          <div className="avail-period">
            <div className="avail-period__label">
              <LuSun size={13} style={{ marginRight: 5, color: '#F59E0B' }} />
              Dimineața
            </div>
            <div className="avail-slots-row">
              {slots.am.map((slot) => (
                <button
                  key={slot.key}
                  className={`avail-slot-btn${selectedSlot?.key === slot.key ? ' avail-slot-btn--selected' : ''}`}
                  disabled={slot.booked}
                  onClick={() => onSelectSlot(slot)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {showLunchSeparator && (
          <div className="avail-lunch-break">
            <span className="avail-lunch-break__icon">🍽️</span>
            <span>Pauză de masă</span>
          </div>
        )}

        {slots.pm.length > 0 && (
          <div className="avail-period">
            <div className="avail-period__label">
              <LuCloud size={13} style={{ marginRight: 5, color: '#6366F1' }} />
              După-amiaza
            </div>
            <div className="avail-slots-row">
              {slots.pm.map((slot) => (
                <button
                  key={slot.key}
                  className={`avail-slot-btn${selectedSlot?.key === slot.key ? ' avail-slot-btn--selected' : ''}`}
                  disabled={slot.booked}
                  onClick={() => onSelectSlot(slot)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {slots.am.length === 0 && slots.pm.length === 0 && (
          <p className="avail-no-slots">Nicio disponibilitate în această zi.</p>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
