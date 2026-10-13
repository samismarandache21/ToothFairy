// src/pages/patient/DentistProfilePage.jsx

import { useParams, useNavigate } from 'react-router-dom';
import { LuMapPin, LuStar, LuPhone, LuMail, LuGlobe } from 'react-icons/lu';
import useDentistProfile    from '../../hooks/useDentistProfile';
import PatientTopbar        from '../../components/patient/PatientTopbar';
import BookingModal         from '../../components/patient/BookingModal';
import MapView              from '../../components/ui/MapView';
import StarRating           from '../../components/ui/StarRating';
import usePatientAuth from '../../hooks/usePatientAuth';

import '../../styles/globals.css';
import '../../styles/patient-portal.css';

const DentistProfilePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { patient } = usePatientAuth();

  const {
    dentist,
    bookingOpen, openBooking, closeBooking,
    preSelectedService,
  } = useDentistProfile(slug);

  if (!dentist) {
    return (
      <div className="dentist-profile-page">
        <PatientTopbar patient={patient} />
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted)' }}>
          Stomatologul nu a fost găsit.
        </div>
      </div>
    );
  }

  const initials = `${dentist.firstName[0]}${dentist.lastName[0]}`;

  return (
    <div className="dentist-profile-page">
      <PatientTopbar patient={patient} />

      {/* Hero */}
      <div className="dentist-profile-hero" style={dentist.coverPhoto ? {
        backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.45), rgba(15,23,42,0.88)), url(${dentist.coverPhoto})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      } : {}}>
        <button className="dentist-profile-hero__back" onClick={() => navigate('/patient/explore')}>
          ← Înapoi la explorare
        </button>
        <div className="dentist-profile-hero__content">
          <div className="dentist-profile-hero__avatar">
            {dentist.profilePhoto
              ? <img src={dentist.profilePhoto} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials}
          </div>
          <div style={{ flex: 1 }}>
            <div className="dentist-profile-hero__name animate-fadeUp" style={{ animationDelay: '0ms' }}>
              {dentist.title} {dentist.firstName} {dentist.lastName}
            </div>
            <div className="dentist-profile-hero__specialty animate-fadeUp" style={{ animationDelay: '80ms' }}>{dentist.specialty}</div>
            <div className="dentist-profile-hero__meta animate-fadeUp" style={{ animationDelay: '160ms' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <LuMapPin size={13} /> {dentist.city}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <StarRating rating={dentist.rating} size={13} gap={2} />
                {Number(dentist.rating).toFixed(1)} ({dentist.reviewCount} recenzii)
              </span>
              {dentist.priceRange && <span>{dentist.priceRange}</span>}
            </div>
          </div>
          <button className="dentist-profile-hero__book-btn animate-fadeUp" style={{ animationDelay: '240ms' }} onClick={() => openBooking(null)}>
            Programează-te acum
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="dentist-profile-body">

        {/* About */}
        <div className="profile-section">
          <div className="profile-section__title">Despre doctor</div>
          <p className="profile-about">{dentist.about}</p>
        </div>

        {/* Services */}
        <div className="profile-section">
          <div className="profile-section__title">Servicii și tarife</div>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10, marginTop: -4 }}>
            Selectează un serviciu pentru a-l rezerva direct.
          </p>
          <div className="profile-services">
            {dentist.services.map((svc) => (
              <div
                key={svc.id}
                className="profile-service-row"
                onClick={() => openBooking(svc)}
                style={{ cursor: 'pointer', borderRadius: 8, transition: 'background 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = `${svc.color}10`}
                onMouseLeave={(e) => e.currentTarget.style.background = ''}
              >
                <div className="profile-service-dot" style={{ background: svc.color }} />
                <div className="profile-service-name">
                  {svc.name}
                  {svc.isConsultation && (
                    <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, background: 'var(--color-mint-bg)', color: 'var(--color-mint-dark)', border: '1px solid var(--color-mint-light)', borderRadius: 20, padding: '1px 7px' }}>Consultație</span>
                  )}
                  {svc.requiresConsultForNew && !svc.isConsultation && (
                    <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 20, padding: '1px 7px' }}>Pac. noi → +consultație</span>
                  )}
                </div>
                <div className="profile-service-duration">{svc.durationMinutes} min</div>
                <div className="profile-service-price">{svc.price} RON</div>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        {(dentist.address || dentist.city) && (
          <div className="profile-section">
            <div className="profile-section__title">Locație și contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, fontSize: 14, color: 'var(--color-slate)' }}>
              {dentist.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LuMapPin size={14} color="#2DD4BF" />
                  {dentist.address}{dentist.city ? `, ${dentist.city}` : ''}
                </div>
              )}
              {dentist.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LuPhone size={14} color="#6B7280" />
                  <a href={`tel:${dentist.phone}`} style={{ color: 'inherit' }}>{dentist.phone}</a>
                </div>
              )}
              {dentist.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LuMail size={14} color="#6B7280" />
                  <a href={`mailto:${dentist.email}`} style={{ color: 'inherit' }}>{dentist.email}</a>
                </div>
              )}
              {dentist.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LuGlobe size={14} color="#6B7280" />
                  <a href={dentist.website} target="_blank" rel="noreferrer" style={{ color: 'var(--color-mint-dark)' }}>{dentist.website}</a>
                </div>
              )}
            </div>
            <MapView
              address={dentist.address}
              city={dentist.city}
              label={`${dentist.title ?? ''} ${dentist.firstName} ${dentist.lastName}`.trim()}
              height={280}
            />
          </div>
        )}

        {/* Reviews */}
        <div className="profile-section">
          <div className="profile-section__title">Recenzii pacienți</div>
          <div className="profile-reviews-summary">
            <div className="profile-reviews-score">{Number(dentist.rating).toFixed(1)}</div>
            <div>
              <div className="profile-reviews-stars">
                <StarRating rating={dentist.rating} size={18} gap={3} />
              </div>
              <div className="profile-reviews-count">{dentist.reviewCount} recenzii</div>
            </div>
          </div>
          <div className="profile-reviews-list">
            {dentist.reviews.map((r) => (
              <div key={r.id} className="profile-review-item">
                <div className="profile-review-header">
                  <span className="profile-review-author">{r.author}</span>
                  <span className="profile-review-date">{r.date}</span>
                </div>
                <div className="profile-review-stars">
                  <StarRating rating={r.rating} size={12} gap={2} />
                </div>
                <div className="profile-review-text">{r.text}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {bookingOpen && (
        <BookingModal
          dentist={dentist}
          preSelectedService={preSelectedService}
          onClose={closeBooking}
        />
      )}
    </div>
  );
};

export default DentistProfilePage;
