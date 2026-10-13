// src/components/patient/PatientTopbar.jsx

import { useState, useRef, useEffect } from 'react';
import GradientText from '../ui/GradientText';
import { useNavigate } from 'react-router-dom';
import { LuCalendarDays, LuLogOut, LuChevronDown } from 'react-icons/lu';
import { removePatientToken } from '../../lib/api';

const PatientTopbar = ({ patient }) => {
  const navigate = useNavigate();
  const initials = patient
    ? `${patient.firstName[0]}${patient.lastName[0]}`
    : '?';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    removePatientToken();
    navigate('/patient/login');
  };

  return (
    <header className="pt-topbar">
      <button className="pt-topbar__logo" onClick={() => navigate('/patient/explore')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <img src="/fairy1.png" alt="ToothFairy" className="pt-topbar__logo-fairy" />
        <span className="pt-topbar__logo-text">
          <GradientText
            colors={['#2DD4BF', '#6366F1', '#10B981', '#2DD4BF']}
            animationSpeed={6}
            showBorder={false}
          >
            ToothFairy
          </GradientText>
        </span>
      </button>

      <div className="pt-topbar__right">
        {patient && (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button className="pt-topbar__user" onClick={() => setMenuOpen((o) => !o)}>
              <div className="pt-topbar__avatar">{initials}</div>
              <span>{patient.firstName}</span>
              <LuChevronDown size={13} style={{ marginLeft: 2, opacity: 0.6 }} />
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,.1)', minWidth: 180, zIndex: 100,
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => { setMenuOpen(false); navigate('/patient/bookings'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#1E293B' }}
                >
                  <LuCalendarDays size={15} color="#2DD4BF" />
                  Programările mele
                </button>
                <hr style={{ margin: 0, borderColor: '#F3F4F6' }} />
                <button
                  onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#DC2626' }}
                >
                  <LuLogOut size={15} color="#DC2626" />
                  Deconectare
                </button>
              </div>
            )}
          </div>
        )}
        {!patient && (
          <button className="pt-topbar__user" onClick={() => navigate('/patient/login')}>
            Intră în cont
          </button>
        )}
      </div>
    </header>
  );
};

export default PatientTopbar;
