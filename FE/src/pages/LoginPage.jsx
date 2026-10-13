// src/pages/LoginPage.jsx
// Pagina unificată de autentificare — detectează automat tipul de cont.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuStethoscope, LuBuilding2, LuUser, LuMail, LuLock, LuArrowRight } from 'react-icons/lu';
import axios from 'axios';
import {
  setToken, saveCabinetToStorage,
  setClinicToken, saveClinicToStorage,
  setPatientToken, savePatientToStorage,
} from '../lib/api';
import AuthLeftPanel from '../components/auth/AuthLeftPanel';

import '../styles/globals.css';
import '../styles/auth.css';
import '../styles/components.css';

const API_BASE = `http://${window.location.hostname}:8080/api`;

const REGISTER_OPTIONS = [
  {
    icon: LuStethoscope,
    color: '#2DD4BF',
    bg: '#F0FDFA',
    border: '#99F6E4',
    label: 'Stomatolog / Cabinet',
    desc: 'Cont individual sau cabinet propriu',
    path: '/register',
  },
  {
    icon: LuBuilding2,
    color: '#6366F1',
    bg: '#EEF2FF',
    border: '#C7D2FE',
    label: 'Clinică',
    desc: 'Gestionezi o echipă de medici',
    path: '/clinic-admin/register',
  },
  {
    icon: LuUser,
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
    label: 'Pacient',
    desc: 'Programări și istoricul tău medical',
    path: '/patient/register',
  },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/unified-login`, form);

      if (data.type === 'dentist') {
        setToken(data.token);
        saveCabinetToStorage(data.cabinet);

        // Verificăm dacă doctorul are o cerere PENDING înainte de redirect
        let dest = '/dashboard';
        if (!data.cabinet.clinicAccountId) {
          try {
            const reqs = await axios.get(`${API_BASE}/cabinet/my-join-requests`, {
              headers: { Authorization: `Bearer ${data.token}` },
            });
            if (reqs.data.some(r => r.status === 'PENDING')) {
              dest = '/pending-approval';
            }
          } catch { /* dacă eșuează, mergem la dashboard */ }
        }
        window.location.replace(dest);
      } else if (data.type === 'clinic') {
        setClinicToken(data.token);
        saveClinicToStorage(data.clinic);
        window.location.replace('/clinic-admin');
      } else if (data.type === 'patient') {
        setPatientToken(data.token);
        savePatientToStorage(data.patient);
        window.location.replace('/patient/explore');
      }
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Email sau parolă incorectă');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthLeftPanel />

      <div className="auth-right">
        <div className="auth-form-card" style={{ width: '100%', maxWidth: 480 }}>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>
              Intră în cont
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
              Ne dăm seama singuri ce tip de cont ai.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div className="form-group">
              <label>Email</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <LuMail size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="adresa@email.ro"
                  required
                  autoComplete="email"
                  style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 42, paddingTop: 15, paddingBottom: 15, paddingRight: 14, fontSize: 15 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Parolă</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <LuLock size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 42, paddingTop: 15, paddingBottom: 15, paddingRight: 14, fontSize: 15 }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                borderRadius: 8, padding: '10px 14px', fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
              style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {loading ? 'Se verifică...' : (<>Intră în cont <LuArrowRight size={15} /></>)}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 18px' }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>Nu ai cont încă?</span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          </div>

          {/* Register options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REGISTER_OPTIONS.map(({ icon: Icon, color, bg, border, label, desc, path }) => (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  background: bg, border: `1px solid ${border}`,
                  textDecoration: 'none', transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: color + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={17} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{desc}</div>
                </div>
                <LuArrowRight size={14} color="#9CA3AF" />
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
