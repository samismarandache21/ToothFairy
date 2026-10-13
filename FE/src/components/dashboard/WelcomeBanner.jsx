// src/components/dashboard/WelcomeBanner.jsx

import { LuCalendarDays, LuStar } from 'react-icons/lu';

const WelcomeBanner = ({ doctor, todayCount }) => {
  const stars = '★'.repeat(Math.round(doctor.rating));

  return (
    <div className="welcome-banner">
      <div className="banner-orb banner-orb--1" />
      <div className="banner-orb banner-orb--2" />
      <div className="banner-orb banner-orb--3" />

      <div className="welcome-banner__text">
        <h2>Bună ziua, Dr. {doctor.lastName}!</h2>
        <p>Cabinetul tău în formă maximă astăzi.</p>

        <div className="banner-pills">
          <span className="banner-pill">
            <LuCalendarDays size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            {todayCount} programări azi
          </span>
          <span className="banner-pill">
            <LuStar size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            {doctor.rating} rating
          </span>
        </div>
      </div>

      <div className="welcome-banner__rating">
        <div className="banner-rating__stars">{stars}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div className="banner-rating__num">{doctor.rating}</div>
          <div className="banner-rating__label">
            / 5.0<br />din {doctor.reviewCount} recenzii
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
