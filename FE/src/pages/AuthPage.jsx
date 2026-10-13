// src/pages/AuthPage.jsx
// Pagina de înregistrare pentru stomatologi / cabinete.
// Autentificarea se face din /login (pagina unificată).

import { useNavigate } from 'react-router-dom';
import useAuth        from '../hooks/useAuth';
import AuthLeftPanel  from '../components/auth/AuthLeftPanel';
import RegisterForm   from '../components/auth/RegisterForm';

import '../styles/globals.css';
import '../styles/auth.css';
import '../styles/components.css';

const AuthPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  return (
    <div className="auth-page">
      <AuthLeftPanel />

      <div className="auth-right">
        <div className="auth-form-card">

          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
              Cont stomatolog / cabinet
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
              Ai deja cont?{' '}
              <button
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: '#2DD4BF', fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0 }}
              >
                Intră în cont →
              </button>
            </p>
          </div>

          <RegisterForm
            fields={auth.registerFields}
            errors={auth.registerErrors}
            serverError={auth.serverError}
            isLoading={auth.isLoading}
            selectedPlan={auth.selectedPlan}
            onPlanSelect={auth.setSelectedPlan}
            onChange={auth.handleRegisterChange}
            onSubmitStep1={auth.handleRegisterContinue}
            onGoLogin={() => navigate('/login')}
          />

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
