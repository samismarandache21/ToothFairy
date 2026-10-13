// src/hooks/useBilling.js

import { useState, useEffect, useCallback } from 'react';
import { stripeApi } from '../lib/api';

const FRONTEND_BASE = window.location.origin;

const useBilling = () => {
  const [subscription,    setSubscription]    = useState(null);
  const [paymentMethods,  setPaymentMethods]  = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [addCardOpen,     setAddCardOpen]      = useState(false);
  const [changePlanOpen,  setChangePlanOpen]   = useState(false);
  const [actionError,     setActionError]      = useState('');
  const [actionLoading,   setActionLoading]    = useState(false);
  const [successMsg,      setSuccessMsg]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, pmRes] = await Promise.all([
        stripeApi.getSubscription(),
        stripeApi.getPaymentMethods(),
      ]);
      setSubscription(subRes.data);
      setPaymentMethods(pmRes.data);
    } catch {
      // Cabinet fără Stripe (ex: înregistrat înainte de modul de plată)
      setSubscription(null);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Setare card implicit ──────────────────────────────────────────────────
  const handleSetDefault = async (pmId) => {
    setActionError('');
    setActionLoading(true);
    try {
      await stripeApi.setDefaultPaymentMethod(pmId);
      await load();
      flash('Card implicit actualizat!');
    } catch (e) {
      setActionError(e.response?.data?.message ?? 'Eroare la actualizarea cardului.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Eliminare card ───────────────────────────────────────────────────────
  const handleDetach = async (pmId) => {
    setActionError('');
    setActionLoading(true);
    try {
      await stripeApi.detachPaymentMethod(pmId);
      await load();
      flash('Card eliminat!');
    } catch (e) {
      setActionError(e.response?.data?.message ?? 'Eroare la eliminarea cardului.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Redirect la Stripe Checkout pentru adăugare card ───────────────────
  const handleAddCardRedirect = async () => {
    setActionError('');
    setActionLoading(true);
    try {
      const successUrl = `${FRONTEND_BASE}/settings?stripe_card=success&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl  = `${FRONTEND_BASE}/settings?stripe_card=cancelled`;
      const { data } = await stripeApi.createAddCardSession(successUrl, cancelUrl);
      window.location.href = data.sessionUrl;
    } catch (e) {
      setActionError(e.response?.data?.message ?? 'Eroare la inițializarea sesiunii Stripe.');
      setActionLoading(false);
    }
    // Nu resetăm loading — redirecționăm pagina
  };

  // ── Finalizare după revenire din Stripe (apelat din useEffect în Settings) ─
  const finalizeAddCard = async (sessionId) => {
    setActionLoading(true);
    try {
      await stripeApi.finalizeAddCard(sessionId);
      await load();
      flash('Card adăugat cu succes!');
    } catch (e) {
      setActionError(e.response?.data?.message ?? 'Eroare la finalizarea cardului.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCardError = (msg) => {
    setActionError(msg);
    setActionLoading(false);
  };

  // ── Schimbare plan ───────────────────────────────────────────────────────
  const handleChangePlan = async (newPlan) => {
    setActionError('');
    setActionLoading(true);
    try {
      await stripeApi.changePlan(newPlan);
      await load();
      setChangePlanOpen(false);
      flash('Planul a fost schimbat!');
    } catch (e) {
      setActionError(e.response?.data?.message ?? 'Eroare la schimbarea planului.');
    } finally {
      setActionLoading(false);
    }
  };

  return {
    subscription,
    paymentMethods,
    loading,
    addCardOpen,    setAddCardOpen,
    changePlanOpen, setChangePlanOpen,
    actionError,    setActionError,
    actionLoading,
    successMsg,
    handleSetDefault,
    handleDetach,
    handleAddCardRedirect,
    finalizeAddCard,
    handleCardError,
    handleChangePlan,
  };
};

export default useBilling;
