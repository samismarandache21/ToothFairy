// src/components/dashboard/StatsGrid.jsx

import { useRef } from 'react';

const trendClass = { up: 'trend--up', warn: 'trend--warn', down: 'trend--down' };

const Stat3DCard = ({ stat, index }) => {
  const ref = useRef(null);

  const onMouseMove = (e) => {
    const el   = ref.current;
    const rect = el.getBoundingClientRect();
    const x    = (e.clientX - rect.left)  / rect.width  - 0.5;
    const y    = (e.clientY - rect.top)   / rect.height - 0.5;
    el.style.transition  = 'box-shadow .08s ease';
    el.style.transform   = `perspective(700px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) translateY(-6px) scale(1.025)`;
    el.style.boxShadow   = `${-x * 18}px ${Math.abs(y) * 18 + 4}px 40px rgba(45,212,191,.18)`;
  };

  const onMouseLeave = () => {
    const el = ref.current;
    el.style.transition = 'transform .55s cubic-bezier(.23,1,.32,1), box-shadow .55s ease';
    el.style.transform  = '';
    el.style.boxShadow  = '';
  };

  const Icon = stat.Icon;

  return (
    <div
      ref={ref}
      className="stat-card stat-card--3d"
      style={{ animationDelay: `${index * 80}ms` }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div className="stat-card__glow" style={{ background: stat.bg }} />
      <div className="stat-card__top">
        <div className="stat-card__icon" style={{ background: stat.bg }}>
          {Icon ? <Icon size={20} color={stat.iconColor} /> : stat.icon}
        </div>
        <span className={`stat-card__trend ${trendClass[stat.trendType]}`}>{stat.trend}</span>
      </div>
      <div className="stat-card__value">{stat.value}</div>
      <div className="stat-card__label">{stat.label}</div>
    </div>
  );
};

const StatsGrid = ({ stats }) => (
  <div className="stats-grid">
    {stats.map((s, i) => (
      <Stat3DCard key={s.id} stat={s} index={i} />
    ))}
  </div>
);

export default StatsGrid;
