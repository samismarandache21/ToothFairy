// src/pages/SettingsPage.jsx

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDoctor } from '../contexts/DoctorContext';
import { LuUser, LuMessageSquare, LuBell, LuCreditCard, LuCheck, LuX, LuBuilding2, LuMapPin, LuPhone, LuMail } from 'react-icons/lu';
import useSettings  from '../hooks/useSettings';
import useBilling   from '../hooks/useBilling';
import Sidebar      from '../components/layout/Sidebar';
import Topbar       from '../components/layout/Topbar';
import ProfileModal from '../components/dashboard/ProfileModal';
import Button       from '../components/ui/Button';
import PlanPicker   from '../components/ui/PlanPicker';
import defaultApi, { cabinetApi } from '../lib/api';

import '../styles/globals.css';
import '../styles/components.css';
import '../styles/dashboard.css';
import '../styles/settings.css';

const NAV_ITEMS = [
  { id: 'account', Icon: LuUser,          color: '#6366F1', label: 'Cont'       },
  { id: 'sms',     Icon: LuMessageSquare, color: '#2DD4BF', label: 'SMS'        },
  { id: 'notif',   Icon: LuBell,          color: '#F59E0B', label: 'Notificări' },
  { id: 'billing', Icon: LuCreditCard,    color: '#10B981', label: 'Abonament'  },
  { id: 'clinic',  Icon: LuBuilding2,     color: '#8B5CF6', label: 'Clinică'    },
];

// ── Componenta tab Clinică ────────────────────────────────────────────────────
const ClinicSection = ({ clinicInfo }) => {
  const { setClinicStatus } = useDoctor();
  const navigate = useNavigate();
  const [email,        setEmail]        = useState('');
  const [message,      setMessage]      = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [pendingReqs,  setPendingReqs]  = useState(null);

  useEffect(() => {
    if (clinicInfo) return;
    cabinetApi.getMyJoinRequests()
      .then(({ data }) => setPendingReqs(data.filter(r => r.status === 'PENDING')))
      .catch(() => setPendingReqs([]));
  }, [clinicInfo]);

  if (clinicInfo) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          background: 'linear-gradient(135deg,#F5F3FF,#EEF2FF)',
          border: '1px solid #DDD6FE', borderRadius: 14, padding: '20px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg,#8B5CF6,#6366F1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <LuBuilding2 size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B' }}>{clinicInfo.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Faci parte din această clinică</div>
            </div>
            <span style={{
              marginLeft: 'auto', background: '#ECFDF5', color: '#059669',
              border: '1px solid #A7F3D0', borderRadius: 20, padding: '3px 10px',
              fontSize: 11, fontWeight: 600,
            }}>
              <LuCheck size={10} style={{ marginRight: 3 }} />Activ
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#374151' }}>
            {clinicInfo.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LuMail size={13} color="#8B5CF6" /> {clinicInfo.email}
              </div>
            )}
            {clinicInfo.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LuPhone size={13} color="#8B5CF6" /> {clinicInfo.phone}
              </div>
            )}
            {(clinicInfo.city || clinicInfo.address) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LuMapPin size={13} color="#8B5CF6" />
                {[clinicInfo.address, clinicInfo.city].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
        <div style={{
          background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10,
          padding: '12px 16px', fontSize: 13, color: '#92400E',
        }}>
          Abonamentul tău este gestionat de clinică. Contactează administratorul clinicii pentru orice modificare.
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await defaultApi.post('/cabinet/join-request', { clinicEmail: email, message });
      setClinicStatus('pending');
      navigate('/pending-approval');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Eroare la trimiterea cererii');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Cereri în așteptare */}
      {pendingReqs?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pendingReqs.map(r => (
            <div key={r.id} style={{
              background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12,
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <img src="/fairy3.png" alt="clinic" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
                  Cerere în așteptare — {r.clinicName}
                </div>
                <div style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>
                  Trimisă pe {new Date(r.requestedAt).toLocaleDateString('ro-RO')} · aștepți aprobarea clinicii
                </div>
              </div>
              <span style={{
                marginLeft: 'auto', background: '#FEF3C7', color: '#D97706',
                border: '1px solid #FDE68A', borderRadius: 20, padding: '3px 10px',
                fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
              }}>
                În așteptare
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{
        background: 'linear-gradient(135deg,#F5F3FF,#EEF2FF)',
        border: '1px solid #DDD6FE', borderRadius: 12, padding: '14px 18px',
        fontSize: 13, color: '#5B21B6',
      }}>
        <strong>Cum funcționează?</strong> Introdu emailul clinicii la care vrei să te alături.
        Administratorul clinicii va primi cererea ta și te va accepta. Nu vei plăti separat —
        clinica te acoperă prin abonamentul lor.
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8,
          padding: '10px 14px', fontSize: 13, color: '#DC2626',
        }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
            Email clinică *
          </label>
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ex: contact@clinicamea.ro"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB',
              fontSize: 13, outline: 'none', background: '#FAFAFA',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
            Mesaj (opțional)
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Prezintă-te pe scurt..."
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB',
              fontSize: 13, outline: 'none', resize: 'vertical', background: '#FAFAFA',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" size="sm" disabled={loading} type="submit">
            {loading ? 'Se trimite...' : 'Trimite cererea'}
          </Button>
        </div>
      </form>
    </div>
  );
};

// ── Componente locale ────────────────────────────────────────────────────────
const ChangePlanContent = ({ currentPlan, onChangePlan, isLoading }) => {
  const [selected, setSelected] = useState(currentPlan);
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 16 }}>
        Selectează planul dorit. Modificarea se aplică imediat pe abonamentul Stripe.
      </p>
      <PlanPicker selected={selected} onSelect={setSelected} />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
        <Button variant="primary" size="sm"
          disabled={isLoading || selected === currentPlan}
          onClick={() => onChangePlan(selected)}>
          {isLoading ? 'Se procesează...' : 'Confirmă schimbarea'}
        </Button>
      </div>
    </div>
  );
};

