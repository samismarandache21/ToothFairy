// src/pages/PatientsPage.jsx

import { useState, useEffect } from 'react';
import usePatients   from '../hooks/usePatients';
import Sidebar       from '../components/layout/Sidebar';
import Topbar        from '../components/layout/Topbar';
import PatientModal  from '../components/patients/PatientModal';
import ProfileModal  from '../components/dashboard/ProfileModal';
import Button        from '../components/ui/Button';

import '../styles/globals.css';
import '../styles/components.css';
import '../styles/dashboard.css';
import '../styles/patients.css';

const PatientsPage = () => {
  const {
    doctor, patients, totalCount, search, setSearch,
    selectedPatient, modalOpen, openPatient, closeModal,
    getHistory, savePatient, deletePatient,
  } = usePatients();

  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [patientHistory, setPatientHistory] = useState([]);

  useEffect(() => {
    if (modalOpen && selectedPatient?.id) {
      getHistory(selectedPatient.id).then(setPatientHistory).catch(() => setPatientHistory([]));
    } else {
      setPatientHistory([]);
    }
  }, [modalOpen, selectedPatient]);

  return (
    <div className="app-shell">
      <Sidebar doctor={doctor} onProfileClick={() => setProfileOpen(true)}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="main-area">
        <Topbar
          title="Pacienți"
          subtitle={`${totalCount} pacienți înregistrați`}
          doctor={doctor}
          onProfileClick={() => setProfileOpen(true)}
          onMenuOpen={() => setMenuOpen(true)}
        />

        <div className="page-content">
          {/* Toolbar */}
          <div className="patients-toolbar">
            <div className="patients-search-wrap">
              <span className="patients-search-icon">🔍</span>
              <input
                className="patients-search"
                placeholder="Caută după nume, telefon sau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="patients-count">
              {patients.length} rezultate
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openPatient({
                id: null, firstName: '', lastName: '', phone: '',
                email: '', birthDate: '', notes: '',
                totalVisits: 0, lastVisit: null, nextAppt: null,
              })}
            >
              + Pacient nou
            </Button>
          </div>

          {/* Table */}
          <div className="patients-table animate-fadeUp">
            <div className="patients-table__head">
              <div className="patients-table__th">Pacient</div>
              <div className="patients-table__th">Telefon</div>
              <div className="patients-table__th">Ultima vizită</div>
              <div className="patients-table__th">Vizite</div>
              <div className="patients-table__th">Urmätoarea</div>
              <div className="patients-table__th"></div>
            </div>

            {patients.map((p) => {
              const initials = `${p.firstName[0] ?? '?'}${p.lastName[0] ?? '?'}`;
              return (
                <div
                  key={p.id}
                  className="patients-table__row"
                  onClick={() => openPatient(p)}
                >
                  <div className="patient-name-col">
                    <div className="patient-avatar">{initials}</div>
                    <div>
                      <div className="patient-fullname">{p.firstName} {p.lastName}</div>
                      <div className="patient-email">{p.email}</div>
                    </div>
                  </div>
                  <div className="patients-table__td">{p.phone}</div>
                  <div className="patients-table__td">{p.lastVisit ?? '—'}</div>
                  <div className="patients-table__td td--visits">{p.totalVisits}</div>
                  <div className={`patients-table__td ${p.nextAppt ? 'td--has-appt' : 'td--no-appt'}`}>
                    {p.nextAppt ?? 'Neprogramat'}
                  </div>
                  <div>
                    <button
                      className="icon-btn icon-btn--edit"
                      onClick={(e) => { e.stopPropagation(); openPatient(p); }}
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              );
            })}

            {patients.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)', fontWeight: 600 }}>
                Niciun pacient găsit.
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && selectedPatient && (
        <PatientModal
          patient={selectedPatient}
          history={patientHistory}
          onClose={closeModal}
          onSave={savePatient}
          onDelete={deletePatient}
        />
      )}

      {profileOpen && (
        <ProfileModal doctor={doctor} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
};

export default PatientsPage;
