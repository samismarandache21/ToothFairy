// src/pages/DashboardPage.jsx
import { useState } from 'react';
import useDashboard      from '../hooks/useDashboard';
import Sidebar           from '../components/layout/Sidebar';
import Topbar            from '../components/layout/Topbar';
import WelcomeBanner     from '../components/dashboard/WelcomeBanner';
import StatsGrid         from '../components/dashboard/StatsGrid';
import ProfileCard       from '../components/dashboard/ProfileCard';
import ProfileModal      from '../components/dashboard/ProfileModal';

import '../styles/globals.css';
import '../styles/components.css';
import '../styles/dashboard.css';

const DashboardPage = () => {
  const {
    doctor, stats,
    greeting, currentDate, todayCount,
    profileOpen, openProfile, closeProfile,
    loading, error,
  } = useDashboard();

  const [menuOpen, setMenuOpen] = useState(false);

  if (loading && !doctor) {
    return <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#6B7280' }}>Se încarcă...</div>;
  }

  if (error && !doctor) {
    return <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#EF4444' }}>{error}</div>;
  }

  return (
    <div className="app-shell">
      <Sidebar
        doctor={doctor}
        onProfileClick={openProfile}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="main-area">
        <Topbar
          title={greeting}
          subtitle={`${currentDate} · ${todayCount} programări astăzi`}
          doctor={doctor}
          onProfileClick={openProfile}
          onMenuOpen={() => setMenuOpen(true)}
        />
        <div className="page-content">
          <WelcomeBanner doctor={doctor} todayCount={todayCount} />
          <StatsGrid stats={stats} />
          <ProfileCard doctor={doctor} />
        </div>
      </div>
      {profileOpen && <ProfileModal doctor={doctor} onClose={closeProfile} />}
    </div>
  );
};

export default DashboardPage;
