// src/components/layout/SidebarPillItem.jsx
// Pill nav item for the vertical sidebar — same GSAP circle-ripple animation as PillNav.

import { useEffect, useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { gsap } from 'gsap';

const EASE = 'power3.out';

const SidebarPillItem = ({ to, label, icon: Icon, iconColor, onClick }) => {
  const anchorRef  = useRef(null);
  const circleRef  = useRef(null);
  const labelRef   = useRef(null);
  const hoverRef   = useRef(null);
  const tlRef      = useRef(null);
  const tweenRef   = useRef(null);

  const layout = useCallback(() => {
    const pill   = anchorRef.current;
    const circle = circleRef.current;
    const lbl    = labelRef.current;
    const hover  = hoverRef.current;
    if (!pill || !circle || !lbl || !hover) return;

    const { width: w, height: h } = pill.getBoundingClientRect();
    const R     = ((w * w) / 4 + h * h) / (2 * h);
    const D     = Math.ceil(2 * R) + 2;
    const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
    const originY = D - delta;

    circle.style.width  = `${D}px`;
    circle.style.height = `${D}px`;
    circle.style.bottom = `-${delta}px`;

    gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });
    gsap.set(lbl,    { y: 0 });
    gsap.set(hover,  { y: h + 12, opacity: 0 });

    tlRef.current?.kill();
    const tl = gsap.timeline({ paused: true });
    tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease: EASE, overwrite: 'auto' }, 0);
    tl.to(lbl,    { y: -(h + 8),  duration: 2, ease: EASE, overwrite: 'auto' }, 0);
    tl.to(hover,  { y: 0, opacity: 1, duration: 2, ease: EASE, overwrite: 'auto' }, 0);
    tlRef.current = tl;
  }, []);

  useEffect(() => {
    layout();
    window.addEventListener('resize', layout);
    document.fonts?.ready?.then(layout).catch(() => {});
    return () => window.removeEventListener('resize', layout);
  }, [layout]);

  const handleEnter = () => {
    const tl = tlRef.current;
    if (!tl) return;
    tweenRef.current?.kill();
    tweenRef.current = tl.tweenTo(tl.duration(), { duration: 0.3, ease: EASE, overwrite: 'auto' });
  };

  const handleLeave = () => {
    const tl = tlRef.current;
    if (!tl) return;
    tweenRef.current?.kill();
    tweenRef.current = tl.tweenTo(0, { duration: 0.2, ease: EASE, overwrite: 'auto' });
  };

  return (
    <NavLink
      to={to}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={({ isActive }) => `spill${isActive ? ' spill--active' : ''}`}
      // React Router v6.4+ supports ref on NavLink
      ref={anchorRef}
    >
      {({ isActive }) => (
        <>
          <span className="spill__circle" ref={circleRef} aria-hidden="true" />

          <span className="spill__icon" aria-hidden="true">
            <Icon size={16} color={isActive ? iconColor : 'currentColor'} />
          </span>

          <span className="spill__label-stack">
            <span className="spill__label" ref={labelRef}>{label}</span>
            <span className="spill__label-hover" ref={hoverRef} aria-hidden="true">{label}</span>
          </span>
        </>
      )}
    </NavLink>
  );
};

export default SidebarPillItem;
