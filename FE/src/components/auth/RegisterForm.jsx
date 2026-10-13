// src/components/auth/RegisterForm.jsx

import { useState } from 'react';
import { LuUser, LuBuilding, LuPhone, LuMail, LuLock, LuBuilding2 } from 'react-icons/lu';
import Button     from '../ui/Button';
import Input      from '../ui/Input';
import PlanPicker from '../ui/PlanPicker';

const PLAN_LABELS = { starter: 'Starter', pro: 'Pro' };
const PLAN_PRICES = { starter: '69', pro: '99' };

const RegisterForm = ({
  fields,
  errors,
  serverError,
  isLoading,
  selectedPlan,
  onPlanSelect,
  onChange,
  onSubmitStep1,
  onGoLogin,
}) => {
  const [joinClinic, setJoinClinic] = useState(false);
  return (
  <form onSubmit={onSubmitStep1} noValidate>
    <h2 className="form-title">Înregistrează cabinetul</h2>
    <p className="form-subtitle">
      {joinClinic
        ? 'Completează datele — vei trimite o cerere de alăturare clinicii.'
        : 'Alege planul, completează datele — plata se face securizat prin Stripe.'}
    </p>

    {serverError && <div className="alert alert--danger">{serverError}</div>}

    {!joinClinic && <>
      <div className="alert alert--success">Alege planul tău de start</div>
      <PlanPicker selected={selectedPlan} onSelect={onPlanSelect} />
    </>}

    <div className="input-row" style={{ marginBottom: '16px' }}>
      <Input label="Prenume" name="firstName" icon={<LuUser size={14} />}
        placeholder="Ion" value={fields.firstName} onChange={onChange} error={errors.firstName} />
      <Input label="Nume" name="lastName" icon={<LuUser size={14} />}
        placeholder="Popescu" value={fields.lastName} onChange={onChange} error={errors.lastName} />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
      {!joinClinic && (
        <Input label="Numele cabinetului" name="cabinetName" icon={<LuBuilding size={14} />}
          placeholder="Cabinet Dr. Popescu" value={fields.cabinetName} onChange={onChange}
          error={errors.cabinetName} />
      )}
      {!joinClinic && (
        <Input label="Telefon cabinet" name="phone" type="tel" icon={<LuPhone size={14} />}
          placeholder="0264 123 456" value={fields.phone} onChange={onChange} error={errors.phone} />
      )}
      <Input label="Email" name="email" type="email" icon={<LuMail size={14} />}
        placeholder="doctor@cabinet.ro" value={fields.email} onChange={onChange} error={errors.email} />
      <Input label="Parolă" name="password" type="password" icon={<LuLock size={14} />}
        placeholder="Minim 8 caractere" value={fields.password} onChange={onChange}
        error={errors.password} />
    </div>

    {/* Plan summary — ascuns dacă se alătură unei clinici */}
    {!joinClinic && (
      <div className="register-plan-summary" style={{ marginBottom: 20 }}>
        <div className="register-plan-summary__row">
          <span>Plan ales</span>
          <strong>ToothFairy {PLAN_LABELS[selectedPlan]}</strong>
        </div>
        <div className="register-plan-summary__row">
          <span>Cost lunar</span>
          <strong>{PLAN_PRICES[selectedPlan]} RON / lună</strong>
        </div>
        <div className="register-plan-summary__note" style={{ color: 'var(--color-muted)', fontSize: 11, marginTop: 8 }}>
          Vei fi redirecționat la Stripe pentru adăugarea cardului.
        </div>
      </div>
    )}

    {/* Info alăturare clinică */}
    {joinClinic && (
      <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#4338CA' }}>
        <img src="/fairy3.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain', verticalAlign: 'middle', marginRight: 8 }} />
        Abonamentul tău va fi gestionat de clinică — nu e nevoie de card.
      </div>
    )}

    {/* Clinic join toggle */}
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
        <input
          type="checkbox"
          checked={joinClinic}
          onChange={e => { setJoinClinic(e.target.checked); if (!e.target.checked) onChange({ target: { name: 'clinicEmail', value: '' } }); }}
          style={{ width: 15, height: 15, accentColor: '#6366F1' }}
        />
        <span>Fac parte dintr-o clinică și vreau să mă alătur</span>
      </label>
      {joinClinic && (
        <div style={{ marginTop: 10 }}>
          <Input label="Email clinică" name="clinicEmail" type="email" icon={<LuBuilding2 size={14} />}
            placeholder="contact@clinicamea.ro" value={fields.clinicEmail ?? ''} onChange={onChange} />
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>
            Cererea va fi trimisă administratorului clinicii spre aprobare.
          </p>
        </div>
      )}
    </div>

    <Button type="submit" variant="primary" fullWidth size="lg" disabled={isLoading}>
      {isLoading
        ? (joinClinic ? 'Se trimite cererea...' : 'Se pregătește plata...')
        : (joinClinic ? 'Trimite cerere clinicii →' : 'Continuă la plată →')}
    </Button>

    <p className="terms-text" style={{ marginTop: 16 }}>
      Prin înregistrare ești de acord cu{' '}
      <a href="/terms">Termenii și Condițiile</a>.
      <br /><br />
      Ai deja cont?{' '}
      <a href="#" onClick={(e) => { e.preventDefault(); onGoLogin(); }}>
        Intră în cont →
      </a>
    </p>
  </form>
  );
};

export default RegisterForm;
