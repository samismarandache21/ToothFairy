import { useEffect, useState } from 'react';
import { LuCreditCard, LuPlus, LuTrash2, LuStar, LuShieldCheck } from 'react-icons/lu';
import { clinicStripeApi } from '../../lib/api';
import { useClinicAdmin } from '../../contexts/ClinicAdminContext';
import ClinicAdminLayout from './ClinicAdminLayout';

const ClinicAdminBillingPage = () => {
  const { clinic, refreshClinic }        = useClinicAdmin();
  const [subscription, setSubscription]  = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingSub, setLoadingSub]      = useState(true);
  const [loadingPms, setLoadingPms]      = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]                = useState('');

  useEffect(() => {
    refreshClinic();

    clinicStripeApi.getSubscription()
      .then(({ data }) => setSubscription(data))
      .catch(console.error)
      .finally(() => setLoadingSub(false));

    clinicStripeApi.getPaymentMethods()
      .then(({ data }) => setPaymentMethods(data))
      .catch(console.error)
      .finally(() => setLoadingPms(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddCard = async () => {
    setActionLoading(true);
    setError('');
    try {
      const base = `${window.location.origin}/clinic-admin/billing`;
      const { data } = await clinicStripeApi.createAddCardSession(
        `${base}?card_added=1`,
        base,
      );
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Eroare la adăugarea cardului');
      setActionLoading(false);
    }
  };

  const handleSetDefault = async (pmId) => {
    setActionLoading(true);
    setError('');
    try {
      await clinicStripeApi.setDefaultPaymentMethod(pmId);
      setPaymentMethods(prev => prev.map(pm => ({ ...pm, isDefault: pm.id === pmId })));
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Eroare la setarea cardului implicit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDetach = async (pmId) => {
    setActionLoading(true);
    setError('');
    try {
      await clinicStripeApi.detachPaymentMethod(pmId);
      setPaymentMethods(prev => prev.filter(pm => pm.id !== pmId));
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Eroare la ștergerea cardului');
    } finally {
      setActionLoading(false);
    }
  };

  // Detect return from add-card Stripe session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('card_added')) return;
    window.history.replaceState({}, '', window.location.pathname);
    clinicStripeApi.getPaymentMethods()
      .then(({ data }) => setPaymentMethods(data))
      .catch(console.error);
  }, []);

  const dentistCount = clinic?.dentistCount ?? 0;
  const extra        = Math.max(0, dentistCount - 3);
  const monthlyTotal = clinic?.monthlyTotal ?? (150 + extra * 50);

  const statusColor = (s) => {
    if (s === 'active') return { bg: '#ECFDF5', text: '#059669' };
    if (s === 'trialing') return { bg: '#EFF6FF', text: '#2563EB' };
    if (s === 'no_subscription') return { bg: '#F9FAFB', text: '#6B7280' };
    return { bg: '#FEF2F2', text: '#DC2626' };
  };

  const statusLabel = (s) => {
    const map = { active: 'Activ', trialing: 'Perioadă de probă', no_subscription: 'Fără abonament', past_due: 'Restant', canceled: 'Anulat' };
    return map[s] ?? s;
  };

  const brandIcon = (brand) => {
    const icons = { visa: '💳', mastercard: '💳', amex: '💳' };
    return icons[brand] ?? '💳';
  };

  return (
    <ClinicAdminLayout>
      <div style={{ padding: '32px 36px', maxWidth: 720 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
          Facturare & Abonament
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 28px' }}>
          Gestionează abonamentul și metodele de plată ale clinicii.
        </p>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Abonament curent */}
        <Section title="Abonament curent" icon={<LuShieldCheck size={16} color="#6366F1" />}>
          {loadingSub ? (
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>Se încarcă...</div>
          ) : subscription ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                    ToothFairy Clinic
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    150 RON bază {extra > 0 ? `+ ${extra} × 50 RON medici extra` : '(până la 3 medici)'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                    background: statusColor(subscription.status).bg,
                    color: statusColor(subscription.status).text,
                  }}>
                    {statusLabel(subscription.status)}
                  </span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#4338CA' }}>
                    {monthlyTotal} RON<span style={{ fontSize: 12, fontWeight: 400, color: '#6B7280' }}>/lună</span>
                  </span>
                </div>
              </div>
              {subscription.currentPeriodEnd && (
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                  Perioadă curentă se termină pe {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('ro-RO')}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>Nu există date despre abonament.</div>
          )}
        </Section>

        {/* Metode de plată */}
        <Section title="Metode de plată" icon={<LuCreditCard size={16} color="#6366F1" />}>
          {loadingPms ? (
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>Se încarcă...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {paymentMethods.length === 0 && (
                <div style={{ color: '#9CA3AF', fontSize: 13 }}>Niciun card adăugat.</div>
              )}
              {paymentMethods.map(pm => (
                <div key={pm.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 12, border: '1.5px solid',
                  borderColor: pm.isDefault ? '#A5B4FC' : '#E5E7EB',
                  background: pm.isDefault ? '#EEF2FF' : '#FAFAFA',
                  gap: 12, flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{brandIcon(pm.brand)}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', textTransform: 'capitalize' }}>
                        {pm.brand} •••• {pm.last4}
                        {pm.isDefault && (
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, color: '#6366F1', background: '#EEF2FF', padding: '2px 6px', borderRadius: 4 }}>
                            Implicit
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                        Expiră {pm.expMonth}/{pm.expYear}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!pm.isDefault && (
                      <button
                        onClick={() => handleSetDefault(pm.id)}
                        disabled={actionLoading}
                        style={{
                          padding: '6px 12px', borderRadius: 8, border: '1px solid #D1D5DB',
                          background: '#fff', fontSize: 12, cursor: 'pointer', color: '#374151',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <LuStar size={12} /> Setează implicit
                      </button>
                    )}
                    <button
                      onClick={() => handleDetach(pm.id)}
                      disabled={actionLoading}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: '1px solid #FECACA',
                        background: '#FEF2F2', fontSize: 12, cursor: 'pointer', color: '#DC2626',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <LuTrash2 size={12} /> Șterge
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddCard}
                disabled={actionLoading}
                style={{
                  marginTop: 4, padding: '10px 16px', borderRadius: 10,
                  border: '1.5px dashed #C7D2FE', background: '#F8F9FF',
                  fontSize: 13, fontWeight: 500, color: '#6366F1',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <LuPlus size={15} />
                {actionLoading ? 'Se procesează...' : 'Adaugă card nou'}
              </button>
            </div>
          )}
        </Section>
      </div>
    </ClinicAdminLayout>
  );
};

const Section = ({ title, icon, children }) => (
  <div style={{
    background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB',
    padding: '20px 24px', marginBottom: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      {icon}
      <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{title}</span>
    </div>
    {children}
  </div>
);

export default ClinicAdminBillingPage;
