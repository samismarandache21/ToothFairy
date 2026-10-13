// src/pages/CalendarPage.jsx

import { useState, useMemo } from 'react';
import useCalendar      from '../hooks/useCalendar';
import Sidebar          from '../components/layout/Sidebar';
import Topbar           from '../components/layout/Topbar';
import CalendarGrid     from '../components/calendar/CalendarGrid';
import AppointmentModal   from '../components/calendar/AppointmentModal';
import BreakModal         from '../components/calendar/BreakModal';
import ImportAgendaModal  from '../components/calendar/ImportAgendaModal';
import ProfileModal       from '../components/dashboard/ProfileModal';

import '../styles/globals.css';
import '../styles/components.css';
import '../styles/dashboard.css';
import '../styles/calendar.css';

const MONTHS = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];

const CalendarPage = () => {
  const {
    doctor, workDays, weekOffset, prevWeek, nextWeek, goToday,
    modalOpen, editingAppt, slotInfo, services, patients, totalThisWeek, weekStats,
    openNewAppt, openEditAppt, closeModal, saveAppointment, deleteAppointment, getApptsForDay,
    breakModalOpen, editingBreak, openNewBreak, openEditBreak, closeBreakModal,
    saveBreak, deleteBreak, getBreaksForDay,
    reload,
  } = useCalendar();

  const parsedSchedule = useMemo(() => {
    try { return JSON.parse(doctor?.workingHours ?? 'null'); } catch { return null; }
  }, [doctor?.workingHours]);

  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [importOpen,  setImportOpen]  = useState(false);

  const start = workDays[0];
  const end   = workDays[workDays.length - 1];
  const weekLabel = start && end
    ? `${start.getDate()} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`
    : '';

  return (
    <div className="app-shell">
      <Sidebar doctor={doctor} onProfileClick={() => setProfileOpen(true)}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="main-area">
        <Topbar
          title="Calendar"
          subtitle={`Săptămâna ${weekLabel} · ${totalThisWeek} programări`}
          doctor={doctor}
          onProfileClick={() => setProfileOpen(true)}
          onMenuOpen={() => setMenuOpen(true)}
        />

        <div className="page-content">
          <div className="cal-toolbar">
            <div className="cal-toolbar__left">
              <div className="cal-week-nav">
                <button className="cal-week-nav__btn" onClick={prevWeek}>‹</button>
                {weekOffset !== 0 && (
                  <button className="cal-week-nav__btn cal-week-nav__btn--today" onClick={goToday}>Azi</button>
                )}
                <button className="cal-week-nav__btn" onClick={nextWeek}>›</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setImportOpen(true)}
              >
                📷 Import din poză
              </button>
              <button
                className="btn btn--ghost btn--sm"
                onClick={openNewBreak}
              >
                🕐 Pauze
              </button>
              <button
                className="btn btn--primary btn--sm"
                onClick={() => openNewAppt(workDays[0], '09:00')}
              >
                + Programare nouă
              </button>
            </div>
          </div>

          <CalendarGrid
            workDays={workDays}
            schedule={parsedSchedule}
            getApptsForDay={getApptsForDay}
            getBreaksForDay={getBreaksForDay}
            onSlotClick={openNewAppt}
            onApptClick={openEditAppt}
            onBreakClick={openEditBreak}
          />

          {/* Stats bar */}
          <div className="cal-stats-bar">
            <div className="cal-stat">
              <div className="cal-stat__val">{weekStats.total}</div>
              <div className="cal-stat__label">TOTAL SĂPTĂMÂNĂ</div>
            </div>
            <div className="cal-stat">
              <div className="cal-stat__val">{weekStats.occupancyPct}%</div>
              <div className="cal-stat__sub">{weekStats.occupancyHours}h din {weekStats.availableHours}h disponibile</div>
              <div className="cal-stat__label">OCUPARE PROGRAM</div>
            </div>
            <div className="cal-stat">
              <div className={`cal-stat__val${weekStats.cancelled > 0 ? ' cal-stat__val--danger' : ''}`}>
                {weekStats.cancelled}
              </div>
              <div className="cal-stat__label">ANULĂRI</div>
            </div>
            <div className="cal-stat">
              <div className="cal-stat__val">{weekStats.uniquePatients}</div>
              <div className="cal-stat__label">PACIENȚI UNICI</div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <AppointmentModal
          appt={editingAppt}
          slotInfo={slotInfo}
          services={services}
          patients={patients}
          onSave={saveAppointment}
          onDelete={deleteAppointment}
          onClose={closeModal}
        />
      )}

      {breakModalOpen && (
        <BreakModal
          editingBreak={editingBreak}
          onSave={saveBreak}
          onDelete={deleteBreak}
          onClose={closeBreakModal}
        />
      )}

      {importOpen && (
        <ImportAgendaModal
          onClose={() => setImportOpen(false)}
          onConfirmed={reload}
        />
      )}

      {profileOpen && (
        <ProfileModal doctor={doctor} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
};

export default CalendarPage;
