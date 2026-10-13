// src/components/ui/StarRating.jsx
// Renders fractional stars: 4.8 → 4 full + 1 star 80% colored

import { LuStar } from 'react-icons/lu';

const StarRating = ({ rating, size = 14, gap = 2 }) => {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <span
            key={i}
            style={{ position: 'relative', display: 'inline-block', width: size, height: size, flexShrink: 0 }}
          >
            {/* gray base */}
            <LuStar size={size} color="#E5E7EB" fill="#E5E7EB" style={{ position: 'absolute', top: 0, left: 0 }} />
            {/* colored overlay clipped to fill% */}
            {fill > 0 && (
              <span style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden', width: `${fill * 100}%`, height: '100%' }}>
                <LuStar size={size} color="#F59E0B" fill="#F59E0B" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
};

export default StarRating;
