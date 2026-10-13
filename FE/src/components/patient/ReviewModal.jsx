// src/components/patient/ReviewModal.jsx

import { useState } from 'react';

const ReviewModal = ({ booking, onClose, onSubmit }) => {
  const [hovered, setHovered]   = useState(0);
  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState('');

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(booking.id, { rating, text: comment });
    onClose();
  };

  return (
    <div className="review-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="review-modal">
        <div className="review-modal__header">
          <div>
            <div className="review-modal__title">Lasă o recenzie</div>
            <div className="review-modal__subtitle">{booking.dentistName} · {booking.service}</div>
          </div>
          <button className="booking-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="review-modal__body">
          <div>
            <div className="review-stars-label">Nota ta</div>
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`review-star${star <= (hovered || rating) ? ' review-star--filled' : ''}`}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="review-comment">
            <label>Comentariu (opțional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cum a fost experiența ta?"
            />
          </div>
        </div>

        <div className="review-modal__footer">
          <button className="review-cancel-btn" onClick={onClose}>Anulează</button>
          <button
            className="review-submit-btn"
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            Trimite recenzia
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