const BRAND_ICONS = {
  visa:       '💳', mastercard: '💳', amex: '💳',
  discover:   '💳', jcb:        '💳', unionpay: '💳',
};

const STATUS_LABEL = {
  active:    { label: 'Activ',         color: '#10B981' },
  trialing:  { label: 'Perioadă test', color: '#6366F1' },
  past_due:  { label: 'Plată întârziată', color: '#F59E0B' },
  canceled:  { label: 'Anulat',        color: '#EF4444' },
  incomplete:{ label: 'Incomplet',     color: '#F59E0B' },
};

const SettingsPage = () => {
  const {
    doctor, account, sms, notifications,
    activeTab, setActiveTab, saved, creditsPct,
    updateAccount, updateSms, updateNotif, handleSave,
  } = useSettings();

  const { clinicStatus } = useDoctor();
  const billing = useBilling();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clinicInfo, setClinicInfo] = useState(undefined); // undefined=loading, null=not in clinic, object=in clinic

  // Câmpurile de locație sunt blocate când doctorul e în clinică (pending sau activ)
  const locationLocked = clinicStatus === 'pending' || clinicStatus === 'active';

  useEffect(() => {
    cabinetApi.getMyClinic()
      .then(({ data }) => setClinicInfo(data))
      .catch(() => setClinicInfo(null));
  }, []);

  // Handle return from Stripe Checkout (add card flow)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stripeCard = params.get('stripe_card');
    const sessionId  = params.get('session_id');
    if (stripeCard === 'success' && sessionId) {
      setActiveTab('billing');
      billing.finalizeAddCard(sessionId);
      navigate('/settings', { replace: true });
    } else if (stripeCard === 'cancelled') {
      setActiveTab('billing');
      navigate('/settings', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-shell">
      <Sidebar doctor={doctor} onProfileClick={() => setProfileOpen(true)}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="main-area">
        <Topbar
          title="Setări"
          subtitle="Configurează contul și preferințele cabinetului"
          doctor={doctor}
          onProfileClick={() => setProfileOpen(true)}
          onMenuOpen={() => setMenuOpen(true)}
        />

        <div className="page-content">
          <div className="settings-layout">
            {/* Left nav */}
            <div className="settings-nav">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`settings-nav-item${activeTab === item.id ? ' settings-nav-item--active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="settings-nav-icon">
                    <item.Icon size={15} color={activeTab === item.id ? item.color : 'currentColor'} />
                  </span>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Right content */}
            <div>
              {/* ── Account tab ── */}
              {activeTab === 'account' && (
                <div className="animate-fadeUp">
                  <div className="settings-section">
                    <div className="settings-section__header">
                      <div className="settings-section__title">Informații personale</div>
                      <div className="settings-section__sub">Datele afișate în aplicație și pe factură.</div>
                    </div>
                    <div className="settings-section__body">
                      {locationLocked && (
                        <div style={{
                          background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10,
                          padding: '10px 14px', fontSize: 12, color: '#4338CA', marginBottom: 16,
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <LuBuilding2 size={14} />
                          {clinicStatus === 'pending'
                            ? 'Locația și telefonul vor fi preluate automat de la clinică după aprobare.'
                            : 'Locația și telefonul sunt gestionate de clinica ta.'}
                        </div>
                      )}
                      <div className="settings-row">
                        <div className="settings-field">
                          <label className="settings-label">Prenume</label>
                          <input className="settings-input" value={account.firstName} onChange={(e) => updateAccount('firstName', e.target.value)} />
                        </div>
                        <div className="settings-field">
                          <label className="settings-label">Nume</label>
                          <input className="settings-input" value={account.lastName}  onChange={(e) => updateAccount('lastName',  e.target.value)} />
                        </div>
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">Email</label>
                        <input className="settings-input" type="email" value={account.email} onChange={(e) => updateAccount('email', e.target.value)} />
                      </div>
                      <div className="settings-row">
                        <div className="settings-field">
                          <label className="settings-label">Telefon</label>
                          <input className="settings-input" value={account.phone}
                            onChange={(e) => !locationLocked && updateAccount('phone', e.target.value)}
                            readOnly={locationLocked}
                            style={locationLocked ? { background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' } : {}}
                          />
                        </div>
                        <div className="settings-field">
                          <label className="settings-label">Oraș</label>
                          <input className="settings-input" value={account.city}
                            onChange={(e) => !locationLocked && updateAccount('city', e.target.value)}
                            readOnly={locationLocked}
                            style={locationLocked ? { background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' } : {}}
                          />
                        </div>
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">Adresă cabinet</label>
                        <input className="settings-input" value={account.address}
                          onChange={(e) => !locationLocked && updateAccount('address', e.target.value)}
                          readOnly={locationLocked}
                          style={locationLocked ? { background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' } : {}}
                        />
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">Numele cabinetului</label>
                        <input className="settings-input" value={account.cabinetName} onChange={(e) => updateAccount('cabinetName', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section__header">
                      <div className="settings-section__title">Securitate</div>
                    </div>
                    <div className="settings-section__body">
                      <div className="settings-field">
                        <label className="settings-label">Parolă curentă</label>
                        <input className="settings-input" type="password" placeholder="••••••••" />
                      </div>
                      <div className="settings-row">
                        <div className="settings-field">
                          <label className="settings-label">Parolă nouă</label>
                          <input className="settings-input" type="password" placeholder="Minim 8 caractere" />
                        </div>
                        <div className="settings-field">
                          <label className="settings-label">Confirmă parola</label>
                          <input className="settings-input" type="password" placeholder="Repetă parola" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SMS tab ── */}
              {activeTab === 'sms' && (
                <div className="animate-fadeUp">
                  <div className="settings-section">
                    <div className="settings-section__header">
                      <div className="settings-section__title">Credite SMS</div>
                      <div className="settings-section__sub">
                        {sms.creditsTotal - sms.creditsUsed} credite rămase din {sms.creditsTotal}
                      </div>
                    </div>
                    <div className="settings-section__body">
                      <div className="credits-bar-wrap">
                        <div
                          className={`credits-bar${creditsPct < 20 ? ' credits-bar--low' : ''}`}
                          style={{ width: `${creditsPct}%` }}
                        />
                      </div>
                      <div className="credits-info">
                        <span>{sms.creditsUsed} folosite</span>
                        <span>{sms.creditsTotal - sms.creditsUsed} disponibile</span>
                      </div>
                      <div style={{ marginTop: 16 }}>
                        <Button variant="primary" size="sm">+ Cumpără credite SMS</Button>
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section__header">
                      <div className="settings-section__title">Configurare SMS</div>
                    </div>
                    <div className="settings-section__body">
                      <div className="settings-field">
                        <label className="settings-label">Provider SMS</label>
                        <select className="settings-select" value={sms.provider} onChange={(e) => updateSms('provider', e.target.value)}>
                          <option value="esms">eSMS.ro</option>
                          <option value="smslink">SMSLink.ro</option>
                        </select>
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">Sender ID (max 11 caractere)</label>
                        <input
                          className="settings-input"
                          value={sms.senderId}
                          maxLength={11}
                          onChange={(e) => updateSms('senderId', e.target.value)}
                        />
                      </div>

                      <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                          <label>Reminder programare</label>
                          <span>SMS trimis cu {sms.reminderHours}h înainte de programare</span>
                        </div>
                        <button
                          className={`settings-toggle${sms.reminderEnabled ? ' settings-toggle--on' : ''}`}
                          onClick={() => updateSms('reminderEnabled', !sms.reminderEnabled)}
                        />
                      </div>

                      <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                          <label>Reminder control periodic</label>
                          <span>SMS trimis la {sms.controlMonths} luni după ultima vizită</span>
                        </div>
                        <button
                          className={`settings-toggle${sms.controlEnabled ? ' settings-toggle--on' : ''}`}
                          onClick={() => updateSms('controlEnabled', !sms.controlEnabled)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Notifications tab ── */}
              {activeTab === 'notif' && (
                <div className="animate-fadeUp">
                  <div className="settings-section">
                    <div className="settings-section__header">
                      <div className="settings-section__title">Notificări email</div>
                    </div>
                    <div className="settings-section__body">
                      {[
                        { key: 'newAppointmentEmail', label: 'Programare nouă', sub: 'Primești email la fiecare programare creată' },
                        { key: 'cancelledEmail',      label: 'Programare anulată', sub: 'Primești email când un pacient anulează' },
                        { key: 'dailySummaryEmail',   label: 'Sumar zilnic', sub: 'Email cu programările de mâine, trimis seara' },
                        { key: 'lowCreditsSms',       label: 'Credite SMS scăzute', sub: `Alertă când creditele scad sub ${notifications.lowCreditsThreshold}` },
                      ].map(({ key, label, sub }) => (
                        <div key={key} className="settings-toggle-row">
                          <div className="settings-toggle-info">
                            <label>{label}</label>
                            <span>{sub}</span>
                          </div>
                          <button
                            className={`settings-toggle${notifications[key] ? ' settings-toggle--on' : ''}`}
                            onClick={() => updateNotif(key, !notifications[key])}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Billing tab ── */}
              {activeTab === 'billing' && (
                <div className="animate-fadeUp">

                  {/* Dacă medicul face parte dintr-o clinică, billing-ul e gestionat de clinică */}
                  {clinicInfo && (
                    <div className="settings-section">
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 16, padding: '32px 24px', textAlign: 'center',
                      }}>
                        <img src="/fairy3.png" alt="Clinică" style={{ width: 90, height: 90, objectFit: 'contain' }} />
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: '#1E1B4B', marginBottom: 6 }}>
                            Abonament gestionat de clinică
                          </div>
                          <div style={{ fontSize: 13, color: '#6B7280', maxWidth: 380 }}>
                            Faci parte din <strong>{clinicInfo.name}</strong>. Abonamentul și plata sunt gestionate
                            de administratorul clinicii — nu ai costuri individuale.
                          </div>
                        </div>
                        <div style={{
                          background: 'linear-gradient(135deg,#F5F3FF,#EEF2FF)',
                          border: '1px solid #DDD6FE', borderRadius: 12,
                          padding: '12px 20px', fontSize: 13, color: '#5B21B6',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <LuBuilding2 size={15} />
                          Pentru modificări, contactează administratorul clinicii.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Abonament normal (non-clinică) */}
                  {!clinicInfo && (<><div className="settings-section">
                    <div className="settings-section__header">
                      <div className="settings-section__title">Abonament activ</div>
                    </div>
                    <div className="settings-section__body">
                      {billing.loading ? (
                        <div className="billing-loading">Se încarcă...</div>
                      ) : (
                        <>
                          <div className="billing-plan-row">
                            <div>
                              <div className="billing-plan-name">
                                ToothFairy {billing.subscription
                                  ? billing.subscription.plan.charAt(0).toUpperCase() + billing.subscription.plan.slice(1)
                                  : account.plan.charAt(0).toUpperCase() + account.plan.slice(1)}
                              </div>
                              <div className="billing-plan-price">
                                {({ starter: '69', pro: '99', clinic: '149' })[billing.subscription?.plan ?? account.plan]} RON / lună · reînnoire automată
                              </div>
                              {billing.subscription?.currentPeriodEnd && (
                                <div className="billing-plan-period">
                                  Reînnoire: {new Date(billing.subscription.currentPeriodEnd * 1000).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                              )}
                            </div>
                            {billing.subscription && (
                              <span className="billing-status-badge" style={{
                                color: STATUS_LABEL[billing.subscription.status]?.color ?? '#6B7280',
                              }}>
                                <LuCheck size={11} style={{ marginRight: 3 }} />
                                {STATUS_LABEL[billing.subscription.status]?.label ?? billing.subscription.status}
                              </span>
                            )}
                            {!billing.subscription && (
                              <span className="billing-status-badge" style={{ color: '#6B7280' }}>
                                Fără abonament Stripe
                              </span>
                            )}
                          </div>
                          <Button variant="ghost" size="sm"
                            onClick={() => { billing.setChangePlanOpen(true); billing.setActionError(''); }}>
                            Schimbă planul
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Metode de plată */}
                  <div className="settings-section">
                    <div className="settings-section__header">
                      <div className="settings-section__title">Metode de plată</div>
                      <div className="settings-section__sub">Plăți procesate securizat prin Stripe</div>
                    </div>
                    <div className="settings-section__body">
                      {billing.actionError && (
                        <div className="alert alert--danger" style={{ marginBottom: 12 }}>{billing.actionError}</div>
                      )}
                      {billing.successMsg && (
                        <div className="alert alert--success" style={{ marginBottom: 12 }}>
                          <LuCheck size={13} style={{ marginRight: 4 }} />{billing.successMsg}
                        </div>
                      )}

                      {billing.loading ? (
                        <div className="billing-loading">Se încarcă cardurile...</div>
                      ) : billing.paymentMethods.length === 0 ? (
                        <div className="billing-empty">
                          <LuCreditCard size={28} color="var(--color-border)" />
                          <p>Niciun card salvat. Adaugă un card pentru a activa abonamentul.</p>
                        </div>
                      ) : (
                        <div className="billing-cards-list">
                          {billing.paymentMethods.map((pm) => (
                            <div key={pm.id} className={`billing-card-item${pm.isDefault ? ' billing-card-item--default' : ''}`}>
                              <div className="billing-card-icon">
                                {BRAND_ICONS[pm.brand] ?? '💳'}
                              </div>
                              <div className="billing-card-info">
                                <div className="billing-card-number">
                                  <span className="billing-card-brand">{pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)}</span>
                                  {' '}•••• {pm.last4}
                                </div>
                                <div className="billing-card-expiry">Expiră {pm.expMonth}/{pm.expYear}</div>
                              </div>
                              <div className="billing-card-actions">
                                {pm.isDefault ? (
                                  <span className="billing-card-default-badge">
                                    <LuCheck size={11} style={{ marginRight: 3 }} />Principală
                                  </span>
                                ) : (
                                  <button
                                    className="billing-card-action-btn"
                                    onClick={() => billing.handleSetDefault(pm.id)}
                                    disabled={billing.actionLoading}
                                  >
                                    Setează ca principală
                                  </button>
                                )}
                                {!pm.isDefault && (
                                  <button
                                    className="billing-card-action-btn billing-card-action-btn--danger"
                                    onClick={() => billing.handleDetach(pm.id)}
                                    disabled={billing.actionLoading}
                                  >
                                    <LuX size={11} style={{ marginRight: 3 }} />Elimină
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ marginTop: 16 }}>
                        <Button variant="ghost" size="sm"
                          disabled={billing.actionLoading}
                          onClick={billing.handleAddCardRedirect}>
                          {billing.actionLoading ? 'Se redirecționează...' : '+ Adaugă card nou'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Modal: schimbare plan */}
                  {billing.changePlanOpen && (
                    <div className="modal-overlay" onClick={() => billing.setChangePlanOpen(false)}>
                      <div className="modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-navy)' }}>Schimbă planul</div>
                          <button onClick={() => billing.setChangePlanOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
                            <LuX size={18} />
                          </button>
                        </div>
                        <div style={{ padding: 24 }}>
                          {billing.actionError && (
                            <div className="alert alert--danger" style={{ marginBottom: 12 }}>{billing.actionError}</div>
                          )}
                          <ChangePlanContent
                            currentPlan={billing.subscription?.plan ?? account.plan}
                            onChangePlan={billing.handleChangePlan}
                            isLoading={billing.actionLoading}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  </>)}

                </div>
              )}

              {/* ── Clinic tab ── */}
              {activeTab === 'clinic' && (
                <div className="animate-fadeUp">
                  <div className="settings-section">
                    <div className="settings-section__header">
                      <div className="settings-section__title">
                        {clinicInfo ? 'Clinica mea' : 'Alătură-te unei clinici'}
                      </div>
                      {!clinicInfo && (
                        <div className="settings-section__sub">
                          Trimite o cerere de alăturare la o clinică înregistrată în ToothFairy.
                          Vei face parte din echipa lor fără costuri suplimentare.
                        </div>
                      )}
                    </div>
                    <ClinicSection clinicInfo={clinicInfo ?? null} />
                  </div>
                </div>
              )}

              {/* Save bar */}
              {activeTab !== 'billing' && activeTab !== 'clinic' && (
                <div className="settings-save-bar">
                  <div>
                    {saved
                      ? <span className="settings-save-bar__success"><LuCheck size={13} style={{ marginRight: 4 }} />Modificările au fost salvate!</span>
                      : <span className="settings-save-bar__msg">Modificările nesalvate vor fi pierdute.</span>
                    }
                  </div>
                  <Button variant="primary" size="sm" onClick={handleSave}>
                    Salvează modificările
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {profileOpen && (
        <ProfileModal doctor={doctor} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
};

export default SettingsPage;
