// src/pages/ReviewsPage.jsx

import { useState, useEffect } from 'react';
import { LuStar } from 'react-icons/lu';
import { reviewsApi } from '../lib/api';
import { useDoctor } from '../contexts/DoctorContext';
import Sidebar      from '../components/layout/Sidebar';
import Topbar       from '../components/layout/Topbar';
import ProfileModal from '../components/dashboard/ProfileModal';

import '../styles/globals.css';
import '../styles/components.css';
import '../styles/dashboard.css';
import '../styles/reviews.css';

const STAR_COLORS = ['#F43F5E', '#F59E0B', '#F59E0B', '#10B981', '#10B981'];

const ReviewsPage = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [filterStars, setFilterStars] = useState(0);
  const [reviews,     setReviews]     = useState([]);
  const { doctor } = useDoctor();

  useEffect(() => {
    reviewsApi.getMyReviews().then((res) => setReviews(res.data)).catch(() => {});
  }, []);

  const filtered = reviews.filter((r) => filterStars === 0 || r.stars === filterStars);

  const avg  = reviews.length
    ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1)
    : '0.0';
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.stars === n).length,
  }));

  if (!doctor) return null;

  return (
    <div className="app-shell">
      <Sidebar
        doctor={doctor}
        onProfileClick={() => setProfileOpen(true)}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="main-area">
        <Topbar
          title="Recenzii"
          subtitle={`${reviews.length} recenzii · Rating mediu ${avg}`}
          doctor={doctor}
          onProfileClick={() => setProfileOpen(true)}
          onMenuOpen={() => setMenuOpen(true)}
        />

        <div className="page-content">

          {/* Summary */}
          <div className="reviews-summary">
            <div className="reviews-summary__score">
              <div className="reviews-score__num">{avg}</div>
              <div className="reviews-score__stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <LuStar
                    key={i}
                    size={16}
                    color={i < Math.round(Number(avg)) ? '#F59E0B' : '#E5E7EB'}
                    fill={i < Math.round(Number(avg)) ? '#F59E0B' : 'none'}
                  />
                ))}
              </div>
              <div className="reviews-score__label">{reviews.length} recenzii totale</div>
            </div>
            <div className="reviews-summary__dist">
              {dist.map(({ n, count }) => (
                <div key={n} className="reviews-dist__row">
                  <span className="reviews-dist__label">{n}</span>
                  <LuStar size={11} color="#F59E0B" fill="#F59E0B" style={{ flexShrink: 0 }} />
                  <div className="reviews-dist__bar-wrap">
                    <div
                      className="reviews-dist__bar"
                      style={{
                        width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%',
                        background: STAR_COLORS[n - 1],
                      }}
                    />
                  </div>
                  <span className="reviews-dist__count">{count}</span>
                </div>
              ))}
            </div>
            <div className="reviews-summary__platforms">
              <div className="platform-stat">
                <div className="platform-stat__icon">TF</div>
                <div>
                  <div className="platform-stat__name">ToothFairy</div>
                  <div className="platform-stat__count">{reviews.length} recenzii</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="reviews-filters">
            <div className="reviews-filters__group">
              <span className="reviews-filters__label">Filtrează după stele:</span>
              <button
                className={`filter-chip${filterStars === 0 ? ' filter-chip--active' : ''}`}
                onClick={() => setFilterStars(0)}
              >Toate</button>
              {[5, 4, 3, 2, 1].map((n) => (
                <button
                  key={n}
                  className={`filter-chip${filterStars === n ? ' filter-chip--active' : ''}`}
                  onClick={() => setFilterStars(filterStars === n ? 0 : n)}
                >
                  {n} <LuStar size={10} color="#F59E0B" fill="#F59E0B" style={{ marginLeft: 2 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="reviews-grid">
            {filtered.map((r, i) => {
              const initials = r.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
              const color    = STAR_COLORS[r.stars - 1] ?? '#10B981';
              return (
                <div
                  key={r.id}
                  className="review-card-full"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="review-card-full__quote">"</div>
                  <div className="review-card-full__text">{r.text}</div>
                  <div className="review-card-full__footer">
                    <div className="review-card__author">
                      <div className="review-card__avatar" style={{ background: `${color}22`, color }}>
                        {initials}
                      </div>
                      <div>
                        <div className="review-card__name">{r.name}</div>
                        <div className="review-card__date">{r.date} · {r.platform}</div>
                      </div>
                    </div>
                    <div className="review-card__stars">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <LuStar
                          key={idx}
                          size={13}
                          color={idx < r.stars ? '#F59E0B' : '#E5E7EB'}
                          fill={idx < r.stars ? '#F59E0B' : 'none'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="reviews-empty">
                {reviews.length === 0
                  ? 'Nicio recenzie încă. Recenziile trimise de pacienți prin ToothFairy vor apărea aici.'
                  : 'Nicio recenzie pentru filtrele selectate.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {profileOpen && <ProfileModal doctor={doctor} onClose={() => setProfileOpen(false)} />}
    </div>
  );
};

export default ReviewsPage;
