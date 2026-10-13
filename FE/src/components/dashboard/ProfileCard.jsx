// src/components/dashboard/ProfileCard.jsx

import { useNavigate } from 'react-router-dom';
import { LuBuilding, LuGlobe, LuStar } from 'react-icons/lu';
import Button from '../ui/Button';

const ProfileCard = ({ doctor }) => {
  const navigate  = useNavigate();
  const initials  = `${doctor.firstName?.[0] ?? ''}${doctor.lastName?.[0] ?? ''}`;
  const ratingInt = Math.round(doctor.rating ?? 0);

  return (
    <div className="profile-card">
      {/* Cover photo */}
      <div
        className="profile-card__cover"
        style={doctor.coverPhoto ? {
          backgroundImage:    `url(${doctor.coverPhoto})`,
          backgroundSize:     'cover',
          backgroundPosition: 'center',
        } : {}}
      >
        <div className="profile-card__cover-gradient" />
      </div>

      {/* Avatar row */}
      <div className="profile-card__avatar-row">
        <div className="profile-card__avatar">
          {doctor.profilePhoto
            ? <img src={doctor.profilePhoto} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : initials}
        </div>
      </div>

      <div className="profile-card__body">
        <div className="profile-card__name">Dr. {doctor.firstName} {doctor.lastName}</div>
        <div className="profile-card__cabinet">
          <LuBuilding size={13} style={{ marginRight: 5, color: '#6B7280' }} />
          {doctor.cabinetName}{doctor.city ? ` · ${doctor.city}` : ''}
        </div>

        {/* Rating — single row */}
        <div className="profile-card__rating">
          <span className="rating__stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <LuStar
                key={i}
                size={13}
                style={{ marginRight: 1 }}
                color={i < ratingInt ? '#F59E0B' : '#D1D5DB'}
                fill={i < ratingInt ? '#F59E0B' : 'none'}
              />
            ))}
          </span>
          <span className="rating__num">{Number(doctor.rating ?? 0).toFixed(1)}</span>
          <span className="rating__count">din {doctor.reviewCount ?? 0} recenzii</span>
        </div>

        <div style={{ marginBottom: 12 }}>
          {(() => {
            try {
              const specs = typeof doctor.specialties === 'string'
                ? JSON.parse(doctor.specialties ?? '[]')
                : (doctor.specialties ?? []);
              return specs.map((s) => <span key={s} className="specialty-tag">{s}</span>);
            } catch { return null; }
          })()}
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={() => navigate('/presentation')}
          style={{ marginTop: 4 }}
        >
          <LuGlobe size={14} style={{ marginRight: 6 }} />
          Vezi prezentarea publică
        </Button>
      </div>
    </div>
  );
};

export default ProfileCard;
