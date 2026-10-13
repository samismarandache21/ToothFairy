import { useEffect, useState } from 'react';
import {
  LuClipboardList, LuCheck, LuX, LuClock, LuStar,
} from 'react-icons/lu';
import { clinicAdminApi } from '../../lib/api';
import { useClinicAdmin } from '../../contexts/ClinicAdminContext';
import ClinicAdminLayout from './ClinicAdminLayout';

const STATUS_CONFIG = {
  PENDING:  { label: 'În așteptare', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  APPROVED: { label: 'Aprobat',      color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  REJECTED: { label: 'Respins',      color: '#EF4444', bg: '#FEF2F2', border: '#FCA5A5' },
};

const ClinicAdminRequestsPage = () => {
  const { refreshClinic } = useClinicAdmin();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(null);

  const load = () => {
    clinicAdminApi.getRequests()
      .then(({ data }) => setRequests(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDecision = async (id, action) => {
    setActing(id + action);
    try {
      if (action === 'approve') await clinicAdminApi.approveRequest(id);
      else                      await clinicAdminApi.rejectRequest(id);
      setRequests(prev => prev.map(r =>
        r.id === id ? { ...r, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : r
      ));
      if (action === 'approve') refreshClinic();
    } catch (e) {
      alert(e?.response?.data?.message ?? 'Eroare');
    } finally {
      setActing(null);
    }
  };

  const pending  = requests.filter(r => r.status === 'PENDING');
  const resolved = requests.filter(r => r.status !== 'PENDING');

  return (
    <ClinicAdminLayout>
      <div style={{ padding: '32px 36px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>
            Cereri de alăturare
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            {pending.length > 0
              ? `${pending.length} cerere${pending.length > 1 ? 'i' : ''} în așteptare`
              : 'Nicio cerere nouă'}
          </p>
        </div>

        {loading ? (
          <div style={{ color: '#6B7280', fontSize: 14 }}>Se încarcă...</div>
        ) : requests.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {pending.length > 0 && (
              <Section title="În așteptare" accent="#F59E0B">
                {pending.map(r => (
                  <RequestCard key={r.id} req={r} acting={acting}
                    onApprove={() => handleDecision(r.id, 'approve')}
                    onReject={() => handleDecision(r.id, 'reject')} />
                ))}
              </Section>
            )}
            {resolved.length > 0 && (
              <Section title="Rezolvate" accent="#9CA3AF" style={{ marginTop: 24 }}>
                {resolved.map(r => (
                  <RequestCard key={r.id} req={r} acting={acting} resolved />
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </ClinicAdminLayout>
  );
};

const Section = ({ title, accent, children, style }) => (
  <div style={style}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
    }}>
      <div style={{ width: 4, height: 18, borderRadius: 2, background: accent }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{title}</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {children}
    </div>
  </div>
);

const RequestCard = ({ req, acting, onApprove, onReject, resolved }) => {
  const status    = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.PENDING;
  const initials  = `${req.dentistFirstName?.[0] ?? '?'}${req.dentistLastName?.[0] ?? ''}`.toUpperCase();
  let specs = [];
  try { specs = JSON.parse(req.dentistSpecialties ?? '[]'); } catch { /* ignore */ }

  const approving = acting === req.id + 'approve';
  const rejecting = acting === req.id + 'reject';

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        {/* Avatar */}
        {req.dentistProfilePhoto
          ? <img src={req.dentistProfilePhoto} alt={initials} style={{
              width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
            }} />
          : <div style={{
              width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#6366F1,#2DD4BF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff',
            }}>{initials}</div>
        }

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
              Dr. {req.dentistFirstName} {req.dentistLastName}
            </span>
            <StatusBadge status={status} />
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            {req.dentistEmail} {req.dentistPhone ? `· ${req.dentistPhone}` : ''}
          </div>

          {specs.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {specs.map(s => (
                <span key={s} style={{
                  fontSize: 11, background: '#EEF2FF', color: '#6366F1',
                  borderRadius: 5, padding: '2px 7px', fontWeight: 500,
                }}>{s}</span>
              ))}
            </div>
          )}

          {req.message && (
            <div style={{
              marginTop: 10, background: '#F9FAFB', borderRadius: 8, padding: '8px 12px',
              fontSize: 12, color: '#4B5563', fontStyle: 'italic',
            }}>
              "{req.message}"
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
            <LuClock size={12} color="#9CA3AF" />
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>
              {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('ro-RO', {
                day: '2-digit', month: 'long', year: 'numeric',
              }) : '—'}
            </span>
            {req.dentistRating > 0 && (
              <>
                <span style={{ color: '#D1D5DB', margin: '0 4px' }}>·</span>
                <LuStar size={11} color="#FBBF24" fill="#FBBF24" />
                <span style={{ fontSize: 11, color: '#6B7280' }}>
                  {Number(req.dentistRating).toFixed(1)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {!resolved && req.status === 'PENDING' && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <ActionBtn
              onClick={onApprove}
              disabled={approving || rejecting}
              loading={approving}
              color="#10B981"
              icon={<LuCheck size={14} />}
              label="Aprobă"
            />
            <ActionBtn
              onClick={onReject}
              disabled={approving || rejecting}
              loading={rejecting}
              color="#EF4444"
              icon={<LuX size={14} />}
              label="Respinge"
              outline
            />
          </div>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
    background: status.bg, color: status.color, border: `1px solid ${status.border}`,
  }}>{status.label}</span>
);

const ActionBtn = ({ onClick, disabled, loading, color, icon, label, outline }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
    border: outline ? `1px solid ${color}` : 'none',
    background: outline ? '#fff' : color,
    color: outline ? color : '#fff',
    fontSize: 12, fontWeight: 600, opacity: disabled ? 0.6 : 1,
  }}>
    {icon}
    {loading ? '...' : label}
  </button>
);

const EmptyState = () => (
  <div style={{
    textAlign: 'center', padding: '60px 20px',
    background: '#fff', borderRadius: 16, border: '1.5px dashed #E5E7EB',
  }}>
    <LuClipboardList size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
    <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
      Nicio cerere de alăturare
    </div>
    <div style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 320, margin: '0 auto' }}>
      Când un medic trimite o cerere de alăturare la clinica ta, aceasta va apărea aici.
    </div>
  </div>
);

export default ClinicAdminRequestsPage;
