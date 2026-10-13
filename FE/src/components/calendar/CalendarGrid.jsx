// src/components/calendar/CalendarGrid.jsx

import { useState, useEffect, useMemo } from 'react';
import { toISO } from '../../utils/calendarData';

const HOUR_HEIGHT = 80;
const START_HOUR  = 0;
const END_HOUR    = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOURS       = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

const DAY_LABELS = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];
const RO_DAYS    = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

const parseTimeMin = (str) => {
  const [h, m] = (str ?? '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minToLabel = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}:00` : `${h}:${String(m).padStart(2, '0')}`;
};

const buildScheduleMap = (schedule) => {
  if (!Array.isArray(schedule)) return null;
  const map = {};
  schedule.forEach((e) => {
    map[e.day] = {
      open:         !!e.open,
      workStartMin: e.open ? parseTimeMin(e.start ?? '08:00') : 0,
      workEndMin:   e.open ? parseTimeMin(e.end   ?? '18:00') : 0,
    };
  });
  return map;
};

const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const addMinutes = (timeStr, mins) => {
  const total = timeToMinutes(timeStr) + mins;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const getNowInfo = () => {
  const now  = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = START_HOUR * 60;
  if (mins < start || mins > END_HOUR * 60) return null;
  return {
    top:  ((mins - start) / 60) * HOUR_HEIGHT,
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  };
};

const CalendarGrid = ({ workDays, schedule, getApptsForDay, getBreaksForDay, onSlotClick, onApptClick, onBreakClick }) => {
  const today    = new Date();
  const todayISO = toISO(today);

  const scheduleMap = useMemo(() => buildScheduleMap(schedule), [schedule]);

  const getDayConfig = (date) => {
    const dayName = RO_DAYS[date.getDay()];
    if (scheduleMap?.[dayName]) return scheduleMap[dayName];
    const dow = date.getDay();
    return { open: dow !== 0 && dow !== 6, workStartMin: 8 * 60, workEndMin: 18 * 60 };
  };

  const [nowInfo, setNowInfo] = useState(getNowInfo);
  useEffect(() => {
    const id = setInterval(() => setNowInfo(getNowInfo()), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleColumnClick = (e, day, dayConfig) => {
    const rect     = e.currentTarget.getBoundingClientRect();
    const y        = e.clientY - rect.top;
    const totalMin = Math.floor((y / HOUR_HEIGHT) * 60) + START_HOUR * 60;
    const h        = Math.floor(totalMin / 60);
    const m        = Math.floor((totalMin % 60) / 30) * 30;
    if (totalMin >= dayConfig.workStartMin && totalMin < dayConfig.workEndMin) {
      onSlotClick(day, `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  };

  const totalHeight = TOTAL_HOURS * HOUR_HEIGHT;

  return (
    <div className="cal-grid">
      <div className="cal-body-scroll">
        {/* ── Header (sticky) ── */}
        <div className="cal-header" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <div className="cal-header__spacer" />
          {workDays.map((day, i) => {
            const isToday   = toISO(day) === todayISO;
            const dayConfig = getDayConfig(day);
            return (
              <div
                key={i}
                className={[
                  'cal-day-header',
                  isToday          ? 'cal-day-header--today'  : '',
                  !dayConfig.open  ? 'cal-day-header--weekend' : '',
                ].join(' ')}
              >
                <div className="cal-day-label">{DAY_LABELS[i]}</div>
                <div className={`cal-day-num${isToday ? ' cal-day-num--today' : ''}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="cal-body">
          {/* Time column */}
          <div className="cal-time-col">
            {HOURS.map((h) => (
              <div key={h} className="cal-time-label" style={{ height: HOUR_HEIGHT }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {workDays.map((day, i) => {
            const dayAppts  = getApptsForDay(day);
            const dayBreaks = getBreaksForDay ? getBreaksForDay(day) : [];
            const isToday   = toISO(day) === todayISO;
            const dayConfig = getDayConfig(day);
            const { open, workEndMin } = dayConfig;

            const afterTop    = ((workEndMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
            const afterHeight = ((END_HOUR * 60 - workEndMin) / 60) * HOUR_HEIGHT;

            return (
              <div
                key={i}
                className={[
                  'cal-day-col',
                  isToday ? 'cal-day-col--today'  : '',
                  !open   ? 'cal-day-col--weekend' : '',
                ].join(' ')}
                style={{ height: totalHeight }}
                onClick={(e) => {
                  if (open && e.target === e.currentTarget) handleColumnClick(e, day, dayConfig);
                }}
              >
                {/* Hour + half-hour lines */}
                {HOURS.map((h) => (
                  <div key={h}       className="cal-hour-line" style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} />
                ))}
                {HOURS.map((h) => (
                  <div key={`${h}h`} className="cal-half-line" style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }} />
                ))}

                {/* Break stripes */}
                {open && dayBreaks.map((brk) => {
                  const startMins = timeToMinutes(brk.startTime);
                  const top       = ((startMins - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                  const height    = (brk.durationMinutes / 60) * HOUR_HEIGHT;
                  const endTime   = addMinutes(brk.startTime, brk.durationMinutes);
                  return (
                    <div
                      key={brk.id}
                      className="cal-break"
                      style={{ top, height, '--break-color': brk.color ?? '#F59E0B' }}
                      onClick={(e) => { e.stopPropagation(); onBreakClick && onBreakClick(brk); }}
                    >
                      <span className="cal-break__label">
                        {brk.title} · {brk.startTime}–{endTime}
                      </span>
                    </div>
                  );
                })}

                {/* After-hours shading — dynamic based on doctor's actual work end */}
                {open && afterHeight > 0 && (
                  <div
                    className="cal-after-hours"
                    style={{ top: afterTop, height: afterHeight }}
                  >
                    <span className="cal-after-hours__label">DUPĂ {minToLabel(workEndMin)}</span>
                  </div>
                )}

                {/* Closed overlay */}
                {!open && (
                  <div className="cal-day-closed">
                    <span className="cal-day-closed__label">
                      {day.getDay() === 0
                        ? 'INCHIS · DUMINICĂ'
                        : day.getDay() === 6
                          ? 'INCHIS · SÂMBĂTĂ'
                          : 'INCHIS'}
                    </span>
                  </div>
                )}

                {/* Current time line */}
                {isToday && nowInfo !== null && (
                  <div className="cal-now-line" style={{ top: nowInfo.top }}>
                    <div className="cal-now-bubble">{nowInfo.time}</div>
                  </div>
                )}

                {/* Empty state */}
                {open && dayAppts.length === 0 && dayBreaks.length === 0 && (
                  <div
                    className="cal-empty"
                    style={{ paddingTop: 48 }}
                    onClick={(e) => { e.stopPropagation(); onSlotClick(day, '09:00'); }}
                  >
                    <div className="cal-empty__icon">+</div>
                    <div className="cal-empty__label">Adaugă</div>
                  </div>
                )}

                {/* Appointments */}
                {dayAppts.map((appt) => {
                  const startMins = timeToMinutes(appt.startTime);
                  const top       = ((startMins - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                  const height    = Math.max((appt.duration / 60) * HOUR_HEIGHT, 26);
                  const endTime   = addMinutes(appt.startTime, appt.duration);

                  return (
                    <div
                      key={appt.id}
                      className={`cal-appt${appt.status === 'cancelled' ? ' cal-appt--cancelled' : ''}`}
                      style={{
                        top,
                        height,
                        background:      `${appt.color}1A`,
                        borderLeftColor: appt.color,
                      }}
                      onClick={(e) => { e.stopPropagation(); onApptClick(appt); }}
                    >
                      <div className="cal-appt__name">{appt.service || 'Consultație'}</div>
                      {height > 36 && (
                        <div className="cal-appt__patient">{appt.patient}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
