// src/components/calendar/AppointmentModal.jsx

import { useState } from 'react';
import { LuX } from 'react-icons/lu';
import Button from '../ui/Button';

const toISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmată' },
  { value: 'pending',   label: 'Neconfirmată' },
  { value: 'completed', label: 'Finalizată' },
  { value: 'cancelled', label: 'Anulată' },
  { value: 'no_show',   label: 'Absent (no-show)' },
];

const AppointmentModal = ({ appt, slotInfo, services, patients = [], onSave, onDelete, onClose }) => {
  const isEdit = !!appt;


  const [form, setForm] = useState({
    id:         appt?.id         ?? null,
    patientId:  appt?.patientId  ?? null,
    patient:    appt?.patient    ?? '',
    serviceId:  appt?.serviceId  ?? '',
    service:    appt?.service    ?? '',
    startTime:  appt?.startTime  ?? slotInfo?.time ?? '09:00',
    duration:   appt?.duration   ?? 30,
    date:       appt?.date       ?? (slotInfo?.date ? toISO(slotInfo.date) : toISO(new Date())),
    color:      appt?.color      ?? '#3B82F6',
    status:     appt?.status     ?? 'confirmed',
    smsEnabled: appt?.smsEnabled ?? true,
    notes:      appt?.notes      ?? '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePatientChange = (e) => {
    const value = e.target.value;
    const match = patients.find(
      (p) => `${p.firstName} ${p.lastName}`.toLowerCase() === value.toLowerCase(),
    );
    setForm((prev) => ({
      ...prev,
      patient:   value,
      patientId: match ? match.id : null,
    }));
  };

  const handleServiceChange = (e) => {
    const svc = services.find((s) => String(s.id) === e.target.value);
    if (svc) {
      setForm((prev) => ({
        ...prev,
        serviceId: svc.id,
        service:   svc.name,
        duration:  svc.duration,
        color:     svc.color,
      }));
    }
  };

  const [saveError, setSaveError] = useState('');
  const [saving,    setSaving]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await onSave({ ...form, duration: Number(form.duration) });
    } catch (err) {
      setSaveError(err.response?.data?.message ?? 'Nu s-a putut salva programarea.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">
            {isEdit ? 'Editează programare' : 'Programare nouă'}
          </h2>
          <button className="modal__close" onClick={onClose}><LuX size={16} /></button>
        </div>

        <form className="modal__body" onSubmit={handleSubmit}>
          {/* Patient */}
          <div className="modal__field">
            <label className="modal__label">Pacient</label>
            <input
              className="modal__input"
              name="patient"
              value={form.patient}
              onChange={handlePatientChange}
              placeholder="Nume pacient..."
              list="patients-list"
              autoComplete="off"
              required
            />
            <datalist id="patients-list">
              {patients.map((p) => (
                <option key={p.id} value={`${p.firstName} ${p.lastName}`} />
              ))}
            </datalist>
          </div>

          {/* Service + Duration */}
          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label">Serviciu</label>
              <select
                className="modal__input"
                name="serviceId"
                value={form.serviceId}
                onChange={handleServiceChange}
                required
              >
                <option value="">Alege serviciu...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="modal__field">
              <label className="modal__label">Durată (min)</label>
              <input
                className="modal__input"
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                min={1}
              />
            </div>
          </div>

          {/* Date + Time */}
          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label">Data</label>
              <input
                className="modal__input"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="modal__field">
              <label className="modal__label">Ora</label>
              <input
                className="modal__input"
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Status */}
          <div className="modal__field">
            <label className="modal__label">Status</label>
            <select
              className="modal__input"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="modal__field">
            <label className="modal__label">Observații</label>
            <textarea
              className="modal__input modal__textarea"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Observații opționale..."
              rows={2}
            />
          </div>

          {/* SMS toggle */}
          <label className="checkbox-group" style={{ marginBottom: 6 }}>
            <input
              type="checkbox"
              name="smsEnabled"
              checked={form.smsEnabled}
              onChange={handleChange}
            />
            Trimite reminder SMS cu 24h înainte
          </label>

          {saveError && (
            <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
              {saveError}
            </div>
          )}

          <div className="modal__footer">
            {isEdit && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => onDelete(appt.id)}
              >
                Șterge
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Anulează
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? 'Se salvează...' : isEdit ? 'Salvează' : 'Adaugă programare'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;
