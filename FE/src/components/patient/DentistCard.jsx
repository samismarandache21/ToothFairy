// src/components/patient/DentistCard.jsx

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LuMapPin, LuStar, LuClock } from 'react-icons/lu';

const DentistCard = ({ dentist, index = 0 }) => {
  const navigate = useNavigate();
  const initials = `${dentist.firstName?.[0] ?? ''}${dentist.lastName?.[0] ?? ''}`;
  const rating   = dentist.rating ?? 0;

  const handleClick = () => navigate(`/patient/dentist/${dentist.slug || dentist.id}`);

  return (
    <motion.div
      className={`dc${dentist.promoted ? ' dc--promoted' : ''}`}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.22 } }}
      onClick={handleClick}
    >
      {/* Cover photo */}
      <div className="dc__cover">
        {dentist.coverPhoto
          ? <img src={dentist.coverPhoto} alt={dentist.name} className="dc__cover-img" />
          : <div className="dc__cover-fallback">
              <span className="dc__cover-initials">{initials}</span>
            </div>
        }
        <div className="dc__cover-overlay" />
        {dentist.promoted && <div className="dc__promoted">Promovat</div>}
        {dentist.earliestSlot && (
          <div className="dc__slot-badge">
            <LuClock size={11} style={{ marginRight: 3 }} />
            {dentist.earliestSlot}
          </div>
        )}
        <div className="dc__rating-badge">
          <LuStar size={11} fill="#FBBF24" color="#FBBF24" />
          <span>{Number(rating).toFixed(1)}</span>
        </div>
      </div>

      {/* Info */}
      <div className="dc__body">
        <div className="dc__top">
          <div className="dc__avatar">
            {dentist.profilePhoto
              ? <img src={dentist.profilePhoto} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials}
          </div>
          <div className="dc__meta">
            <div className="dc__name">{dentist.title} {dentist.firstName} {dentist.lastName}</div>
            <div className="dc__specialty">{dentist.specialty}</div>
          </div>
        </div>

        {(dentist.city || dentist.address) && (
          <div className="dc__location">
            <LuMapPin size={12} />
            <span>
              {dentist.city}
              {dentist.city && dentist.address && <span style={{ color: '#94A3B8', margin: '0 4px' }}>·</span>}
              {dentist.address && <span style={{ color: '#94A3B8' }}>{dentist.address}</span>}
            </span>
            {dentist.priceRange && <span className="dc__price">{dentist.priceRange}</span>}
          </div>
        )}

        {dentist.services?.length > 0 && (
          <div className="dc__tags">
            {dentist.services.slice(0, 3).map((s) => (
              <span key={s.id} className="dc__tag">{s.name}</span>
            ))}
            {dentist.services.length > 3 && (
              <span className="dc__tag dc__tag--more">+{dentist.services.length - 3}</span>
            )}
          </div>
        )}

        <button className="dc__cta" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
          Programează-te →
        </button>
      </div>
    </motion.div>
  );
};

export default DentistCard;
