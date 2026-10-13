import { useEffect, useState } from 'react';
import {
  LuCalendarCheck, LuUsers, LuTrendingUp, LuTriangle,
  LuStar, LuStethoscope,
} from 'react-icons/lu';
import { clinicAdminApi } from '../../lib/api';
import { useClinicAdmin } from '../../contexts/ClinicAdminContext';
import ClinicAdminLayout from './ClinicAdminLayout';

const ClinicAdminDashboardPage = () => {
  const { clinic }           = useClinicAdmin();
  const [stats,   setStats]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clinicAdminApi.getStats()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ClinicAdminLayout>
      <div style={{ padding: '32px 36px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
            Bun venit, {clinic?.name ?? 'Clinică'} 👋
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 6 }}>
            Statistici lunare pentru întreaga echipă medicală
          </p>
        </div>

        {loading ? (
          <div style={{ color: '#6B7280', fontSize: 14 }}>Se încarcă statisticile...</div>
        ) : stats ? (
          <>
            {/* KPI Cards */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16, marginBottom: 32,
            }}>
              <KpiCard
                icon={<LuCalendarCheck size={20} color="#6366F1" />}
                label="Programări luna aceasta"
                value={stats.totalAppointments}
                trend={stats.appointmentsTrend}
                accent="#6366F1"
              />
              <KpiCard
                icon={<LuUsers size={20} color="#2DD4BF" />}
                label="Pacienți noi luna aceasta"
                value={stats.totalNewPatients}
                trend={stats.patientsTrend}
                accent="#2DD4BF"
              />
              <KpiCard
                icon={<LuTriangle size={20} color="#F59E0B" />}
                label="No-show-uri luna aceasta"
                value={stats.totalNoShows}
                accent="#F59E0B"
              />
              <KpiCard
                icon={<LuStethoscope size={20} color="#10B981" />}
                label="Medici activi în clinică"
                value={stats.dentistCount}
                accent="#10B981"
              />
            </div>

            {/* Billing info */}
            <BillingCard dentistCount={stats.dentistCount} />

            {/* Per-dentist table */}
            {stats.dentistStats?.length > 0 && (
              <div style={{
                background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB',
                overflow: 'hidden', marginTop: 24,
              }}>
                <div style={{
                  padding: '18px 24px', borderBottom: '1px solid #F3F4F6',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <LuTrendingUp size={16} color="#6366F1" />
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                    Statistici per medic
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB' }}>
                        {['Medic', 'Programări', 'Pacienți noi', 'No-shows', 'Rating'].map(h => (
                          <th key={h} style={{
                            padding: '10px 20px', textAlign: 'left',
                            fontSize: 12, fontWeight: 600, color: '#6B7280',
                            borderBottom: '1px solid #F3F4F6',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.dentistStats.map((d, i) => (
                        <tr key={d.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar name={`${d.firstName ?? ''} ${d.lastName ?? ''}`} photo={d.profilePhoto} />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                                  Dr. {d.firstName} {d.lastName}
                                </div>
                                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{d.name}</div>
                              </div>
                            </div>
                          </td>
                          <Td value={d.appointments} />
                          <Td value={d.newPatients} />
                          <Td value={d.noShows} />
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <LuStar size={12} color="#FBBF24" fill="#FBBF24" />
                              <span style={{ fontSize: 13, color: '#374151' }}>
                                {Number(d.rating ?? 0).toFixed(1)}
                              </span>
                              <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                                ({d.reviewCount ?? 0})
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ color: '#6B7280', fontSize: 14 }}>Nu există date disponibile.</div>
        )}
      </div>
    </ClinicAdminLayout>
  );
};

const KpiCard = ({ icon, label, value, trend, accent }) => (
  <div style={{
    background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
    padding: '18px 20px',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      {trend && (
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 7px', borderRadius: 6,
          background: trend.startsWith('+') ? '#ECFDF5' : '#FEF2F2',
          color: trend.startsWith('+') ? '#059669' : '#DC2626',
        }}>{trend}</span>
      )}
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginTop: 12 }}>{value}</div>
    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{label}</div>
  </div>
);

const BillingCard = ({ dentistCount }) => {
  const base   = 150;
  const extra  = Math.max(0, dentistCount - 3);
  const total  = base + extra * 50;
  return (
    <div style={{
      background: 'linear-gradient(135deg, #EEF2FF, #F0FDFA)',
      borderRadius: 14, border: '1px solid #C7D2FE',
      padding: '18px 22px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#4338CA', marginBottom: 4 }}>
          Abonament clinică
        </div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          150 RON bază (3 medici) {extra > 0 ? `+ ${extra} × 50 RON medici extra` : ''}
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#4338CA' }}>
        {total} RON<span style={{ fontSize: 13, fontWeight: 400 }}>/lună</span>
      </div>
    </div>
  );
};

const Avatar = ({ name, photo }) => {
  const initials = name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return photo
    ? <img src={photo} alt={initials} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
    : <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg,#6366F1,#2DD4BF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
      }}>{initials}</div>;
};

const Td = ({ value }) => (
  <td style={{ padding: '12px 20px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{value}</td>
);

export default ClinicAdminDashboardPage;
