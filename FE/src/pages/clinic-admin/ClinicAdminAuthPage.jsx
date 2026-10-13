import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuBuilding2, LuMail, LuLock, LuPhone, LuMapPin } from 'react-icons/lu';
import { useClinicAdmin } from '../../contexts/ClinicAdminContext';
import { clinicStripeApi } from '../../lib/api';

const STORAGE_KEY = 'clinic_register_form';

const ClinicAdminAuthPage = () => {
  const navigate       = useNavigate();
  const { register }   = useClinicAdmin();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', password: '', phone: '', city: '', address: '',
  });

  // On return from Stripe checkout: finish registration
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) return;

    const saved = (() => {
      try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
    })();
    if (!saved) return;

    sessionStorage.removeItem(STORAGE_KEY);
    window.history.replaceState({}, '', window.location.pathname);

    setLoading(true);
    register({ ...saved, stripeSessionId: sessionId })
      .then(() => navigate('/clinic-admin'))
      .catch(err => setError(err?.response?.data?.message ?? 'Eroare la înregistrare'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const base = `${window.location.origin}/clinic-admin/register`;
      const { data } = await clinicStripeApi.createRegistrationSession(
        `${base}?session_id={CHECKOUT_SESSION_ID}`,
        base,
      );
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(registerForm));
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Eroare la inițierea plății');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #EEF2FF 0%, #F0FDFA 100%)',
      padding: '24px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
        width: '100%', maxWidth: 460, padding: '40px 36px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/fairy3.png" alt="Clinică" style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>
            Portal Clinică
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Administrează clinica și echipa ta de stomatologi
          </p>
        </div>

        <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
          Ai deja cont?{' '}
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#6366F1', fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0 }}>
            Intră în cont →
          </button>
        </p>

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8,
            padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field icon={<LuBuilding2 size={15}/>} type="text" placeholder="Numele clinicii *"
            value={registerForm.name}
            onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))} />
          <Field icon={<LuMail size={15}/>} type="email" placeholder="Email clinică *"
            value={registerForm.email}
            onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))} />
          <Field icon={<LuLock size={15}/>} type="password" placeholder="Parolă *"
            value={registerForm.password}
            onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))} />
          <Field icon={<LuPhone size={15}/>} type="tel" placeholder="Telefon *"
            value={registerForm.phone}
            onChange={e => setRegisterForm(p => ({ ...p, phone: e.target.value }))} />
          <Field icon={<LuMapPin size={15}/>} type="text" placeholder="Oraș *"
            value={registerForm.city}
            onChange={e => setRegisterForm(p => ({ ...p, city: e.target.value }))} />
          <Field icon={<LuMapPin size={15}/>} type="text" placeholder="Adresă *"
            value={registerForm.address}
            onChange={e => setRegisterForm(p => ({ ...p, address: e.target.value }))} />
          <div style={{
            background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10,
            padding: '10px 14px', fontSize: 12, color: '#15803D',
          }}>
            💳 <strong>150 RON/lună</strong> pentru până la 3 medici · +50 RON per medic extra
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>
            Vei fi redirecționat la Stripe pentru adăugarea cardului.
          </div>
          <SubmitBtn loading={loading} label="Continuă la plată →" />
        </form>
      </div>
    </div>
  );
};

const Field = ({ icon, ...props }) => (
  <div style={{ position: 'relative' }}>
    <span style={{
      position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
      color: '#9CA3AF', display: 'flex', alignItems: 'center',
    }}>{icon}</span>
    <input {...props} required style={{
      width: '100%', boxSizing: 'border-box',
      padding: '13px 14px 13px 40px', borderRadius: 10,
      border: '1.5px solid #E5E7EB', fontSize: 15, outline: 'none',
      transition: 'border-color 0.2s', background: '#FAFAFA',
    }}
    onFocus={e => e.target.style.borderColor = '#6366F1'}
    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
    />
  </div>
);

const SubmitBtn = ({ loading, label }) => (
  <button type="submit" disabled={loading} style={{
    padding: '12px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
    background: loading ? '#C7D2FE' : 'linear-gradient(135deg,#6366F1,#4F46E5)',
    color: '#fff', fontSize: 14, fontWeight: 600, marginTop: 4,
    transition: 'opacity 0.2s',
  }}>
    {loading ? 'Se procesează...' : label}
  </button>
);

export default ClinicAdminAuthPage;
