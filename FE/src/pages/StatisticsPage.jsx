// src/pages/StatisticsPage.jsx

import { useState } from 'react';
import useStatistics from '../hooks/useStatistics';
import Sidebar       from '../components/layout/Sidebar';
import Topbar        from '../components/layout/Topbar';
import ProfileModal  from '../components/dashboard/ProfileModal';
import Button        from '../components/ui/Button';

import '../styles/globals.css';
import '../styles/components.css';
import '../styles/dashboard.css';
import '../styles/statistics.css';

const BAR_H = 140;
const TODAY_ISO = new Date().toISOString().slice(0, 10);

const StatisticsPage = () => {
  const { doctor, kpis, weeklyAppts, monthlyTrend, serviceBreakdown } = useStatistics();
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  const maxBar = Math.max(...weeklyAppts.map((d) => d.count), 1);

  return (
    <div className="app-shell">
      <Sidebar doctor={doctor} onProfileClick={() => setProfileOpen(true)}
        isOpen={menuOpen} onClose={() => setMenuOpen(false)}
      />

      <div className="main-area">
        <Topbar
          title="Statistici"
          subtitle="Date în timp real pentru cabinetul tău"
          doctor={doctor}
          onProfileClick={() => setProfileOpen(true)}
          onMenuOpen={() => setMenuOpen(true)}
        />

        <div className="page-content">

          {/* ── KPI Cards ──────────────────────────────────────────────── */}
          <div className="stats-kpi-grid animate-fadeUp">
            {kpis.map((k) => (
              <div key={k.id} className="stat-kpi-card">
                <div className="stat-kpi-card__icon" style={{ background: k.bg }}>
                  {k.Icon ? <k.Icon size={20} color={k.iconColor} /> : k.icon}
                </div>
                <div className="stat-kpi-card__body">
                  <div className="stat-kpi-card__value">{k.value ?? 0}</div>
                  <div className="stat-kpi-card__label">{k.label}</div>
                </div>
                {k.trend ? (
                  <div className={`stat-kpi-card__trend ${k.trendType === 'warn' ? 'trend--warn' : 'trend--up'}`}>
                    {k.trendType === 'warn' ? '⚠ ' : '↑ '}{k.trend}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* ── Charts row ─────────────────────────────────────────────── */}
          <div className="stats-charts-row animate-fadeUp" style={{ animationDelay: '60ms' }}>

            {/* Weekly bar chart */}
            <div className="chart-card">
              <div className="chart-card__title">Programări săptămâna curentă</div>
              <div className="bar-chart">
                {weeklyAppts.map((item, i) => {
                  const isToday = item.date === TODAY_ISO;
                  const barH    = Math.max((item.count / maxBar) * BAR_H, item.count > 0 ? 6 : 2);
                  return (
                    <div key={i} className="bar-chart__col">
                      <span className="bar-chart__value" style={{ color: item.count > 0 ? 'var(--color-navy)' : 'var(--color-muted)' }}>
                        {item.count}
                      </span>
                      <div
                        className={`bar-chart__bar${isToday ? ' bar-chart__bar--today' : ''}`}
                        style={{ height: barH, opacity: item.count === 0 ? 0.25 : 1 }}
                        title={`${item.day}: ${item.count} programări`}
                      />
                      <div className={`bar-chart__label${isToday ? ' bar-chart__label--today' : ''}`}>
                        {item.day}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Service breakdown */}
            <div className="chart-card">
              <div className="chart-card__title">Distribuție servicii (luna asta)</div>
              {serviceBreakdown.length === 0 ? (
                <div style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 24, textAlign: 'center' }}>
                  Nicio programare luna asta.
                </div>
              ) : (
                <div className="service-breakdown">
                  {serviceBreakdown.map((s) => (
                    <div key={s.service} className="svc-breakdown-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <span className="svc-breakdown-name">{s.service}</span>
                        <span className="svc-breakdown-pct" style={{ marginLeft: 'auto' }}>{s.pct}%</span>
                      </div>
                      <div className="svc-breakdown-bar-wrap">
                        <div className="svc-breakdown-bar" style={{ width: `${s.pct}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Monthly trend ───────────────────────────────────────────── */}
          <div className="monthly-table animate-fadeUp" style={{ animationDelay: '120ms' }}>
            <div className="monthly-table__head">
              <div className="monthly-table__th">Lună</div>
              <div className="monthly-table__th">Programări</div>
              <div className="monthly-table__th">Pacienți noi</div>
              <div className="monthly-table__th">Venit estimat</div>
            </div>
            {[...monthlyTrend].reverse().map((m, i) => (
              <div key={m.month} className={`monthly-table__row${i === 0 ? ' monthly-table__row--current' : ''}`}>
                <div className="monthly-table__month">
                  {m.month}
                  {i === 0 && <span className="monthly-current-badge">curentă</span>}
                </div>
                <div className="monthly-table__val">{m.appts}</div>
                <div className="monthly-table__val">{m.patients}</div>
                <div className="monthly-table__revenue">{(m.revenue ?? 0).toLocaleString()} RON</div>
              </div>
            ))}
          </div>

          <div className="stats-export">
            <Button variant="ghost" size="sm">⬇ Export CSV</Button>
          </div>
        </div>
      </div>

      {profileOpen && <ProfileModal doctor={doctor} onClose={() => setProfileOpen(false)} />}
    </div>
  );
};

export default StatisticsPage;
