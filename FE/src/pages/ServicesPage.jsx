// src/pages/ServicesPage.jsx

import { useState } from 'react';
import { LuPencil, LuTrash2 } from 'react-icons/lu';
import useServices  from '../hooks/useServices';
import Sidebar       from '../components/layout/Sidebar';
import Topbar        from '../components/layout/Topbar';
import ServiceModal  from '../components/services/ServiceModal';
import ProfileModal  from '../components/dashboard/ProfileModal';
import Button        from '../components/ui/Button';

import '../styles/globals.css';
import '../styles/components.css';
import '../styles/dashboard.css';
import '../styles/services.css';

const ServicesPage = () => {
  const {
    doctor, services, modalOpen, editingService,
    openAdd, openEdit, closeModal, saveService, deleteService,
  } = useServices();

  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar doctor={doctor} onProfileClick={() => setProfileOpen(true)}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="main-area">
        <Topbar
          title="Servicii"
          subtitle={`${services.length} servicii configurate`}
          doctor={doctor}
          onProfileClick={() => setProfileOpen(true)}
          onMenuOpen={() => setMenuOpen(true)}
        />

        <div className="page-content">
          <div className="services-header">
            <div>
              <h2 className="services-header__title">Lista serviciilor</h2>
              <p className="services-header__sub">
                Gestionează serviciile, prețurile și setările pentru pacienți noi.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={openAdd}>
              + Serviciu nou
            </Button>
          </div>

          <div className="services-table animate-fadeUp">
            <div className="services-table__head">
              <div className="services-table__th"></div>
              <div className="services-table__th">Denumire</div>
              <div className="services-table__th">Durată</div>
              <div className="services-table__th">Preț</div>
              <div className="services-table__th">Tip</div>
              <div className="services-table__th">Acțiuni</div>
            </div>

            {services.map((s) => (
              <div key={s.id} className="services-table__row">
                <div>
                  <div className="svc-color-dot" style={{ background: s.color }} />
                </div>
                <div className="svc-name">{s.name}</div>
                <div className="svc-dur">{s.duration} min</div>
                <div className="svc-price">{s.price} RON</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {s.isConsultation ? (
                    <span className="svc-badge svc-badge--consult">Consultație</span>
                  ) : (
                    <span className="svc-badge" style={{ background: `${s.color}22`, color: s.color, borderColor: `${s.color}44` }}>
                      Tratament
                    </span>
                  )}
                  {s.requiresConsultForNew && !s.isConsultation && (
                    <span className="svc-badge svc-badge--auto">Auto</span>
                  )}
                </div>
                <div className="svc-actions">
                  <button className="icon-btn icon-btn--edit" onClick={() => openEdit(s)}><LuPencil size={13} /></button>
                  <button className="icon-btn icon-btn--del"  onClick={() => deleteService(s.id)}><LuTrash2 size={13} /></button>
                </div>
              </div>
            ))}

            {services.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)', fontWeight: 600 }}>
                Niciun serviciu. Adaugă primul serviciu!
              </div>
            )}
          </div>

          <p className="services-info-note">
            Serviciile marcate cu <strong>Auto</strong> adaugă o consultație automată când un pacient nou se programează pentru prima dată la cabinet.
          </p>
        </div>
      </div>

      {modalOpen && (
        <ServiceModal
          service={editingService}
          onSave={saveService}
          onClose={closeModal}
        />
      )}

      {profileOpen && (
        <ProfileModal doctor={doctor} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
};

export default ServicesPage;