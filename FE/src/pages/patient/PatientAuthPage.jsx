// src/pages/patient/PatientAuthPage.jsx
// Pagina de înregistrare pacient.
// Autentificarea se face din /login (pagina unificată).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuStethoscope } from 'react-icons/lu';
import usePatientAuth from '../../hooks/usePatientAuth';

import '../../styles/globals.css';
import '../../styles/patient-portal.css';

const PatientAuthPage = () => {
  const navigate  = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = usePatientAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = e.target;
    try {
      await register({
        firstName: form.firstName.value,
        lastName:  form.lastName.value,
        email:     form.email.value,
        phone:     form.phone.value,
        password:  form.password.value,
      });
      navigate('/patient/explore');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Înregistrarea a eșuat. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-auth-page">
      <div className="patient-auth-card">
        <div className="patient-auth-card__logo">
          <span className="patient-auth-card__logo-icon">
            <LuStethoscope size={20} color="#2DD4BF" />
          </span>
          <span className="patient-auth-card__logo-text">Tooth<span>Fairy</span></span>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          Cont pacient nou
        </h2>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 18px' }}>
          Ai deja cont?{' '}
          <a href="/login" style={{ color: '#2DD4BF', fontWeight: 600 }}>Intră în cont →</a>
        </p>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <form className="patient-auth-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label>Prenume</label>
            <input name="firstName" type="text" placeholder="Ana" required />
          </div>
          <div className="form-group">
            <label>Nume</label>
            <input name="lastName" type="text" placeholder="Georgescu" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" placeholder="ana@email.com" required />
          </div>
          <div className="form-group">
            <label>Telefon</label>
            <input name="phone" type="tel" placeholder="07xx xxx xxx" />
          </div>
          <div className="form-group">
            <label>Parolă</label>
            <input name="password" type="password" placeholder="Min. 8 caractere" required minLength={8} />
          </div>
          <button type="submit" className="patient-auth-submit" disabled={loading}>
            {loading ? 'Se procesează...' : 'Creează cont gratuit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientAuthPage;
