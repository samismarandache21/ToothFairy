import { useEffect, useState } from 'react';
import { LuUsers, LuStar, LuTrash2, LuUserCheck } from 'react-icons/lu';
import { clinicAdminApi } from '../../lib/api';
import { useClinicAdmin } from '../../contexts/ClinicAdminContext';
import ClinicAdminLayout from './ClinicAdminLayout';

const ClinicAdminMembersPage = () => {
  const { refreshClinic } = useClinicAdmin();
  const [dentists, setDentists] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [removing, setRemoving] = useState(null);

  const load = () => {
    setLoading(true);
    clinicAdminApi.getDentists()
      .then(({ data }) => setDentists(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Ești sigur că vrei să elimini pe Dr. ${name} din clinică?`)) return;
    setRemoving(id);
    try {
      await clinicAdminApi.removeDentist(id);
      setDentists(prev => prev.filter(d => d.id !== id));
      refreshClinic();
    } catch (e) {
      alert(e?.response?.data?.message ?? 'Eroare la eliminare');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <ClinicAdminLayout>
      <div style={{ padding: '32px 36px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>
            Medici în clinică
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            {dentists.length} {dentists.length === 1 ? 'medic activ' : 'medici activi'} ·{' '}
            {Math.max(0, dentists.length - 3) > 0
              ? `${Math.max(0, dentists.length - 3)} extra față de planul de bază`
              : 'în limita planului de bază (3 medici)'}
          </p>
        </div>

        {loading ? (
          <div style={{ color: '#6B7280', fontSize: 14 }}>Se încarcă...</div>
        ) : dentists.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {dentists.map(d => (
              <DentistCard
                key={d.id}
                dentist={d}
                removing={removing === d.id}
                onRemove={() => handleRemove(d.id, `${d.firstName} ${d.lastName}`)}
              />
            ))}
          </div>
        )}
      </div>
    </ClinicAdminLayout>
  );
};

const DentistCard = ({ dentist: d, removing, onRemove }) => {
  const initials = `${d.firstName?.[0] ?? ''}${d.lastName?.[0] ?? ''}`.toUpperCase();
  let specs = [];
  try { specs = JSON.parse(d.specialties ?? '[]'); } catch { /* ignore */ }

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB',
      padding: '20px', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {d.profilePhoto
          ? <img src={d.profilePhoto} alt={initials} style={{
              width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
            }} />
          : <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#6366F1,#2DD4BF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: '#fff',
            }}>{initials}</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
            Dr. {d.firstName} {d.lastName}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {d.email}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LuStar size={13} color="#FBBF24" fill="#FBBF24" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
            {Number(d.rating ?? 0).toFixed(1)}
          </span>
        </div>
      </div>

      {specs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {specs.slice(0, 3).map(s => (
            <span key={s} style={{
              fontSize: 11, background: '#EEF2FF', color: '#6366F1',
              borderRadius: 6, padding: '3px 8px', fontWeight: 500,
            }}>{s}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <div style={{
          flex: 1, background: '#F9FAFB', borderRadius: 8, padding: '8px 12px',
          fontSize: 11, color: '#6B7280',
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{d.plan ?? 'starter'}</div>
          <div>Plan abonament</div>
        </div>
        <div style={{
          flex: 1, background: '#F9FAFB', borderRadius: 8, padding: '8px 12px',
          fontSize: 11, color: '#6B7280',
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{d.reviewCount ?? 0}</div>
          <div>Recenzii</div>
        </div>
      </div>

      <button onClick={onRemove} disabled={removing} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '8px', borderRadius: 9, border: '1px solid #FCA5A5',
        background: removing ? '#FEF2F2' : '#fff', color: '#EF4444',
        cursor: removing ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 500,
      }}>
        <LuTrash2 size={13} />
        {removing ? 'Se elimină...' : 'Elimină din clinică'}
      </button>
    </div>
  );
};

const EmptyState = () => (
  <div style={{
    textAlign: 'center', padding: '60px 20px',
    background: '#fff', borderRadius: 16, border: '1.5px dashed #E5E7EB',
  }}>
    <LuUserCheck size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
    <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
      Niciun medic în clinică
    </div>
    <div style={{ fontSize: 13, color: '#9CA3AF' }}>
      Medicii pot trimite cereri de alăturare din portalul lor de setări.
    </div>
  </div>
);

export default ClinicAdminMembersPage;
