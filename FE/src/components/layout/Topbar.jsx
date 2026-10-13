// src/components/layout/Topbar.jsx

import { useNavigate } from 'react-router-dom';
import { LuBell, LuPlus } from 'react-icons/lu';
import Button from '../ui/Button';

const Topbar = ({ title, subtitle, doctor, onProfileClick, onMenuOpen }) => {
  const navigate = useNavigate();
  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`;
  const stars    = '★'.repeat(Math.round(doctor.rating));

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="topbar__hamburger" onClick={onMenuOpen} aria-label="Meniu">
          <span /><span /><span />
        </button>
        <div>
          <h1 className="topbar__title">{title}</h1>
          {subtitle && <p className="topbar__sub">{subtitle}</p>}
        </div>
      </div>

      <div className="topbar__right">
        <div className="notif-btn">
          <LuBell size={18} color="#64748B" />
          <div className="notif-btn__dot" />
        </div>

        <Button variant="primary" size="sm" onClick={() => navigate('/calendar')}>
          <LuPlus size={15} style={{ marginRight: 4 }} />
          <span className="topbar__btn-full">Programare nouă</span>
          <span className="topbar__btn-short" style={{ display: 'none' }} />
        </Button>

        <button className="profile-pill" onClick={onProfileClick}>
          <div className="profile-pill__avatar">
            {doctor.profilePhoto
              ? <img src={doctor.profilePhoto} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials}
          </div>
          <div className="profile-pill__info">
            <div className="profile-pill__name">Dr. {doctor.lastName}</div>
            <div className="profile-pill__stars">{stars} {doctor.rating}</div>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
