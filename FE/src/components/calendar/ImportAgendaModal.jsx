// src/components/calendar/ImportAgendaModal.jsx

import { useRef, useState } from 'react';
import { LuUpload, LuX, LuCheck, LuCircleAlert } from 'react-icons/lu';
import { importApi } from '../../lib/api';
import Button from '../ui/Button';

const fmtTime = (t) => (t ? t.substring(0, 5) : '—');

const ImportAgendaModal = ({ onClose, onConfirmed }) => {
  const fileRef = useRef(null);
  const [step, setStep]         = useState('upload');   // upload | preview | success
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [created, setCreated]   = useState(0);

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await importApi.preview(file);
      setPreview(res.data);
      setStep('preview');
    } catch (e) {
      setError(e.response?.data?.message ?? 'Eroare la procesarea imaginii.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        data: preview.data,
        programari: preview.programari,
      };
      const res = await importApi.confirm(payload);
      setCreated(res.data.created);
      setStep('success');
      onConfirmed();
    } catch (e) {
      setError(e.response?.data?.message ?? 'Eroare la salvarea programărilor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ width: 640, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal__header">
          <span className="modal__title">Import din poză agendă</span>
          <button className="modal__close" onClick={onClose}><LuX size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* STEP: upload */}
          {step === 'upload' && (
            <>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 20 }}>
                Fotografiați agenda scrisă de mână. Formatul așteptat pe fiecare linie:
                <br />
                <code style={{ fontSize: 12, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
                  HH:MM Prenume Nume - tratament
                </code>
              </p>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: 12,
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#fafafa',
                  transition: 'border-color .15s',
                }}
              >
                <LuUpload size={32} style={{ color: 'var(--color-muted)', marginBottom: 12 }} />
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Trage imaginea aici</div>
                <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  sau <span style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>alege un fișier</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 8 }}>
                  JPEG, PNG, WEBP — max 10 MB
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {loading && (
                <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--color-muted)', fontSize: 13 }}>
                  Se procesează imaginea…
                </div>
              )}

              {error && <ErrorBanner message={error} />}
            </>
          )}

          {/* STEP: preview */}
          {step === 'preview' && preview && (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <Stat label="Detectate" value={preview.totalDetectate} />
                <Stat label="De importat" value={preview.programari.length} />
                <Stat label="Pauze ignorate" value={preview.pauzeIgnorate} />
                <Stat label="Durată medie" value={`${Math.round(preview.mediaDurata)} min`} />
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 8 }}>
                Data: {preview.data}
              </div>

              <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--color-border)' }}>
                      {['Ora', 'Pacient', 'Tratament', 'Durată', 'Status'].map((h) => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.programari.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{fmtTime(p.oraStart)}</td>
                        <td style={{ padding: '10px 12px' }}>{p.numeComplet}</td>
                        <td style={{ padding: '10px 12px' }}>{p.tratament}{p.note ? <span style={{ color: 'var(--color-muted)', fontSize: 11 }}> · {p.note}</span> : null}</td>
                        <td style={{ padding: '10px 12px' }}>{p.durataMinte} min</td>
                        <td style={{ padding: '10px 12px' }}>
                          {p.pacientExistent
                            ? <span className="appt-item__status s-confirmed">Existent</span>
                            : <span className="appt-item__status" style={{ background: '#fef3c7', color: '#92400e' }}>Nou</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && <ErrorBanner message={error} style={{ marginTop: 12 }} />}
            </>
          )}

          {/* STEP: success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <LuCheck size={28} style={{ color: '#059669' }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Import reușit!</div>
              <div style={{ color: 'var(--color-muted)', fontSize: 14 }}>
                {created} programări au fost adăugate în calendar.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal__footer">
          {step === 'upload' && (
            <Button variant="ghost" size="sm" onClick={onClose}>Anulează</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => { setStep('upload'); setError(null); }}>
                Înapoi
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirm} disabled={loading}>
                {loading ? 'Se salvează…' : `Confirmă ${preview?.programari?.length ?? ''} programări`}
              </Button>
            </>
          )}
          {step === 'success' && (
            <Button variant="primary" size="sm" onClick={onClose}>Închide</Button>
          )}
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div style={{ flex: 1, background: '#f9fafb', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--color-border)' }}>
    <div style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
    <div style={{ fontWeight: 700, fontSize: 18 }}>{value}</div>
  </div>
);

const ErrorBanner = ({ message }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 13, color: '#b91c1c' }}>
    <LuCircleAlert size={16} />
    {message}
  </div>
);

export default ImportAgendaModal;
