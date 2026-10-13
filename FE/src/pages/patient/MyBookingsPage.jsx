// src/pages/patient/MyBookingsPage.jsx

import { useNavigate } from 'react-router-dom';
import useMyBookings  from '../../hooks/useMyBookings';
import PatientTopbar  from '../../components/patient/PatientTopbar';
import BookingCard    from '../../components/patient/BookingCard';
import ReviewModal    from '../../components/patient/ReviewModal';
import usePatientAuth from '../../hooks/usePatientAuth';
import { LuStethoscope, LuClock, LuBanknote, LuSearch } from 'react-icons/lu';

import '../../styles/globals.css';
import '../../styles/patient-portal.css';

const MONTH_SHORT = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];

const MyBookingsPage = () => {
  const navigate    = useNavigate();
  const { patient } = usePatientAuth();
  const {
    upcoming, past,
    cancel, reviewTarget, openReview, closeReview, submitReview,
  } = useMyBookings();

  return (
    <div className="my-bookings-page">
      <PatientTopbar patient={patient} />

      <div className="my-bookings-body">
        <div className="my-bookings-header">
          <div>
            <h1>Programările mele</h1>
            <p>Gestionează programările viitoare și lasă recenzii pentru vizitele trecute.</p>
          </div>
          <button className="bookings-explore-btn" onClick={() => navigate('/patient/explore')}>
            <LuSearch size={16} style={{ marginRight: 8 }} />
            Caută un stomatolog
          </button>
        </div>

        {/* Upcoming */}
        <div className="my-bookings-section">
          <div className="my-bookings-section__title">
            Viitoare
            <span className="my-bookings-section__badge">{upcoming.length}</span>
          </div>
          {upcoming.length === 0 ? (
            <div className="bookings-empty">
              Nicio programare viitoare. <a href="/patient/explore" style={{ color: 'var(--color-mint-dark)', fontWeight: 700 }}>Caută un stomatolog →</a>
            </div>
          ) : (
            <div className="bookings-list">
              {upcoming.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  isPast={false}
                  onCancel={cancel}
                  onReview={openReview}
                />
              ))}
            </div>
          )}
        </div>

        {/* Past */}
        <div className="my-bookings-section">
          <div className="my-bookings-section__title">
            Trecute
            <span className="my-bookings-section__badge">{past.length}</span>
          </div>
          {past.length === 0 ? (
            <div className="bookings-empty">Nicio vizită anterioară.</div>
          ) : (
            <div className="bookings-list">
              {past.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  isPast={true}
                  onCancel={cancel}
                  onReview={openReview}
                />
              ))}
            </div>
          )}
        </div>

        {/* Treatment history — completed only */}
        {(() => {
          const completed = past.filter((b) => b.status === 'completed');
          if (completed.length === 0) return null;
          const totalSpent = completed.reduce((s, b) => s + (b.price ?? 0), 0);
          return (
            <div className="my-bookings-section">
              <div className="my-bookings-section__title">
                Istoricul tratamentelor
                <span className="my-bookings-section__badge">{completed.length}</span>
              </div>

              <div className="treatment-history">
                {/* Summary */}
                <div className="treatment-history__summary">
                  <div className="treatment-history__stat">
                    <LuStethoscope size={14} color="#2DD4BF" />
                    <span className="treatment-history__stat-val">{completed.length}</span>
                    <span className="treatment-history__stat-label">tratamente finalizate</span>
                  </div>
                  {totalSpent > 0 && (
                    <div className="treatment-history__stat">
                      <LuBanknote size={14} color="#6366F1" />
                      <span className="treatment-history__stat-val">{totalSpent}</span>
                      <span className="treatment-history__stat-label">RON total</span>
                    </div>
                  )}
                </div>

                {/* Cards */}
                <div className="treatment-history__list">
                  {completed.map((b) => {
                    const d = new Date(`${b.date}T${b.time}`);
                    const day   = d.getDate();
                    const month = MONTH_SHORT[d.getMonth()];
                    const year  = d.getFullYear();
                    return (
                      <div key={b.id} className="treatment-history__item">
                        <div className="treatment-history__item-date">
                          <span className="treatment-history__item-day">{day}</span>
                          <span className="treatment-history__item-month">{month}</span>
                          <span className="treatment-history__item-year">{year}</span>
                        </div>
                        <div className="treatment-history__item-info">
                          <div className="treatment-history__item-service">
                            {b.service || 'Consultație'}
                          </div>
                          <div className="treatment-history__item-cabinet">{b.dentistName} · {b.cabinetName}</div>
                          <div className="treatment-history__item-meta">
                            {b.duration && (
                              <span><LuClock size={11} style={{ marginRight: 3 }} />{b.duration} min</span>
                            )}
                            {b.price > 0 && (
                              <span><LuBanknote size={11} style={{ marginRight: 3 }} />{b.price} RON</span>
                            )}
                          </div>
                        </div>
                        <div className="treatment-history__item-badge">Finalizat</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={closeReview}
          onSubmit={(id, review) =>
            submitReview(id, {
              ...review,
              authorName: [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') || undefined,
            })
          }
        />
      )}
    </div>
  );
};

export default MyBookingsPage;
