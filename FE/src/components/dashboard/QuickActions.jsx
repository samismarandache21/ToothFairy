// src/components/dashboard/QuickActions.jsx

import { useNavigate } from 'react-router-dom';
import { LuCalendarDays, LuStethoscope, LuChartBar, LuUser, LuArrowRight } from 'react-icons/lu';

const ACTIONS = [
  { Icon: LuCalendarDays, color: '#6366F1', bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', label: 'Programări',  sub: 'Vizualizează calendarul', to: '/calendar'   },
  { Icon: LuStethoscope,  color: '#2DD4BF', bg: 'linear-gradient(135deg,#F0FDFA,#CCFBF1)', label: 'Servicii',    sub: 'Adaugă / modifică',      to: '/services'   },
  { Icon: LuChartBar,     color: '#F59E0B', bg: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', label: 'Statistici',  sub: 'Rapoarte detaliate',     to: '/statistics' },
  { Icon: LuUser,         color: '#F43F5E', bg: 'linear-gradient(135deg,#FFF1F2,#FFE4E6)', label: 'Profil',      sub: 'Editează profilul',      profile: true     },
];

const QuickActions = ({ onProfileClick }) => {
  const navigate = useNavigate();

  return (
    <div className="quick-actions-strip">
      {ACTIONS.map((a) => (
        <button
          key={a.label}
          className="qa-card"
          onClick={() => (a.profile ? onProfileClick() : navigate(a.to))}
        >
          <div className="qa-card__icon" style={{ background: a.bg }}>
            <a.Icon size={20} color={a.color} />
          </div>
          <div className="qa-card__label">{a.label}</div>
          <div className="qa-card__sub">{a.sub}</div>
          <div className="qa-card__arrow">
            <LuArrowRight size={14} color={a.color} />
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
