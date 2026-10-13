// src/components/dashboard/ProfileModal.jsx

import { useRef, useState, useEffect } from 'react';
import { LuCamera, LuLogOut, LuSave, LuX } from 'react-icons/lu';
import Button from '../ui/Button';
import { removeToken, cabinetApi } from '../../lib/api';
import { useDoctor } from '../../contexts/DoctorContext';

const compressImage = (file, maxW = 400, maxH = 400) => new Promise((resolve) => {
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

const ProfileModal = ({ doctor, onClose }) => {
  const { refreshDoctor } = useDoctor();
  const fileInputRef   = useRef(null);
  const [photoPreview, setPhotoPreview]   = useState(null);
  const [photoChanged, setPhotoChanged]   = useState(false);
  const [saving,       setSaving]         = useState(false);
  const [saved,        setSaved]          = useState(false);
  const [saveError,    setSaveError]      = useState('');
  const [loading,      setLoading]        = useState(true);

  const [form, setForm] = useState({
    firstName:   doctor?.firstName ?? '',
    lastName:    doctor?.lastName  ?? '',
    cabinetName: doctor?.name      ?? '',
    email:       '',
    phone:       '',
    address:     '',
    city:        '',
    description: '',
    specialties: '',
  });

  // Load full data + existing profile photo from API
  useEffect(() => {
    cabinetApi.getMe().then((res) => {
      const c = res.data;
      setForm({
        firstName:   c.firstName   ?? '',
        lastName:    c.lastName    ?? '',
        cabinetName: c.name        ?? '',
        email:       c.email       ?? '',
        phone:       c.phone       ?? '',
        address:     c.address     ?? '',
        city:        c.city        ?? '',
        description: c.description ?? '',
        specialties: (() => {
          try { return JSON.parse(c.specialties ?? '[]').join(', '); }
          catch { return ''; }
        })(),
      });
      if (c.profilePhoto) setPhotoPreview(c.profilePhoto);
    }).finally(() => setLoading(false));
  }, []);

  const initials = `${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`;

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleLogout = () => {
    removeToken();
    window.location.href = '/login';
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhotoPreview(compressed);
    setPhotoChanged(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      // Save profile photo separately if changed
      if (photoChanged && photoPreview) {
        await cabinetApi.updateProfilePhoto(photoPreview);
      }

      // Save the rest of the form
      await cabinetApi.updateMe({
        firstName:   form.firstName,
        lastName:    form.lastName,
        name:        form.cabinetName,
        phone:       form.phone,
        address:     form.address,
        city:        form.city,
        description: form.description,
        specialties: JSON.stringify(
          form.specialties.split(',').map((s) => s.trim()).filter(Boolean)
        ),
      });

      await refreshDoctor();
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    } catch (err) {
      setSaveError(err.response?.data?.message ?? 'Salvarea a eșuat. Încearcă din nou.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title">Profil Doctor</div>
          <button className="modal__close" onClick={onClose}><LuX size={16} /></button>
        </div>

        <div className="modal__body">
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
              Se încarcă...
            </div>
          ) : (
            <>
              <div className="modal__avatar-section">
                {photoPreview
                  ? <img src={photoPreview} alt="avatar" className="modal__avatar" style={{ objectFit: 'cover', borderRadius: '50%' }} />
                  : <div className="modal__avatar">{initials}</div>
                }
                <div>
                  <div className="modal__avatar-name">Dr. {form.firstName} {form.lastName}</div>
                  <div className="modal__avatar-sub">{form.cabinetName}{form.city ? ` · ${form.city}` : ''}</div>
                  <button className="modal__change-photo" onClick={() => fileInputRef.current?.click()}>
                    <LuCamera size={13} style={{ marginRight: 5 }} />
                    Schimbă poza de profil
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                  {photoChanged && (
                    <div style={{ fontSize: 11, color: 'var(--color-mint-dark)', marginTop: 4 }}>
                      ● Fotografie nouă selectată — va fi salvată cu formularul
                    </div>
                  )}
                </div>
              </div>

              <div className="modal__row">
                <div className="modal__field">
                  <label className="modal__label">Prenume</label>
                  <input className="modal__input" name="firstName" value={form.firstName} onChange={handleChange} />
                </div>
                <div className="modal__field">
                  <label className="modal__label">Nume</label>
                  <input className="modal__input" name="lastName" value={form.lastName} onChange={handleChange} />
                </div>
              </div>

              <div className="modal__field">
                <label className="modal__label">Numele cabinetului</label>
                <input className="modal__input" name="cabinetName" value={form.cabinetName} onChange={handleChange} />
              </div>

              <div className="modal__row">
                <div className="modal__field">
                  <label className="modal__label">Email</label>
                  <input className="modal__input" type="email" name="email" value={form.email} onChange={handleChange} />
                </div>
                <div className="modal__field">
                  <label className="modal__label">Telefon</label>
                  <input className="modal__input" name="phone" value={form.phone} onChange={handleChange} />
                </div>
              </div>

              <div className="modal__row">
                <div className="modal__field">
                  <label className="modal__label">Adresă cabinet</label>
                  <input className="modal__input" name="address" value={form.address} onChange={handleChange} />
                </div>
                <div className="modal__field">
                  <label className="modal__label">Oraș</label>
                  <input className="modal__input" name="city" value={form.city} onChange={handleChange} />
                </div>
              </div>

              <div className="modal__field">
                <label className="modal__label">Scurtă prezentare</label>
                <textarea className="modal__input modal__textarea" name="description" value={form.description} onChange={handleChange} />
              </div>

              <div className="modal__field">
                <label className="modal__label">Specializări (separate prin virgulă)</label>
                <input className="modal__input" name="specialties" value={form.specialties} onChange={handleChange} />
              </div>

              {saveError && (
                <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                  {saveError}
                </div>
              )}

              <div className="modal__footer" style={{ justifyContent: 'space-between' }}>
                <Button variant="ghost" onClick={handleLogout} style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LuLogOut size={14} /> Deconectare
                </Button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="ghost" onClick={onClose}>Anulează</Button>
                  <Button variant="primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LuSave size={14} />
                    {saved ? 'Salvat!' : saving ? 'Se salvează...' : 'Salvează'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
