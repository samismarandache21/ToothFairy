// src/components/calendar/BreakModal.jsx

import { useState } from 'react';
import { LuX } from 'react-icons/lu';

const COLORS = ['#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#10B981', '#F97316'];

const defaultForm = () => ({
  title: '',
  startTime: '13:00',
  durationMinutes: 60,
  recurrenceType: 'DAILY',
  dayOfWeek: 1,
  dayOfMonth: 1,
  date: new Date().toISOString().slice(0, 10),
  color: '#F59E0B',
});

const DAY_NAMES = ['', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

const BreakModal = ({ editingBreak, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState(() =>
    editingBreak
      ? {
          id:              editingBreak.id,
          title:           editingBreak.title,
          startTime:       editingBreak.startTime,
          durationMinutes: editingBreak.durationMinutes,
          recurrenceType:  editingBreak.recurrenceType,
          dayOfWeek:       editingBreak.dayOfWeek  ?? 1,
          dayOfMonth:      editingBreak.dayOfMonth ?? 1,
          date:            editingBreak.date ?? new Date().toISOString().slice(0, 10),
          color:           editingBreak.color ?? '#F59E0B',
        }
      : defaultForm()
  );
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState('');

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Introdu titlul pauzei.'); return; }
    if (!form.startTime)    { setError('Selectează ora de start.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch (e) {
      setError(e?.response?.data?.message || 'Eroare la salvare.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id) return;
    setDeleting(true);
    try { await onDelete(form.id); } finally { setDeleting(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{editingBreak ? 'Editează pauza' : 'Pauză nouă'}</h2>
          <button className="modal__close" onClick={onClose}><LuX size={16} /></button>
        </div>

        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {error && (
            <div style={{
              background: '#FEF2F2', color: '#B91C1C',
              border: '1px solid #FECACA', borderRadius: 8,
              padding: '8px 12px', fontSize: 13, marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          {/* Title */}
          <div className="modal__field">
            <label className="modal__label">Titlu</label>
            <input
              className="modal__input"
              placeholder="ex: Pauza de masă"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* Time + Duration */}
          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label">Ora start</label>
              <input
                type="time"
                className="modal__input"
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
              />
            </div>
            <div className="modal__field">
              <label className="modal__label">Durată (minute)</label>
              <input
                type="number"
                min={15}
                step={15}
                className="modal__input"
                value={form.durationMinutes}
                onChange={(e) => set('durationMinutes', e.target.value)}
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="modal__field">
            <label className="modal__label">Recurență</label>
            <select
              className="modal__input"
              value={form.recurrenceType}
              onChange={(e) => set('recurrenceType', e.target.value)}
            >
              <option value="DAILY">Zilnic</option>
              <option value="WEEKLY">Săptămânal</option>
              <option value="MONTHLY">Lunar</option>
              <option value="NONE">Fără recurență (o singură dată)</option>
            </select>
          </div>

          {form.recurrenceType === 'WEEKLY' && (
            <div className="modal__field">
              <label className="modal__label">Ziua săptămânii</label>
              <select
                className="modal__input"
                value={form.dayOfWeek}
                onChange={(e) => set('dayOfWeek', Number(e.target.value))}
              >
                {[1,2,3,4,5,6,7].map((d) => (
                  <option key={d} value={d}>{DAY_NAMES[d]}</option>
                ))}
              </select>
            </div>
          )}

          {form.recurrenceType === 'NONE' && (
            <div className="modal__field">
              <label className="modal__label">Data</label>
              <input
                type="date"
                className="modal__input"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
              />
            </div>
          )}

          {form.recurrenceType === 'MONTHLY' && (
            <div className="modal__field">
              <label className="modal__label">Ziua lunii (1–31)</label>
              <input
                type="number"
                min={1}
                max={31}
                className="modal__input"
                value={form.dayOfMonth}
                onChange={(e) => set('dayOfMonth', Number(e.target.value))}
              />
            </div>
          )}

          {/* Color */}
          <div className="modal__field">
            <label className="modal__label">Culoare</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => set('color', c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: c, cursor: 'pointer',
                    outline: form.color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="modal__footer">
          {editingBreak && (
            <button
              className="btn btn--danger btn--sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Se șterge…' : 'Șterge'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn--ghost btn--sm" onClick={onClose}>Anulează</button>
          <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Se salvează…' : 'Salvează'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakModal;
