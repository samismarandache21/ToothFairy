// src/pages/PresentationPage.jsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { LuBuilding, LuStethoscope, LuClock, LuCheck, LuMapPin, LuLink, LuImage, LuCoffee, LuPlus, LuTrash2, LuPencil } from 'react-icons/lu';
import { cabinetApi, breaksApi } from '../lib/api';
import usePresentation from '../hooks/usePresentation';
import { useDoctor }   from '../contexts/DoctorContext';
import Sidebar         from '../components/layout/Sidebar';
import Topbar          from '../components/layout/Topbar';
import ProfileModal    from '../components/dashboard/ProfileModal';
import Button          from '../components/ui/Button';
import MapView         from '../components/ui/MapView';

import '../styles/globals.css';
import '../styles/components.css';
import '../styles/dashboard.css';
import '../styles/presentation.css';

const compressImage = (file, maxW = 800, maxH = 500) => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => {
    let w = img.width, h = img.height;
    if (w > maxW || h > maxH) {
      const ratio = Math.min(maxW / w, maxH / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    resolve(canvas.toDataURL('image/jpeg', 0.85));
  };
  img.src = URL.createObjectURL(file);
});

const PresentationPage = () => {
  const {
    doctor, info, hours, allSpecialties, saved, saveError,
    updateInfo, toggleSpecialty, updateHour, handleSave: handleSaveInfo,
  } = usePresentation();
  const { refreshDoctor } = useDoctor();

  const handleSave = async () => {
    // Salvează cover photo dacă a fost schimbat și nu e deja salvat
    if (coverPreview && !coverSaved) {
      await saveCoverPhoto();
    }
    await handleSaveInfo();
  };

  const [profileOpen,     setProfileOpen]     = useState(false);
  const [menuOpen,        setMenuOpen]        = useState(false);

  // ── Breaks state ─────────────────────────────────────────────────────────
  const [breaks,          setBreaks]          = useState([]);
  const [breakForm,       setBreakForm]       = useState(null); // null = closed, {} = new, {id,...} = edit
  const [breakSaving,     setBreakSaving]     = useState(false);

  const loadBreaks = useCallback(() =>
    breaksApi.getAll().then((r) => setBreaks(r.data)), []);

  useEffect(() => { loadBreaks(); }, [loadBreaks]);

  const openNewBreak  = () => setBreakForm({
    title: '', startTime: '13:00', durationMinutes: 60,
    recurrenceType: 'DAILY', dayOfWeek: 1, dayOfMonth: 1,
    date: new Date().toISOString().slice(0, 10), color: '#F59E0B',
  });
  const openEditBreak = (b) => setBreakForm({ ...b, date: b.date ?? new Date().toISOString().slice(0, 10) });
  const cancelBreak   = () => setBreakForm(null);

  const saveBreak = async () => {
    if (!breakForm.title.trim()) return;
    setBreakSaving(true);
    try {
      const payload = {
        title:           breakForm.title,
        startTime:       breakForm.startTime,
        durationMinutes: Number(breakForm.durationMinutes),
        recurrenceType:  breakForm.recurrenceType,
        dayOfWeek:       breakForm.recurrenceType === 'WEEKLY'  ? Number(breakForm.dayOfWeek)  : null,
        dayOfMonth:      breakForm.recurrenceType === 'MONTHLY' ? Number(breakForm.dayOfMonth) : null,
        date:            breakForm.recurrenceType === 'NONE'    ? breakForm.date               : null,
        color:           breakForm.color || '#F59E0B',
      };
      if (breakForm.id) await breaksApi.update(breakForm.id, payload);
      else              await breaksApi.create(payload);
      await loadBreaks();
      setBreakForm(null);
    } finally { setBreakSaving(false); }
  };

  const deleteBreak = async (id) => {
    await breaksApi.delete(id);
    await loadBreaks();
    setBreakForm(null);
  };

  const setBreakField = (field, value) =>
    setBreakForm((f) => ({ ...f, [field]: value }));

  const DAY_NAMES = ['', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
  const RECURRENCE_LABELS = { DAILY: 'Zilnic', WEEKLY: 'Săptămânal', MONTHLY: 'Lunar', NONE: 'O singură dată' };

  // Cover photo
  const [coverPreview,    setCoverPreview]    = useState(null);
  const [coverSaving,     setCoverSaving]     = useState(false);
  const [coverSaved,      setCoverSaved]      = useState(false);
  const [coverError,      setCoverError]      = useState('');
  const coverInputRef = useRef(null);

  // Load existing cover photo from DB on mount
  useEffect(() => {
    cabinetApi.getMe().then((res) => {
      if (res.data.coverPhoto) setCoverPreview(res.data.coverPhoto);
    });
  }, []);

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview(await compressImage(file, 800, 500));
    setCoverSaved(false);
  };

  const saveCoverPhoto = async () => {
    if (!coverPreview) return;
    setCoverSaving(true);
    setCoverError('');
    try {
      await cabinetApi.updateCoverPhoto(coverPreview);
      setCoverSaved(true);
      await refreshDoctor();
    } catch {
      setCoverError('Salvarea pozei de copertă a eșuat. Încearcă din nou.');
    } finally {
      setCoverSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar doctor={doctor} onProfileClick={() => setProfileOpen(true)}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="main-area">
        <Topbar
          title="Prezentare cabinet"
          subtitle="Pagina publică vizibilă de pacienți la booking"
          doctor={doctor}
          onProfileClick={() => setProfileOpen(true)}
          onMenuOpen={() => setMenuOpen(true)}
        />

        <div className="page-content">
          <div className="presentation-layout">
            {/* Left: Edit form */}
            <div>

              {/* Fotografie de copertă */}
              <div className="pres-section animate-fadeUp">
                <div className="pres-section__header">
                  <div className="pres-section__icon"><LuImage size={16} color="#2DD4BF" /></div>
                  <div className="pres-section__title">Fotografie de copertă</div>
                </div>
                <div className="pres-section__body">
                  <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 12 }}>
                    Apare în cardul și profilul tău public. Recomandat: 800×500px, JPEG.
                  </p>
                  {coverPreview && (
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }}
                    />
                  )}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
                    <Button variant="ghost" size="sm" onClick={() => coverInputRef.current?.click()}>
                      {coverPreview ? 'Schimbă fotografia' : 'Alege fotografie'}
                    </Button>
                    {coverPreview && !coverSaved && (
                      <span style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>
                        ● Nesalvat — apasă „Salvează modificările"
                      </span>
                    )}
                    {coverSaved && (
                      <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>
                        ✓ Salvat
                      </span>
                    )}
                  </div>
                  {coverError && (
                    <p style={{ fontSize: 12, color: '#DC2626', marginTop: 8 }}>{coverError}</p>
                  )}
                </div>
              </div>

              {/* Info generală */}
              <div className="pres-section animate-fadeUp">
                <div className="pres-section__header">
                  <div className="pres-section__icon"><LuBuilding size={16} color="#6366F1" /></div>
                  <div className="pres-section__title">Informații generale</div>
                </div>
                <div className="pres-section__body">
                  <div className="pres-field">
                    <label className="pres-label">Numele cabinetului</label>
                    <input
                      className="pres-input"
                      value={info.name}
                      onChange={(e) => updateInfo('name', e.target.value)}
                    />
                  </div>
                  <div className="pres-field">
                    <label className="pres-label">Descriere (vizibilă pacienților)</label>
                    <textarea
                      className="pres-textarea"
                      value={info.description}
                      onChange={(e) => updateInfo('description', e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="pres-row">
                    <div className="pres-field">
                      <label className="pres-label">Adresă</label>
                      <input
                        className="pres-input"
                        value={info.address}
                        onChange={(e) => updateInfo('address', e.target.value)}
                      />
                    </div>
                    <div className="pres-field">
                      <label className="pres-label">Oraș</label>
                      <input
                        className="pres-input"
                        value={info.city}
                        placeholder="ex: Cluj-Napoca"
                        onChange={(e) => updateInfo('city', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="pres-row">
                    <div className="pres-field">
                      <label className="pres-label">Telefon public</label>
                      <input
                        className="pres-input"
                        value={info.phone}
                        onChange={(e) => updateInfo('phone', e.target.value)}
                      />
                    </div>
                    <div className="pres-field">
                      <label className="pres-label">Email public</label>
                      <input
                        className="pres-input"
                        value={info.email}
                        onChange={(e) => updateInfo('email', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="pres-row">
                    <div className="pres-field">
                      <label className="pres-label">Website</label>
                      <input
                        className="pres-input"
                        value={info.website}
                        onChange={(e) => updateInfo('website', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="pres-section">
                <div className="pres-section__header">
                  <div className="pres-section__icon"><LuStethoscope size={16} color="#2DD4BF" /></div>
                  <div className="pres-section__title">Specializări</div>
                </div>
                <div className="pres-section__body">
                  <div className="specialty-grid">
                    {allSpecialties.map((spec) => (
                      <button
                        key={spec}
                        className={`specialty-chip${info.specialties.includes(spec) ? ' specialty-chip--selected' : ''}`}
                        onClick={() => toggleSpecialty(spec)}
                      >
                        {info.specialties.includes(spec) && <LuCheck size={11} style={{ marginRight: 4 }} />}
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Working hours */}
              <div className="pres-section">
                <div className="pres-section__header">
                  <div className="pres-section__icon"><LuClock size={16} color="#F59E0B" /></div>
                  <div className="pres-section__title">Program de lucru</div>
                </div>
                <div className="pres-section__body">
                  {hours.map((h, i) => (
                    <div key={h.day} className="hours-row">
                      <div className="hours-day">{h.day}</div>
                      <button
                        className={`hours-toggle${h.open ? ' hours-toggle--on' : ''}`}
                        onClick={() => updateHour(i, 'open', !h.open)}
                      />
                      {h.open ? (
                        <div className="hours-time-row">
                          <input
                            type="time"
                            className="hours-input"
                            value={h.start}
                            onChange={(e) => updateHour(i, 'start', e.target.value)}
                          />
                          <span className="hours-sep">—</span>
                          <input
                            type="time"
                            className="hours-input"
                            value={h.end}
                            onChange={(e) => updateHour(i, 'end', e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="hours-closed">Închis</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pauze program */}
              <div className="pres-section">
                <div className="pres-section__header">
                  <div className="pres-section__icon"><LuCoffee size={16} color="#F59E0B" /></div>
                  <div className="pres-section__title">Pauze program</div>
                </div>
                <div className="pres-section__body">

                  {breaks.length > 0 && (
                    <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {breaks.map((b) => (
                        <div key={b.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: 8,
                          background: `${b.color}18`, border: `1px solid ${b.color}44`,
                        }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-navy)' }}>
                              {b.title}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--color-muted)', marginLeft: 8 }}>
                              {b.startTime} · {b.durationMinutes} min · {RECURRENCE_LABELS[b.recurrenceType] ?? b.recurrenceType}
                            </span>
                          </div>
                          <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-muted)' }}
                            onClick={() => openEditBreak(b)}
                          >
                            <LuPencil size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {breakForm ? (
                    <div style={{ background: 'var(--color-cream)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="pres-row">
                        <div className="pres-field">
                          <label className="pres-label">Titlu</label>
                          <input className="pres-input" value={breakForm.title}
                            onChange={(e) => setBreakField('title', e.target.value)}
                            placeholder="ex: Pauza de masă" />
                        </div>
                        <div className="pres-field">
                          <label className="pres-label">Culoare</label>
                          <input type="color" value={breakForm.color}
                            onChange={(e) => setBreakField('color', e.target.value)}
                            style={{ height: 38, width: '100%', borderRadius: 8, border: '1px solid var(--color-border)', cursor: 'pointer', padding: 2 }} />
                        </div>
                      </div>
                      <div className="pres-row">
                        <div className="pres-field">
                          <label className="pres-label">Ora start</label>
                          <input type="time" className="pres-input" value={breakForm.startTime}
                            onChange={(e) => setBreakField('startTime', e.target.value)} />
                        </div>
                        <div className="pres-field">
                          <label className="pres-label">Durată (min)</label>
                          <input type="number" min={15} step={15} className="pres-input"
                            value={breakForm.durationMinutes}
                            onChange={(e) => setBreakField('durationMinutes', e.target.value)} />
                        </div>
                      </div>
                      <div className="pres-field">
                        <label className="pres-label">Recurență</label>
                        <select className="pres-input" value={breakForm.recurrenceType}
                          onChange={(e) => setBreakField('recurrenceType', e.target.value)}>
                          <option value="DAILY">Zilnic</option>
                          <option value="WEEKLY">Săptămânal</option>
                          <option value="MONTHLY">Lunar</option>
                          <option value="NONE">O singură dată</option>
                        </select>
                      </div>
                      {breakForm.recurrenceType === 'WEEKLY' && (
                        <div className="pres-field">
                          <label className="pres-label">Ziua săptămânii</label>
                          <select className="pres-input" value={breakForm.dayOfWeek}
                            onChange={(e) => setBreakField('dayOfWeek', Number(e.target.value))}>
                            {[1,2,3,4,5,6,7].map((d) => (
                              <option key={d} value={d}>{DAY_NAMES[d]}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {breakForm.recurrenceType === 'MONTHLY' && (
                        <div className="pres-field">
                          <label className="pres-label">Ziua lunii (1–31)</label>
                          <input type="number" min={1} max={31} className="pres-input"
                            value={breakForm.dayOfMonth}
                            onChange={(e) => setBreakField('dayOfMonth', Number(e.target.value))} />
                        </div>
                      )}
                      {breakForm.recurrenceType === 'NONE' && (
                        <div className="pres-field">
                          <label className="pres-label">Data</label>
                          <input type="date" className="pres-input" value={breakForm.date}
                            onChange={(e) => setBreakField('date', e.target.value)} />
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {breakForm.id && (
                          <button className="btn btn--danger btn--sm" onClick={() => deleteBreak(breakForm.id)}>
                            <LuTrash2 size={13} style={{ marginRight: 4 }} />Șterge
                          </button>
                        )}
                        <button className="btn btn--ghost btn--sm" onClick={cancelBreak}>Anulează</button>
                        <button className="btn btn--primary btn--sm" onClick={saveBreak} disabled={breakSaving}>
                          {breakSaving ? 'Se salvează…' : 'Salvează'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn--ghost btn--sm" onClick={openNewBreak}
                      style={{ width: '100%', justifyContent: 'center' }}>
                      <LuPlus size={14} style={{ marginRight: 6 }} />
                      Adaugă pauză
                    </button>
                  )}
                </div>
              </div>

              {/* Save */}
              {saveError && (
                <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 8 }}>
                  {saveError}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                {saved && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LuCheck size={14} /> Salvat cu succes!
                  </span>
                )}
                <Button variant="primary" onClick={handleSave}>
                  Salvează modificările
                </Button>
              </div>
            </div>

            {/* Right: Preview card */}
            <div>
              <div className="preview-card">
                <div className="preview-card__banner" style={coverPreview ? {
                  backgroundImage: `url(${coverPreview})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                } : {}}>
                  <div style={{
                    position: 'absolute', bottom: -24, left: 16,
                    width: 52, height: 52, borderRadius: '50%',
                    border: '3px solid #fff', overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,.25)',
                    background: 'var(--color-mint-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {doctor.profilePhoto
                      ? <img src={doctor.profilePhoto} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <LuStethoscope size={22} color="#2DD4BF" />}
                  </div>
                </div>
                <div className="preview-card__body" style={{ paddingTop: 36 }}>
                  <div className="preview-card__name">{info.name}</div>
                  <div className="preview-card__address">
                    <LuMapPin size={12} style={{ marginRight: 4 }} />
                    {info.address}{info.city ? `, ${info.city}` : ''}
                  </div>
                  <div className="preview-card__desc">{info.description}</div>

                  <div className="preview-link">
                    <LuLink size={12} style={{ marginRight: 4 }} />
                    toothfairy.ro/book/{info.slug}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {info.specialties.map((s) => (
                      <span key={s} className="specialty-tag">{s}</span>
                    ))}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 8 }}>
                    PROGRAM
                  </div>
                  {hours.map((h) => (
                    <div key={h.day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-slate)' }}>{h.day}</span>
                      <span style={{ color: h.open ? 'var(--color-navy)' : 'var(--color-muted)' }}>
                        {h.open ? `${h.start} – ${h.end}` : 'Închis'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map preview */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <LuMapPin size={12} /> Locație pe hartă
                </div>
                <MapView
                  address={info.address}
                  city={info.city}
                  label={info.name}
                  height={220}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {profileOpen && (
        <ProfileModal doctor={doctor} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
};

export default PresentationPage;
