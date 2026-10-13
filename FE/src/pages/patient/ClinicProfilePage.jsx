// src/pages/patient/ClinicProfilePage.jsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LuMapPin, LuPhone, LuMail, LuCalendarDays, LuStar } from 'react-icons/lu';
import useClinicProfile     from '../../hooks/useClinicProfile';
import MapView              from '../../components/ui/MapView';
import PatientTopbar        from '../../components/patient/PatientTopbar';
import AvailabilityCalendar from '../../components/patient/AvailabilityCalendar';
import BookingModal         from '../../components/patient/BookingModal';
import usePatientAuth       from '../../hooks/usePatientAuth';

import '../../styles/globals.css';
import '../../styles/patient-portal.css';

const ClinicProfilePage = () => {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const { patient } = usePatientAuth();

  const {
    clinic, team,
    bookingOpen, bookingDentist, preSelectedSlot, openBookingFor, closeBooking,
    days, selectedDay, setSelectedDay, slots,
  } = useClinicProfile(slug);

  const [clinicSlot, setClinicSlot] = useState(null);

  if (!clinic) {
    return (
      <div className="clinic-profile-page">
        <PatientTopbar patient={patient} />
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-muted)' }}>
          Clinica nu a fost găsită.
        </div>
      </div>
    );
  }

  const rating = Math.round(clinic.rating ?? 0);

  const scrollToTeam = () =>
    document.getElementById('clinic-team')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="clinic-profile-page">
      <PatientTopbar patient={patient} />

      {/* ── Hero ── */}
      <div className="clinic-profile-hero" style={clinic.coverPhoto ? {
        backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.45), rgba(15,23,42,0.88)), url(${clinic.coverPhoto})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      } : {}}>
        <button className="clinic-profile-hero__back" onClick={() => navigate('/patient/explore')}>
          ← Înapoi la explorare
        </button>
        <div className="clinic-profile-hero__content">
          <div className="clinic-profile-hero__logo animate-fadeUp" style={{ animationDelay: '0ms' }}>
            {clinic.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div className="clinic-profile-hero__name animate-fadeUp" style={{ animationDelay: '60ms' }}>
              {clinic.name}
            </div>
            <div className="clinic-profile-hero__tagline animate-fadeUp" style={{ animationDelay: '120ms' }}>
              {clinic.tagline}
            </div>
            <div className="clinic-profile-hero__meta animate-fadeUp" style={{ animationDelay: '180ms' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <LuMapPin size={13} /> {clinic.city}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <LuPhone size={13} /> {clinic.phone}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#FBBF24' }}>
                {Array.from({ length: rating }).map((_, i) => (
                  <LuStar key={i} size={13} color="#FBBF24" fill="#FBBF24" />
                ))}
              </span>
              <span>{clinic.rating} ({clinic.reviewCount} recenzii)</span>
            </div>
          </div>
          <button
            className="clinic-profile-hero__book-btn animate-fadeUp"
            style={{ animationDelay: '240ms' }}
            onClick={scrollToTeam}
          >
            Programează-te →
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="clinic-profile-body">

        {/* Despre clinică */}
        <div id="clinic-about" className="profile-section animate-fadeUp">
          <div className="profile-section__title">Despre clinică</div>
          <div className="clinic-about-content">
            <p className="clinic-about__text">{clinic.about}</p>
            <div className="clinic-about__stats">
              <div className="clinic-about__stat">
                <span className="clinic-about__stat-value">{clinic.rating}</span>
                <span className="clinic-about__stat-label">Rating mediu</span>
              </div>
              <div className="clinic-about__stat">
                <span className="clinic-about__stat-value">{clinic.reviewCount}</span>
                <span className="clinic-about__stat-label">Recenzii</span>
              </div>
              <div className="clinic-about__stat">
                <span className="clinic-about__stat-value">{clinic.founded}</span>
                <span className="clinic-about__stat-label">Înființată</span>
              </div>
              <div className="clinic-about__stat">
                <span className="clinic-about__stat-value">{team.length}</span>
                <span className="clinic-about__stat-label">Medic{team.length !== 1 ? 'i' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Galerie */}
        <div className="profile-section animate-fadeUp">
          <div className="profile-section__title">Galerie foto</div>
          <div className="clinic-gallery-grid">
            {clinic.gallery.map((item) => (
              <div key={item.id} className="clinic-gallery-item">
                <div className="clinic-gallery-item__image" style={{ background: item.gradient }} />
                <div className="clinic-gallery-item__label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Specialități */}
        <div className="profile-section animate-fadeUp">
          <div className="profile-section__title">Specialități</div>
          <div className="clinic-specialties-grid">
            {clinic.specialties.map((s) => (
              <div key={s.id} className="clinic-specialty-card" style={{ background: s.color }}>
                <div className="clinic-specialty-card__name">{s.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Echipa */}
        <div id="clinic-team" className="profile-section animate-fadeUp">
          <div className="profile-section__title">Echipa noastră</div>
          <div className="clinic-team-grid">
            {team.map((doctor) => {
              const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`;
              const dRating  = Math.round(doctor.rating ?? 0);
              return (
                <div key={doctor.id} className="clinic-doctor-card">
                  <div
                    className="clinic-doctor-card__avatar"
                    onClick={() => navigate(`/patient/dentist/${doctor.slug}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {initials}
                  </div>
                  <div
                    className="clinic-doctor-card__info"
                    onClick={() => navigate(`/patient/dentist/${doctor.slug}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="clinic-doctor-card__name">
                      {doctor.title} {doctor.firstName} {doctor.lastName}
                    </div>
                    <div className="clinic-doctor-card__specialty">{doctor.specialty}</div>
                    <div className="clinic-doctor-card__rating">
                      <span style={{ display: 'inline-flex', gap: 1, color: '#FBBF24' }}>
                        {Array.from({ length: dRating }).map((_, i) => (
                          <LuStar key={i} size={11} color="#FBBF24" fill="#FBBF24" />
                        ))}
                      </span>
                      {' '}{doctor.rating}
                    </div>
                    <div className="clinic-doctor-card__price">{doctor.priceRange}</div>
                  </div>
                  <button
                    className="clinic-doctor-card__book-btn"
                    onClick={(e) => { e.stopPropagation(); openBookingFor(doctor, clinicSlot); }}
                  >
                    Programează
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Availability — select slot before booking */}
        <div className="profile-section animate-fadeUp">
          <div className="profile-section__title">Disponibilitate</div>
          <AvailabilityCalendar
            days={days}
            selectedDay={selectedDay}
            onSelectDay={(i) => { setSelectedDay(i); setClinicSlot(null); }}
            slots={slots}
            selectedSlot={clinicSlot}
            onSelectSlot={setClinicSlot}
          />
        </div>

        {/* Contact */}
        <div id="clinic-contact" className="profile-section animate-fadeUp">
          <div className="profile-section__title">Contact și program</div>
          <div className="clinic-contact-grid">
            <div className="clinic-contact-info">
              {clinic.address && (
                <div className="clinic-contact-item">
                  <LuMapPin size={14} style={{ marginRight: 6, flexShrink: 0 }} />
                  {clinic.address}{clinic.city ? `, ${clinic.city}` : ''}
                </div>
              )}
              {clinic.phone && (
                <div className="clinic-contact-item">
                  <LuPhone size={14} style={{ marginRight: 6, flexShrink: 0 }} />
                  <a href={`tel:${clinic.phone}`}>{clinic.phone}</a>
                </div>
              )}
              {clinic.email && (
                <div className="clinic-contact-item">
                  <LuMail size={14} style={{ marginRight: 6, flexShrink: 0 }} />
                  <a href={`mailto:${clinic.email}`}>{clinic.email}</a>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <MapView
                  address={clinic.address}
                  city={clinic.city}
                  label={clinic.name}
                  height={260}
                />
              </div>
            </div>
            <div className="clinic-contact-hours">
              <div className="clinic-hours-title">Program</div>
              <div className="clinic-hours-row">
                <span>Luni–Vineri</span>
                <span>{clinic.workingHours.weekdays}</span>
              </div>
              <div className="clinic-hours-row">
                <span>Sâmbătă</span>
                <span>{clinic.workingHours.saturday}</span>
              </div>
              <div className="clinic-hours-row clinic-hours-row--closed">
                <span>Duminică</span>
                <span>{clinic.workingHours.sunday}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Floating CTA */}
      <div className="profile-floating-cta">
        <button className="profile-floating-cta__btn" onClick={scrollToTeam}>
          <LuCalendarDays size={14} style={{ marginRight: 6 }} />
          Programează-te acum
        </button>
      </div>

      {bookingOpen && bookingDentist && (
        <BookingModal
          dentist={bookingDentist}
          preSelectedSlot={preSelectedSlot}
          onClose={closeBooking}
        />
      )}
    </div>
  );
};

export default ClinicProfilePage;
