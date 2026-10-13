// src/components/dashboard/ReviewsList.jsx

import { useNavigate } from 'react-router-dom';
import { LuStar } from 'react-icons/lu';
import CardHeader from '../ui/CardHeader';

const STAR_COLORS = ['#F43F5E','#F59E0B','#F59E0B','#10B981','#10B981'];

const ReviewsList = ({ reviews }) => {
  const navigate = useNavigate();

  return (
    <div className="card">
      <CardHeader
        title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LuStar size={14} color="#F59E0B" fill="#F59E0B" /> Recenzii Recente</span>}
        actionLabel="Vezi toate →"
        onAction={() => navigate('/reviews')}
      />
      <div className="reviews-list">
        {reviews.map((r, i) => {
          const initials = r.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
          const color    = STAR_COLORS[r.stars - 1] ?? '#10B981';
          return (
            <div
              key={r.id}
              className="review-card"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Quote decoration */}
              <div className="review-card__quote" aria-hidden="true">"</div>

              <div className="review-card__text">{r.text}</div>

              <div className="review-card__footer">
                <div className="review-card__author">
                  <div className="review-card__avatar" style={{ background: `${color}22`, color }}>
                    {initials}
                  </div>
                  <div>
                    <div className="review-card__name">{r.name}</div>
                    <div className="review-card__date">{r.date}</div>
                  </div>
                </div>
                <div className="review-card__stars">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <LuStar
                      key={idx}
                      size={12}
                      color={idx < r.stars ? '#F59E0B' : '#D1D5DB'}
                      fill={idx < r.stars ? '#F59E0B' : 'none'}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewsList;
