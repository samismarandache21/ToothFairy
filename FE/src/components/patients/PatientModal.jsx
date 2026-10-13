// src/components/patients/PatientModal.jsx

import { useState } from 'react';
import { LuX, LuStethoscope, LuClock, LuBanknote, LuCalendarCheck } from 'react-icons/lu';
import Button from '../ui/Button';

const MONTH_SHORT = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];

const PatientModal = ({ patient, history, onClose, onSave, onDelete }) => {
  const [tab,  setTab]  = useState('info');
  const [form, setForm] = useState({
    ...patient,
    firstName:   patient.firstName   ?? '',
    lastName:    patient.lastName    ?? '',
    phone:       patient.phone       ?? '',
    email:       patient.email       ?? '',
    birthDate:   patient.birthDate   ?? '',
    medicalNotes: patient.medicalNotes ?? '',
    allergies:   patient.allergies   ?? '',
    notes:       patient.notes       ?? '',
  });

  const initials = `${(patient.firstName ?? '?')[0]}${(patient.lastName ?? '?')[0]}`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const totalSpent = history
    .filter((h) => h.currentCabinet)
    .reduce((s, h) => s + (h.price ?? 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ width: 580, maxHeight: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="patient-modal-header">
          <div className="patient-modal-avatar">{initials}</div>
          <div>
            <div className="patient-modal-name">
              {patient.firstName} {patient.lastName}
            </div>
            <div className="patient-modal-meta">
              {patient.phone} · {patient.totalVisits} vizite · {totalSpent} RON total
            </div>
          </div>
          <button className="patient-modal-close" onClick={onClose}><LuX size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="patient-modal-tabs">
          {[['info','Informații'],['history','Istoric'],['notes','Notițe']].map(([id, label]) => (
            <button
              key={id}
              className={`patient-modal-tab${tab === id ? ' patient-modal-tab--active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="patient-modal-body">
          {tab === 'info' && (
            <>
              <div className="patient-info-grid">
                <div className="patient-info-item">
                  <label>Prenume</label>
                  <input
                    className="modal__input"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="patient-info-item">
                  <label>Nume</label>
                  <input
                    className="modal__input"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                  />
                </div>
                <div className="patient-info-item">
                  <label>Telefon</label>
                  <input
                    className="modal__input"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="patient-info-item">
                  <label>Email</label>
                  <input
                    className="modal__input"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="patient-info-item">
                  <label>Data nașterii</label>
                  <input
                    className="modal__input"
                    type="date"
                    name="birthDate"
                    value={form.birthDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="patient-info-item">
                  <label>Ultima vizită</label>
                  <span>{patient.lastVisit ?? '—'}</span>
                </div>
              </div>
              <div className="modal__footer">
                <Button variant="danger"  size="sm" onClick={() => onDelete(patient.id)}>Șterge pacient</Button>
                <Button variant="ghost"   size="sm" onClick={onClose}>Anulează</Button>
                <Button variant="primary" size="sm" onClick={() => onSave(form)}>Salvează</Button>
              </div>
            </>
          )}

          {tab === 'history' && (
            <div className="patient-history">
              {/* Summary bar */}
              <div className="patient-history__summary">
                <div className="patient-history__stat">
                  <LuCalendarCheck size={15} color="#2DD4BF" />
                  <span className="patient-history__stat-val">{history.length}</span>
                  <span className="patient-history__stat-label">tratamente</span>
                </div>
                <div className="patient-history__stat">
                  <LuBanknote size={15} color="#6366F1" />
                  <span className="patient-history__stat-val">{totalSpent}</span>
                  <span className="patient-history__stat-label">RON total</span>
                </div>
                {patient.lastVisit && (
                  <div className="patient-history__stat">
                    <LuClock size={15} color="#F59E0B" />
                    <span className="patient-history__stat-val">{patient.lastVisit}</span>
                    <span className="patient-history__stat-label">ultima vizită</span>
                  </div>
                )}
              </div>

              {history.length === 0 ? (
                <div className="history-empty">
                  <LuStethoscope size={32} color="var(--color-border)" />
                  <p>Niciun tratament finalizat înregistrat.</p>
                </div>
              ) : (
                <div className="patient-history__timeline">
                  {history.map((h, idx) => {
                    const d = new Date(h.date);
                    const day   = d.getDate();
                    const month = MONTH_SHORT[d.getMonth()];
                    const year  = d.getFullYear();
                    return (
                      <div
                        key={h.id}
                        className={`patient-history__item${!h.currentCabinet ? ' patient-history__item--external' : ''}`}
                      >
                        <div className="patient-history__item-line">
                          {idx < history.length - 1 && <div className="patient-history__item-connector" />}
                        </div>
                        <div className="patient-history__item-date">
                          <span className="patient-history__item-day">{day}</span>
                          <span className="patient-history__item-month">{month}</span>
                          <span className="patient-history__item-year">{year}</span>
                        </div>
                        <div className="patient-history__item-card">
                          <div className="patient-history__item-service-row">
                            <span className="patient-history__item-service">{h.service || 'Consultație'}</span>
                            {!h.currentCabinet && (
                              <span className="patient-history__external-badge">alt cabinet</span>
                            )}
                          </div>
                          <div className="patient-history__item-meta">
                            <span><LuClock size={11} style={{ marginRight: 3 }} />{h.duration} min</span>
                            {h.price && <span><LuBanknote size={11} style={{ marginRight: 3 }} />{h.price} RON</span>}
                          </div>
                          {!h.currentCabinet && (
                            <div className="patient-history__item-cabinet">
                              {h.doctorName && <span>Dr. {h.doctorName}</span>}
                              {h.cabinetName && <span> · {h.cabinetName}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'notes' && (
            <>
              <div className="modal__field">
                <label className="modal__label">Notițe interne</label>
                <textarea
                  className="modal__input modal__textarea"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Adaugă notițe despre pacient (alergii, preferințe, etc.)..."
                  rows={6}
                />
              </div>
              <div className="modal__footer">
                <Button variant="ghost"   size="sm" onClick={onClose}>Anulează</Button>
                <Button variant="primary" size="sm" onClick={() => onSave(form)}>Salvează notița</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientModal;
