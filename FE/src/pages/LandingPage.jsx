// src/pages/LandingPage.jsx

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GradientText from '../components/ui/GradientText';
import PrismaticBurst from '../components/ui/PrismaticBurst';
import CardSwap, { Card } from '../components/ui/CardSwap';
import { useRef, useState, useEffect } from 'react';
import '../styles/globals.css';
import '../styles/landing.css';

// Hero-only: motion fadeUp (already in viewport, no scroll needed)
const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 36 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

// Pure CSS scroll animation — adds 'lp-in' class once, stays forever.
// No React state, no re-renders, immune to StrictMode and scroll direction.
const useScrollReveal = () => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => el.classList.add('lp-in');

    // Already in viewport at mount
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { show(); observer.disconnect(); } },
      { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
};

const CARDS = [
  {
    img:   '/notification.png',
    tag:   'Notificări',
    title: 'Alertă instant',
    desc:  'Ești anunțat imediat când un pacient se programează sau anulează. Zero surprize, control total.',
  },
  {
    img:   '/reviews.png',
    tag:   'Recenzii',
    title: 'Recenzii autentice',
    desc:  'Recenziile reale ale pacienților tăi construiesc credibilitate. Transparența aduce noi pacienți.',
  },
  {
    img:   '/247service.png',
    tag:   'Disponibilitate',
    title: 'Deschis 24/7',
    desc:  'Pacienții se programează oricând, chiar și noaptea. Cabinetul tău nu doarme niciodată.',
  },
];

