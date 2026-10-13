// src/components/services/ServiceModal.jsx

import { useState } from 'react';
import { LuX } from 'react-icons/lu';
import Button from '../ui/Button';

const PRESET_COLORS = [
  '#3B82F6','#F59E0B','#10B981','#F43F5E',
  '#8B5CF6','#EC4899','#14B8A6','#F97316',
  '#6366F1','#84CC16','#0EA5E9','#A78BFA',
];

const ServiceModal = ({ service, onSave, onClose }) => {
  const isEdit = !!service?.id;

  const [form, setForm] = useState({
    id:                    service?.id                    ?? null,
    name:                  service?.name                  ?? '',
    duration:              service?.duration              ?? 30,
    price:                 service?.price                 ?? 0,
    color:                 service?.color                 ?? '#3B82F6',
    isConsultation:        service?.isConsultation        ?? false,
    requiresConsultForNew: service?.requiresConsultForNew ?? false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // When marking as consultation → auto-disable requiresConsultForNew
  const handleConsultationToggle = (e) => {
    const checked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      isConsultation: checked,
      requiresConsultForNew: checked ? false : prev.requiresConsultForNew,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, duration: Number(form.duration), price: Number(form.price) });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? 'Editează serviciu' : 'Serviciu nou'}</h2>
          <button className="modal__close" onClick={onClose}><LuX size={16} /></button>
        </div>

        <form className="modal__body" onSubmit={handleSubmit}>
          <div className="modal__field">
            <label className="modal__label">Denumire serviciu</label>
            <input
              className="modal__input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="ex: Detartraj, Plombă..."
              required
            />
          </div>

          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label">Durată (min)</label>
              <input
                className="modal__input"
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                min={5}
                step={5}
                required
              />
            </div>
            <div className="modal__field">
              <label className="modal__label">Preț (RON)</label>
              <input
                className="modal__input"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min={0}
                required
              />
            </div>
          </div>

          <div className="modal__field">
            <label className="modal__label">Culoare în calendar</label>
            <div className="color-picker">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch${form.color === c ? ' color-swatch--selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                />
              ))}
            </div>
          </div>

          <div className="svc-toggles">
            <label className="svc-toggle-row">
              <input
                type="checkbox"
                name="isConsultation"
                checked={form.isConsultation}
                onChange={handleConsultationToggle}
                className="svc-toggle-checkbox"
              />
              <span className="svc-toggle-label">
                <span className="svc-toggle-title">Acesta este un serviciu de consultație</span>
                <span className="svc-toggle-desc">Va fi inclus automat pentru pacienți noi la alte servicii</span>
              </span>
            </label>

            {!form.isConsultation && (
              <label className="svc-toggle-row">
                <input
                  type="checkbox"
                  name="requiresConsultForNew"
                  checked={form.requiresConsultForNew}
                  onChange={handleChange}
                  className="svc-toggle-checkbox"
                />
                <span className="svc-toggle-label">
                  <span className="svc-toggle-title">Consultație obligatorie pentru pacienți noi</span>
                  <span className="svc-toggle-desc">La prima programare se adaugă automat o consultație</span>
                </span>
              </label>
            )}
          </div>

          <div className="modal__footer">
            <Button type="button" variant="ghost"   size="sm" onClick={onClose}>Anulează</Button>
            <Button type="submit" variant="primary" size="sm">
              {isEdit ? 'Salvează' : 'Adaugă serviciu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;