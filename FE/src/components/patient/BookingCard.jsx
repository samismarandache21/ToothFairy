// src/components/patient/BookingCard.jsx

import { useNavigate } from 'react-router-dom';
import { LuClock, LuMapPin, LuStar, LuCheck, LuUserX } from 'react-icons/lu';

const MONTH_SHORT = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BookingCard = ({ booking, isPast, onCancel, onReview }) => {
  const navigate  = useNavigate();
  const date      = new Date(booking.date);
  const day       = date.getDate();
  const month     = MONTH_SHORT[date.getMonth()];
  const hasReview = !!booking.hasReview;
  const isNoShow  = booking.status === 'no_show';
  const isCancelled = booking.status === 'cancelled';
  const canReview = isPast && !hasReview && !isNoShow && !isCancelled;

  return (
    <div className={`booking-card${isPast ? ' booking-card--past' : ''}`}>
      <div className="booking-card__date-box">
        <div className="booking-card__date-day">{day}</div>
        <div className="booking-card__date-month">{month}</div>
      </div>

      <div className="booking-card__info">
        <div
          className="booking-card__dentist"
          onClick={() => navigate(`/patient/dentist/${booking.dentistSlug}`)}
          style={{ cursor: 'pointer' }}
        >
          {booking.dentistName || booking.cabinetName}
        </div>
        <div className="booking-card__service">{booking.service}</div>
        <div className="booking-card__meta">
          <span className="booking-card__meta-item">
            <LuClock size={12} style={{ marginRight: 3 }} />
            {booking.time}
          </span>
          <span className="booking-card__meta-item">
            <LuClock size={12} style={{ marginRight: 3 }} />
            {booking.duration || booking.durationMinutes} min
          </span>
          <span className="booking-card__meta-item">
            <LuMapPin size={12} style={{ marginRight: 3 }} />
            {booking.dentistCity || booking.cabinetCity}
          </span>
        </div>
      </div>

      <div className="booking-card__actions">
        <div className="booking-card__price">{booking.price} RON</div>
        {!isPast && !isCancelled && (
          <button className="booking-card__cancel-btn" onClick={() => onCancel(booking.id)}>
            Anulează
          </button>
        )}
        {isCancelled && (
          <div className="booking-card__reviewed-badge" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
            Anulată
          </div>
        )}
        {isNoShow && (
          <div className="booking-card__reviewed-badge" style={{ background: '#FEF3C7', color: '#B45309' }}>
            <LuUserX size={12} style={{ marginRight: 4 }} />
            Absent
          </div>
        )}
        {canReview && (
          <button className="booking-card__review-btn" onClick={() => onReview(booking)}>
            <LuStar size={12} style={{ marginRight: 4 }} />
            Lasă recenzie
          </button>
        )}
        {isPast && hasReview && (
          <div className="booking-card__reviewed-badge">
            <LuCheck size={12} style={{ marginRight: 4 }} />
            Recenzie trimisă
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