const SmileStep = ({ triggered }) => {
  const [smiling, setSmiling] = useState(false);
  const timerRef = useRef(null);
  const ref = useScrollReveal();

  useEffect(() => {
    if (triggered && !smiling) {
      timerRef.current = setTimeout(() => setSmiling(true), 4000);
    }
    return () => clearTimeout(timerRef.current);
  }, [triggered, smiling]);

  return (
    <div
      ref={ref}
      className="lp-step lp-fade-up"
      style={{ animationDelay: '0.28s' }}
      onMouseEnter={() => { clearTimeout(timerRef.current); setSmiling(true); }}
      onMouseLeave={() => setSmiling(false)}
    >
      <div className="lp-step__icon lp-step__icon--photo lp-step__icon--smile">
        <img src="/teo_nosmile.jpeg" alt="Zâmbești" className="lp-step__photo lp-step__photo--base" />
        <img
          src="/teo_smile.jpeg"
          alt="Zâmbești"
          className={`lp-step__photo lp-step__photo--smile${smiling ? ' lp-step__photo--smile-visible' : ''}`}
        />
        <div className="lp-step__num">3</div>
      </div>
      <div className="lp-step__title">Zâmbești</div>
      <div className="lp-step__desc">Primești confirmare instant și SMS de reminder cu 24h înainte.</div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  const howTitleRef  = useScrollReveal();
  const howStep0Ref  = useScrollReveal();
  const howStep1Ref  = useScrollReveal();
  const featCopyRef  = useScrollReveal();
  const featCardsRef = useScrollReveal();
  const ctaRef       = useScrollReveal();

  return (
    <div className="lp">
      {/* ── WebGL Background ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <PrismaticBurst
          animationType="rotate3d"
          intensity={1.4}
          speed={0.35}
          distort={0.45}
          colors={['#0F172A', '#2DD4BF', '#6366F1', '#10B981', '#0F172A']}
          mixBlendMode="normal"
          rayCount={0}
        />
      </div>

      {/* ── Navbar ── */}
      <nav className="lp-nav">
        <div className="lp-nav__logo">
          <img src="/fairy1.png" alt="ToothFairy" className="lp-nav__logo-fairy" />
          <GradientText
            colors={['#2DD4BF', '#6366F1', '#10B981', '#2DD4BF']}
            animationSpeed={6}
            showBorder={false}
          >
            ToothFairy
          </GradientText>
        </div>
        <div className="lp-nav__actions">
          <button className="lp-nav__link" onClick={() => navigate('/patient/explore')}>Explorează</button>
          <button className="lp-nav__link" onClick={() => navigate('/patient/login')}>Intră în cont</button>
          <button className="lp-nav__cta" onClick={() => navigate('/register')}>Ești medic? →</button>
        </div>
      </nav>

      {/* ── Hero — framer-motion ok here, already in viewport ── */}
      <section className="lp-hero">
        <div className="lp-hero__bg" />
        <div className="lp-hero__orb lp-hero__orb--1" />
        <div className="lp-hero__orb lp-hero__orb--2" />

        <div className="lp-hero__content">
          <motion.div {...fadeUp(0.1)} className="lp-hero__pill">
            Platforma #1 pentru stomatologie în România
          </motion.div>
          <motion.h1 {...fadeUp(0.22)} className="lp-hero__title">
            Sănătatea ta dentară,<br /><span>simplificată</span>
          </motion.h1>
          <motion.p {...fadeUp(0.34)} className="lp-hero__sub">
            Găsește stomatologul potrivit, programează-te online în 30 de secunde
            și primești reminder înainte de consultație.
          </motion.p>
          <motion.div {...fadeUp(0.44)} className="lp-hero__actions">
            <button className="lp-btn--primary" onClick={() => navigate('/patient/explore')}>
              Găsește un stomatolog →
            </button>
            <button className="lp-btn--ghost" onClick={() => navigate('/register')}>
              Ești medic? Înregistrează-te
            </button>
          </motion.div>
          <motion.div {...fadeUp(0.54)} className="lp-hero__stats">
            <div className="lp-stat">
              <div className="lp-stat__number">500<span>+</span></div>
              <div className="lp-stat__label">cabinete înregistrate</div>
            </div>
            <div className="lp-stat-divider" />
            <div className="lp-stat">
              <div className="lp-stat__number">12k<span>+</span></div>
              <div className="lp-stat__label">programări realizate</div>
            </div>
            <div className="lp-stat-divider" />
            <div className="lp-stat">
              <div className="lp-stat__number">4.8<span>★</span></div>
              <div className="lp-stat__label">rating mediu cabinete</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-how">
        <div ref={howTitleRef} className="lp-fade-up">
          <div className="lp-section__tag">Cum funcționează</div>
          <div className="lp-section__title">3 pași, gata în 30 de secunde</div>
        </div>

        <div className="lp-how__steps">
          <div ref={howStep0Ref} className="lp-step lp-fade-up">
            <div className="lp-step__icon lp-step__icon--photo">
              <img src="/google_search.webp" alt="Caută" className="lp-step__photo lp-step__photo--google" />
              <div className="lp-step__num">1</div>
            </div>
            <div className="lp-step__title">Caută</div>
            <div className="lp-step__desc">Introduci orașul sau specialitatea și vezi stomatologii disponibili.</div>
          </div>

          <div ref={howStep1Ref} className="lp-step lp-fade-up" style={{ animationDelay: '0.14s' }}>
            <div className="lp-step__icon lp-step__icon--photo">
              <img src="/calendar.webp" alt="Programează" className="lp-step__photo" />
              <div className="lp-step__num">2</div>
            </div>
            <div className="lp-step__title">Programează</div>
            <div className="lp-step__desc">Alegi data și ora care ți se potrivesc și confirmi în câteva click-uri.</div>
          </div>

          <SmileStep triggered={howTitleRef.current?.classList.contains('lp-in')} />
        </div>
      </section>

      {/* ── Features — CardSwap ── */}
      <section className="lp-features">
        <div className="lp-features__split">
          <div ref={featCopyRef} className="lp-features__copy lp-fade-left">
            <div className="lp-section__tag">Pentru medici</div>
            <div className="lp-section__title" style={{ textAlign: 'left', marginBottom: 20 }}>
              Tot ce ai nevoie<br />într-o singură platformă
            </div>
            <p className="lp-features__lead">
              De la prima programare până la recenzia finală — gestionezi totul dintr-un singur loc, fără hârtii și fără bătăi de cap.
            </p>
            <button className="lp-btn--primary" style={{ marginTop: 32 }} onClick={() => navigate('/register')}>
              Încearcă gratuit →
            </button>
          </div>

          <div ref={featCardsRef} className="lp-features__cards lp-fade-right">
            <div style={{ height: 420, position: 'relative' }}>
              <CardSwap
                width={380}
                height={340}
                cardDistance={48}
                verticalDistance={56}
                delay={4000}
                pauseOnHover
                skewAmount={5}
                easing="elastic"
              >
                {CARDS.map((c, i) => (
                  <Card key={i}>
                    <div className="lp-card__img-wrap">
                      <img src={c.img} alt={c.title} className="lp-card__img" />
                    </div>
                    <div className="lp-card__body">
                      <span className="lp-card__tag">{c.tag}</span>
                      <div className="lp-card__title">{c.title}</div>
                      <div className="lp-card__desc">{c.desc}</div>
                    </div>
                  </Card>
                ))}
              </CardSwap>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="lp-cta">
        <div ref={ctaRef} className="lp-fade-up">
          <div className="lp-cta__title">Gata să îți digitalizezi cabinetul?</div>
          <div className="lp-cta__sub">Înregistrare gratuită · Fără card · Activ în 5 minute</div>
          <div className="lp-cta__actions">
            <button className="lp-btn--primary" onClick={() => navigate('/register')}>
              Începe gratuit →
            </button>
            <button className="lp-btn--ghost" onClick={() => navigate('/patient/explore')}>
              Explorează cabinete
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer__copy">© 2026 ToothFairy · Toate drepturile rezervate</div>
      </footer>
    </div>
  );
};

export default LandingPage;
