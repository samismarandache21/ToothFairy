// src/components/layout/Sidebar.jsx

import GradientText      from '../ui/GradientText';
import SidebarPillItem   from './SidebarPillItem';
import {
  LuLayoutDashboard, LuCalendarDays, LuUsers,
  LuStethoscope, LuChartBar, LuStar, LuGlobe, LuSettings2, LuX,
} from 'react-icons/lu';

const PLAN_FAIRY = { starter: '/fairy1.png', pro: '/fairy2.png' };
const fairyFor = (doctor) => doctor.clinicAccountId ? '/fairy3.png' : (PLAN_FAIRY[doctor.plan] ?? '/fairy1.png');

const NAV_ITEMS = [
  { icon: LuLayoutDashboard, color: '#6366F1', label: 'Dashboard',  to: '/dashboard' },
  { icon: LuCalendarDays,    color: '#2DD4BF', label: 'Programări', to: '/calendar'  },
  { icon: LuUsers,           color: '#F59E0B', label: 'Pacienți',   to: '/patients'  },
];

const CABINET_ITEMS = [
  { icon: LuStethoscope,    color: '#2DD4BF', label: 'Servicii',   to: '/services'     },
  { icon: LuChartBar,color: '#6366F1', label: 'Statistici', to: '/statistics'   },
  { icon: LuStar,     color: '#F59E0B', label: 'Recenzii',   to: '/reviews'      },
  { icon: LuGlobe,    color: '#10B981', label: 'Prezentare', to: '/presentation' },
  { icon: LuSettings2,color: '#94A3B8', label: 'Setări',     to: '/settings'     },
];

const Sidebar = ({ doctor, onProfileClick, isOpen, onClose }) => {
  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`;

  const handleNavClick = () => { if (onClose) onClose(); };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <img
              src={fairyFor(doctor)}
              alt="ToothFairy"
              className="sidebar__logo-fairy"
            />
          </div>
          <div className="sidebar__logo-text">
            <GradientText
              colors={['#2DD4BF', '#6366F1', '#10B981', '#2DD4BF']}
              animationSpeed={6}
              showBorder={false}
            >
              ToothFairy
            </GradientText>
          </div>
          <button className="sidebar__close" onClick={onClose} aria-label="Închide meniu">
            <LuX size={16} />
          </button>
        </div>

        <nav className="sidebar__nav">
          <div className="sidebar__section-label">Principal</div>
          {NAV_ITEMS.map((item) => (
            <SidebarPillItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              iconColor={item.color}
              onClick={handleNavClick}
            />
          ))}

          <div className="sidebar__section-label" style={{ marginTop: 8 }}>Cabinet</div>
          {CABINET_ITEMS.map((item) => (
            <SidebarPillItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              iconColor={item.color}
              onClick={handleNavClick}
            />
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__user" onClick={() => { onProfileClick(); handleNavClick(); }}>
            <div className="sidebar__user-avatar">
              {doctor.profilePhoto
                ? <img src={doctor.profilePhoto} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initials}
            </div>
            <div>
              <div className="sidebar__user-name">Dr. {doctor.lastName}</div>
              <div className="sidebar__user-role">Administrator</div>
            </div>
            <span className="sidebar__user-arrow">›</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
