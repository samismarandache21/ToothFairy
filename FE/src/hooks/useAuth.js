// src/hooks/useAuth.js

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, stripeApi, setToken, saveCabinetToStorage } from '../lib/api';
import { useDoctor } from '../contexts/DoctorContext';

// ── Validation helpers ──────────────────────────────────
const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePhone = (phone) =>
  /^(\+40|0)[0-9]{9}$/.test(phone.replace(/\s/g, ''));

const validatePassword = (password) =>
  password.length >= 8;

const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!email)                     errors.email    = 'Emailul este obligatoriu';
  else if (!validateEmail(email)) errors.email    = 'Email invalid';
  if (!password)                  errors.password = 'Parola este obligatorie';
  return errors;
};

const validateRegister = (fields) => {
  const joiningClinic = !!fields.clinicEmail?.trim();
  const errors = {};
  if (!fields.firstName)                       errors.firstName   = 'Prenumele este obligatoriu';
  if (!fields.lastName)                        errors.lastName    = 'Numele este obligatoriu';
  if (!joiningClinic) {
    if (!fields.cabinetName)                   errors.cabinetName = 'Numele cabinetului este obligatoriu';
    if (!fields.phone)                         errors.phone       = 'Telefonul este obligatoriu';
    else if (!validatePhone(fields.phone))     errors.phone       = 'Format invalid (ex: 0740123456)';
  }
  if (!fields.email)                           errors.email       = 'Emailul este obligatoriu';
  else if (!validateEmail(fields.email))       errors.email       = 'Email invalid';
  if (!fields.password)                        errors.password    = 'Parola este obligatorie';
  else if (!validatePassword(fields.password)) errors.password    = 'Minim 8 caractere';
  return errors;
};

// ── useAuth hook ────────────────────────────────────────
const FRONTEND_BASE = window.location.origin; // http://localhost:5173

const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setDoctor } = useDoctor();

  const [activeTab, setActiveTab]     = useState('login');
  const [isLoading, setIsLoading]     = useState(false);
  const [serverError, setServerError] = useState('');

  // Login state
  const [loginFields, setLoginFields] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});

  // Register state
  const [registerFields, setRegisterFields] = useState({
    firstName: '', lastName: '', cabinetName: '',
    phone: '', email: '', password: '', clinicEmail: '',
  });
  const [registerErrors, setRegisterErrors] = useState({});
  const [selectedPlan, setSelectedPlan]     = useState('pro');
  const [registerStep, setRegisterStep]     = useState(1); // 1 = info, 2 = redirect la Stripe

  // ── Revenire din Stripe Checkout (session_id în URL) ──────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('stripe_session');
    if (!sessionId) return;

    // Reconstruim datele formularului din sessionStorage
    const saved = sessionStorage.getItem('tf_register_fields');
    if (!saved) return;

    const { fields, plan } = JSON.parse(saved);
    sessionStorage.removeItem('tf_register_fields');

    setIsLoading(true);
    setServerError('');
    authApi.register({ ...fields, plan, stripeSessionId: sessionId })
      .then(({ data }) => {
        setToken(data.token);
        saveCabinetToStorage(data.cabinet);
        setDoctor(data.cabinet);
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        const msg = err.response?.data?.message ?? 'A apărut o eroare. Te rugăm să încerci din nou.';
        setServerError(msg);
        setActiveTab('register');
        setRegisterStep(1);
        setIsLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginFields((prev) => ({ ...prev, [name]: value }));
    if (loginErrors[name]) setLoginErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterFields((prev) => ({ ...prev, [name]: value }));
    if (registerErrors[name]) setRegisterErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  // ── Submit: Login ──
  const handleLogin = async (e) => {
    e.preventDefault();
    const errors = validateLogin(loginFields);
    if (Object.keys(errors).length) { setLoginErrors(errors); return; }

    setIsLoading(true);
    setServerError('');
    try {
      const { data } = await authApi.login(loginFields);
      setToken(data.token);
      saveCabinetToStorage(data.cabinet);
      setDoctor(data.cabinet);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Email sau parolă incorectă. Încearcă din nou.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 1: validare formular → redirect la Stripe sau înregistrare directă ──
  const handleRegisterContinue = async (e) => {
    e.preventDefault();
    const errors = validateRegister(registerFields);
    if (Object.keys(errors).length) { setRegisterErrors(errors); return; }
    setServerError('');
    setIsLoading(true);

    // Dacă medicul se alătură unei clinici — înregistrare directă fără Stripe
    if (registerFields.clinicEmail?.trim()) {
      const autoName = registerFields.cabinetName?.trim()
        || `Dr. ${registerFields.firstName} ${registerFields.lastName}`;
      try {
        const { data } = await authApi.register({ ...registerFields, cabinetName: autoName, plan: selectedPlan });
        setToken(data.token);
        saveCabinetToStorage(data.cabinet);
        setDoctor(data.cabinet);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setServerError(err.response?.data?.message ?? 'Eroare la înregistrare.');
        setIsLoading(false);
      }
      return;
    }

    // Altfel — redirect la Stripe Checkout
    try {
      sessionStorage.setItem('tf_register_fields', JSON.stringify({
        fields: registerFields,
        plan:   selectedPlan,
      }));

      const successUrl = `${FRONTEND_BASE}/register?stripe_session={CHECKOUT_SESSION_ID}`;
      const cancelUrl  = `${FRONTEND_BASE}/register?stripe_cancelled=1`;

      const { data } = await stripeApi.createRegistrationSession(successUrl, cancelUrl);
      window.location.href = data.sessionUrl;
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Eroare la inițializarea plății.');
      setIsLoading(false);
    }
  };

  // ── Nu mai e nevoie de aceste metode (Stripe Checkout le înlocuiește) ──────
  const handleRegisterWithCard  = () => {};
  const handleCardError         = () => {};
  const getRegistrationSetupIntent = () => stripeApi.createSetupIntent();

  return {
    activeTab, setActiveTab,
    isLoading,
    serverError,
    loginFields,    loginErrors,    handleLoginChange, handleLogin,
    registerFields, registerErrors, handleRegisterChange,
    selectedPlan,   setSelectedPlan,
    registerStep,   setRegisterStep,
    handleRegisterContinue,
    handleRegisterWithCard,
    handleCardError,
    getRegistrationSetupIntent,
  };
};

export default useAuth;
