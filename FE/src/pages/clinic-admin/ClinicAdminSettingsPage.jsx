import { useState, useEffect } from 'react';
import { LuBuilding2, LuMapPin, LuPhone, LuMail, LuCheck, LuSave } from 'react-icons/lu';
import { clinicAdminApi } from '../../lib/api';
import { useClinicAdmin } from '../../contexts/ClinicAdminContext';
import ClinicAdminLayout from './ClinicAdminLayout';

const ClinicAdminSettingsPage = () => {
  const { clinic, refreshClinic } = useClinicAdmin();

  const [form, setForm] = useState({
    name: '', phone: '', city: '', address: '', description: '',
  });
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!clinic) return;
    setForm({
      name:        clinic.name        ?? '',
      phone:       clinic.phone       ?? '',
      city:        clinic.city        ?? '',
      address:     clinic.address     ?? '',
      description: clinic.description ?? '',
    });
  }, [clinic]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      await clinicAdminApi.updateMe(form);
      await refreshClinic();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Eroare la salvare');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB',
    fontSize: 13, outline: 'none', background: '#FAFAFA',
  };

  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 };

  return (
    <ClinicAdminLayout>
      <div style={{ padding: '32px 36px', maxWidth: 640 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
          Setări clinică
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 28px' }}>
          Actualizează informațiile clinicii — locația este preluată automat de medici la aprobare.
        </p>

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
            padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16,
          }}>{error}</div>
        )}

        {/* Informații generale */}
        <Section title="Informații generale" icon={<LuBuilding2 size={16} color="#6366F1" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Numele clinicii</label>
              <input style={inputStyle} value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Descriere</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical' }}
                rows={3}
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Scurtă descriere a clinicii..."
              />
            </div>
          </div>
        </Section>

        {/* Contact & Locație */}
        <Section title="Contact & Locație" icon={<LuMapPin size={16} color="#6366F1" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}><LuPhone size={12} style={{ marginRight: 5 }} />Telefon</label>
              <input
                style={inputStyle} type="tel"
                value={form.phone} onChange={e => update('phone', e.target.value)}
                placeholder="ex: 0721 000 000"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}><LuMapPin size={12} style={{ marginRight: 5 }} />Oraș</label>
                <input
                  style={inputStyle} value={form.city}
                  onChange={e => update('city', e.target.value)}
                  placeholder="ex: Cluj-Napoca"
                />
              </div>
              <div>
                <label style={labelStyle}><LuMail size={12} style={{ marginRight: 5 }} />Email contact</label>
                <input
                  style={{ ...inputStyle, background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' }}
                  value={clinic?.email ?? ''} readOnly
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Adresă</label>
              <input
                style={inputStyle} value={form.address}
                onChange={e => update('address', e.target.value)}
                placeholder="ex: Str. Florilor nr. 10"
              />
            </div>

            <div style={{
              background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10,
              padding: '10px 14px', fontSize: 12, color: '#4338CA',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <LuBuilding2 size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              Locația și telefonul sunt copiate automat pe profilul medicilor atunci când le accepți cererea de alăturare.
            </div>
          </div>
        </Section>

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 10,
              border: 'none', background: '#6366F1', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <LuSave size={15} />
            {loading ? 'Se salvează...' : 'Salvează modificările'}
          </button>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669', fontWeight: 500 }}>
              <LuCheck size={15} /> Salvat cu succes!
            </span>
          )}
        </div>
      </div>
    </ClinicAdminLayout>
  );
};

const Section = ({ title, icon, children }) => (
  <div style={{
    background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB',
    padding: '20px 24px', marginBottom: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
      {icon}
      <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{title}</span>
    </div>
    {children}
  </div>
);

export default ClinicAdminSettingsPage;
