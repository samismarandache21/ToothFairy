// src/components/auth/LoginForm.jsx

import { LuMail, LuLock, LuStethoscope } from 'react-icons/lu';
import Button  from '../ui/Button';
import Input   from '../ui/Input';

const LoginForm = ({
  fields,
  errors,
  serverError,
  isLoading,
  onChange,
  onSubmit,
  onGoRegister,
}) => {
  return (
    <form onSubmit={onSubmit} noValidate>
      <h2 className="form-title">Bine ai revenit!</h2>
      <p className="form-subtitle">
        Intră în contul tău și gestionează-ți programările cu ușurință.
      </p>

      {serverError && (
        <div className="alert alert--danger">{serverError}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '8px' }}>
        <Input
          label="Email"
          name="email"
          type="email"
          icon={<LuMail size={14} />}
          placeholder="doctor@cabinet.ro"
          value={fields.email}
          onChange={onChange}
          error={errors.email}
        />

        <Input
          label="Parolă"
          name="password"
          type="password"
          icon={<LuLock size={14} />}
          placeholder="••••••••"
          value={fields.password}
          onChange={onChange}
          error={errors.password}
        />
      </div>

      <div style={{ textAlign: 'right', marginBottom: '16px' }}>
        <a
          href="/reset-password"
          style={{ fontSize: '12px', color: 'var(--color-mint-dark)', fontWeight: 600 }}
        >
          Ai uitat parola?
        </a>
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        size="lg"
        disabled={isLoading}
      >
        <LuStethoscope size={15} style={{ marginRight: 7 }} />
        {isLoading ? 'Se încarcă...' : 'Intră în ToothFairy'}
      </Button>

      <p className="terms-text" style={{ marginTop: '20px' }}>
        Nu ai cont încă?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onGoRegister(); }}>
          Înregistrează-ți cabinetul →
        </a>
      </p>
      <p className="terms-text" style={{ marginTop: '8px' }}>
        Ești pacient?{' '}
        <a href="/patient/login">Intră ca pacient →</a>
      </p>
    </form>
  );
};

export default LoginForm;
