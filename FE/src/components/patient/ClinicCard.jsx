// src/components/patient/ClinicCard.jsx

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LuMapPin, LuUsers, LuStar, LuClock } from 'react-icons/lu';

const normalizeSpecialties = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((s, i) => typeof s === 'string' ? { id: i, name: s } : s);
  try { return JSON.parse(raw).map((s, i) => ({ id: i, name: String(s) })); } catch { return []; }
};

const ClinicCard = ({ clinic, index = 0 }) => {
  const navigate      = useNavigate();
  const initial       = clinic.name?.[0] ?? 'C';
  const rating        = clinic.rating ?? 0;
  const specialtyList = normalizeSpecialties(clinic.specialties);

  const doctorCount = clinic.dentistCount ?? (clinic.doctorSlugs?.length ?? 0);
  const handleClick = () => {
    if (clinic.members?.length > 1) {
      navigate('/patient/clinic-group', {
        state: {
          groupMembers: clinic.members,
          clinicContact: {
            name:        clinic.name,
            phone:       clinic.phone       ?? null,
            email:       clinic.email       ?? null,
            address:     clinic.address     ?? null,
            city:        clinic.city        ?? null,
            workingHours: clinic.workingHours ?? null,
          },
        },
      });
    } else {
      navigate(`/patient/clinic/${clinic.slug || clinic.id}`);
    }
  };

  return (
    <motion.div
      className={`dc${clinic.promoted ? ' dc--promoted' : ''}`}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.22 } }}
      onClick={handleClick}
    >
      {/* Cover photo */}
      <div className="dc__cover">
        {clinic.coverPhoto
          ? <img src={clinic.coverPhoto} alt={clinic.name} className="dc__cover-img" />
          : <div className="dc__cover-fallback dc__cover-fallback--clinic">
              <span className="dc__cover-initials">{initial}</span>
            </div>
        }
        <div className="dc__cover-overlay" />
        {clinic.promoted && <div className="dc__promoted">Promovat</div>}
        {clinic.earliestSlot && (
          <div className="dc__slot-badge">
            <LuClock size={11} style={{ marginRight: 3 }} />
            {clinic.earliestSlot}
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
          <div className="dc__avatar dc__avatar--clinic">
            {clinic.profilePhoto
              ? <img src={clinic.profilePhoto} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initial}
          </div>
          <div className="dc__meta">
            <div className="dc__name">{clinic.name}</div>
            <div className="dc__specialty">
              <LuUsers size={12} style={{ marginRight: 3 }} />
              {doctorCount} medic{doctorCount !== 1 ? 'i' : ''}
            </div>
          </div>
        </div>

        {(clinic.city || clinic.address) && (
          <div className="dc__location">
            <LuMapPin size={12} />
            <span style={{ flex: 1, minWidth: 0 }}>
              {clinic.city}
              {clinic.city && clinic.address && <span style={{ color: '#94A3B8', margin: '0 4px' }}>·</span>}
              {clinic.address && <span style={{ color: '#94A3B8' }}>{clinic.address}</span>}
            </span>
            <span className="dc__reviews">({clinic.reviewCount} recenzii)</span>
          </div>
        )}

        {specialtyList.length > 0 && (
          <div className="dc__tags">
            {specialtyList.slice(0, 3).map((s) => (
              <span key={s.id} className="dc__tag">{s.name}</span>
            ))}
            {specialtyList.length > 3 && (
              <span className="dc__tag dc__tag--more">+{specialtyList.length - 3}</span>
            )}
          </div>
        )}

        <button className="dc__cta" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
          Vezi clinica →
        </button>
      </div>
    </motion.div>
  );
};

export default ClinicCard;
