import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuBuilding2, LuClock, LuLogOut, LuMail, LuRefreshCw } from 'react-icons/lu';
import { useDoctor } from '../contexts/DoctorContext';
import { cabinetApi } from '../lib/api';

const PendingApprovalPage = () => {
  const { doctor, logout, setClinicStatus } = useDoctor();
  const navigate = useNavigate();
  const [pendingReqs,   setPendingReqs]   = useState([]);
  const [checking,      setChecking]      = useState(false);

  useEffect(() => {
    cabinetApi.getMyJoinRequests()
      .then(({ data }) => setPendingReqs(data.filter(r => r.status === 'PENDING')))
      .catch(() => {});
  }, []);

  const handleCheckStatus = useCallback(async () => {
    setChecking(true);
    try {
      const { data: cabinet } = await cabinetApi.getMe();
      if (cabinet.clinicAccountId) {
        setClinicStatus('active');
        navigate('/dashboard', { replace: true });
      } else {
        const { data: reqs } = await cabinetApi.getMyJoinRequests();
        const hasPending = reqs.some(r => r.status === 'PENDING');
        if (!hasPending) {
          setClinicStatus(null);
          navigate('/dashboard', { replace: true });
        } else {
          setPendingReqs(reqs.filter(r => r.status === 'PENDING'));
        }
      }
    } catch { /* ignore */ }
    finally { setChecking(false); }
  }, [navigate, setClinicStatus]);

  const pending = pendingReqs[0];

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 50%, #F0FDF4 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, border: '1px solid #E5E7EB',
        padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(99,102,241,0.08)',
      }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 20, margin: '0 auto 24px',
          background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LuClock size={36} color="#D97706" />
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
          Cerere în așteptare
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 32px', lineHeight: 1.6 }}>
          Bună ziua, <strong>Dr. {doctor?.firstName} {doctor?.lastName}</strong>!
          Cererea ta de alăturare la clinică a fost trimisă și se află în curs de aprobare.
        </p>

        {/* Clinic info card */}
        {pending && (
          <div style={{
            background: 'linear-gradient(135deg,#F5F3FF,#EEF2FF)',
            border: '1px solid #DDD6FE', borderRadius: 16,
            padding: '20px 24px', marginBottom: 28, textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg,#8B5CF6,#6366F1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LuBuilding2 size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B' }}>
                  {pending.clinicName ?? 'Clinică'}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  Cerere trimisă pe {new Date(pending.requestedAt).toLocaleDateString('ro-RO', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </div>
              </div>
            </div>
            {pending.clinicEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5B21B6' }}>
                <LuMail size={13} />
                {pending.clinicEmail}
              </div>
            )}
          </div>
        )}

        {/* Status badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#FEF3C7', border: '1px solid #FDE68A',
          borderRadius: 12, padding: '10px 20px', marginBottom: 32,
          fontSize: 13, fontWeight: 600, color: '#92400E',
        }}>
          <LuClock size={15} />
          Aștepți aprobarea administratorului clinicii
        </div>

        {/* Info note */}
        <div style={{
          background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12,
          padding: '14px 18px', marginBottom: 28, fontSize: 13, color: '#166534', textAlign: 'left',
        }}>
          <strong>Ce urmează?</strong> Administratorul clinicii va analiza cererea ta și te va accepta
          în echipă. Vei putea accesa contul imediat după aprobare.
          Dacă nu primești un răspuns în curând, contactează direct clinica.
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 10,
              border: '1.5px solid #6366F1', background: '#6366F1',
              fontSize: 13, fontWeight: 600, color: '#fff',
              cursor: checking ? 'not-allowed' : 'pointer',
              opacity: checking ? 0.7 : 1,
            }}
          >
            <LuRefreshCw size={14} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
            {checking ? 'Se verifică...' : 'Verifică statusul'}
          </button>

          <button
            onClick={logout}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 10,
              border: '1.5px solid #E5E7EB', background: '#fff',
              fontSize: 13, fontWeight: 500, color: '#6B7280',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}
          >
            <LuLogOut size={14} />
            Deconectare
          </button>
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
