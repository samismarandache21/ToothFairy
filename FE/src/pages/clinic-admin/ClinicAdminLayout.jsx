import { NavLink, useNavigate } from 'react-router-dom';
import {
  LuLayoutDashboard, LuUsers, LuClipboardList, LuLogOut, LuCreditCard, LuSettings,
} from 'react-icons/lu';
import { useClinicAdmin } from '../../contexts/ClinicAdminContext';

const NAV = [
  { to: '/clinic-admin',          icon: LuLayoutDashboard, label: 'Dashboard'  },
  { to: '/clinic-admin/members',  icon: LuUsers,           label: 'Medici'     },
  { to: '/clinic-admin/requests', icon: LuClipboardList,   label: 'Cereri'     },
  { to: '/clinic-admin/billing',  icon: LuCreditCard,      label: 'Facturare'  },
  { to: '/clinic-admin/settings', icon: LuSettings,        label: 'Setări'     },
];

const ClinicAdminLayout = ({ children }) => {
  const { clinic, logout } = useClinicAdmin();
  const navigate           = useNavigate();

  const handleLogout = () => { logout(); navigate('/clinic-admin/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#fff', borderRight: '1px solid #E5E7EB',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Brand */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/fairy3.png" alt="Clinică" style={{ width: 38, height: 38, objectFit: 'contain', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                {clinic?.name ?? 'Clinică'}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>Portal Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/clinic-admin'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 9, textDecoration: 'none',
              fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
              background: isActive ? '#EEF2FF' : 'transparent',
              color: isActive ? '#6366F1' : '#4B5563',
            })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #F3F4F6' }}>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: 'transparent', fontSize: 13, fontWeight: 500, color: '#EF4444',
          }}>
            <LuLogOut size={16} />
            Deconectare
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
};

export default ClinicAdminLayout;
