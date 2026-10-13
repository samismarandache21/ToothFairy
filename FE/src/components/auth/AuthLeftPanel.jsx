// src/components/auth/AuthLeftPanel.jsx

import { LuCalendarDays, LuMessageSquare, LuGlobe, LuChartBar, LuStethoscope } from 'react-icons/lu';

const FEATURES = [
  { Icon: LuCalendarDays,  color: '#2DD4BF', title: 'Calendar inteligent',  desc: 'cu drag & drop și detecție conflicte' },
  { Icon: LuMessageSquare, color: '#6366F1', title: 'SMS automate',          desc: 'reminder 24h înainte, control la 6 luni' },
  { Icon: LuGlobe,         color: '#10B981', title: 'Portal pacienți',        desc: 'programare online 24/7' },
  { Icon: LuChartBar,      color: '#F59E0B', title: 'Statistici',             desc: 'no-show rate, pacienți noi, tendințe' },
];

const STATS = [
  { num: '98%',  label: 'Rată citire SMS' },
  { num: '-40%', label: 'Reducere no-show' },
  { num: '3 min', label: 'Setup inițial' },
];

const AuthLeftPanel = () => {
  return (
    <div className="auth-left">
      {/* Decorative circles */}
      <div className="auth-left__circle auth-left__circle--1" />
      <div className="auth-left__circle auth-left__circle--2" />
      <div className="auth-left__circle auth-left__circle--3" />
      <div className="auth-left__circle auth-left__circle--4" />

      {/* Brand */}
      <div className="auth-brand">
        <img src="/fairy3.png" alt="ToothFairy" style={{ width: 48, height: 48, objectFit: 'contain' }} />
        <div className="auth-brand__name">
          Tooth<span>Fairy</span>
        </div>
      </div>

      {/* Welcome tag */}
      <div className="auth-welcome-tag">✦ Bun venit</div>

      {/* Hero title */}
      <h1 className="auth-hero-title">
        Magia unui<br />
        cabinet <em>organizat</em><br />
        începe aici.
      </h1>

      {/* Subtitle */}
      <p className="auth-hero-sub">
        ToothFairy transformă haosul programărilor într-o experiență
        fluidă — pentru tine și pentru pacienții tăi.
      </p>

      {/* Features list */}
      <div className="auth-features">
        {FEATURES.map((f) => (
          <div key={f.title} className="auth-feature">
            <div className="auth-feature__icon">
              <f.Icon size={16} color={f.color} />
            </div>
            <div className="auth-feature__text">
              <strong>{f.title}</strong> {f.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="auth-stats">
        {STATS.map((s) => (
          <div key={s.label} className="auth-stat">
            <div className="auth-stat__num">{s.num}</div>
            <div className="auth-stat__label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthLeftPanel;
