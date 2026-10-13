// src/components/ui/StripeCardForm.jsx
// Componentă reutilizabilă pentru colectarea datelor cardului prin Stripe Elements.
// Folosită atât la înregistrare cât și la adăugarea unui card nou în setări.

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Button from './Button';

const PUBLISHABLE_KEY = 'pk_test_51TZFNiCheZHPirg3yIpzdd93r6Qj7r3yKy2vvAtcGWStxkTZDv4bZFssS1dSRmxe3TixDaUucSmg8d9Eujna4F8I008NIxoCHd';
const stripePromise = loadStripe(PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      fontFamily: '"Nunito", "Inter", sans-serif',
      fontWeight: '600',
      color: '#1E293B',
      '::placeholder': { color: '#CBD5E1' },
      iconColor: '#2DD4BF',
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
  hidePostalCode: true,
};

// ── Inner form (inside Elements context) ────────────────────────────────────
const CardFormInner = ({
  getSetupIntent,   // () => Promise<{ data: { clientSecret } }>
  onSuccess,        // (paymentMethodId: string) => void
  onError,          // (msg: string) => void
  submitLabel,
  isParentLoading,  // loading din operația parentului (ex: register API call)
  extraContent,     // JSX opțional afișat deasupra cardului (ex: sumar plan)
}) => {
  const stripe   = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [cardError, setCardError] = useState('');

  const handleSubmit = async () => {
    if (!stripe || !elements || busy || isParentLoading) return;
    setCardError('');
    setBusy(true);

    try {
      // 1. Obține clientSecret de la backend
      const { data } = await getSetupIntent();

      // 2. Confirmă cardul cu Stripe.js
      const { setupIntent, error } = await stripe.confirmCardSetup(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (error) {
        setCardError(error.message);
        setBusy(false);
        return;
      }

      // 3. Transmite paymentMethodId parentului (parentul face restul)
      onSuccess(setupIntent.payment_method);
      // Nu resetăm busy — parentul va seta loading; dacă eșuează, va apela onError
    } catch (e) {
      setCardError('Eroare la verificarea cardului. Încearcă din nou.');
      setBusy(false);
    }
  };

  const isLoading = busy || isParentLoading;

  return (
    <div className="stripe-card-form">
      {extraContent}

      <div className="stripe-card-label">Date card</div>
      <div className={`stripe-card-wrap${cardError ? ' stripe-card-wrap--error' : ''}`}>
        <CardElement
          options={CARD_ELEMENT_OPTIONS}
          onChange={(e) => { if (e.error) setCardError(e.error.message); else setCardError(''); }}
        />
      </div>
      {cardError && <div className="stripe-card-error">{cardError}</div>}

      <div className="stripe-card-secure">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Plată securizată prin Stripe · SSL 256-bit
      </div>

      <Button
        type="button"
        variant="primary"
        fullWidth
        size="lg"
        onClick={handleSubmit}
        disabled={isLoading || !stripe}
      >
        {isLoading ? 'Se procesează...' : (submitLabel || 'Salvează cardul')}
      </Button>
    </div>
  );
};

// ── Wrapper cu Elements provider ────────────────────────────────────────────
const StripeCardForm = (props) => (
  <Elements stripe={stripePromise} options={{ locale: 'ro' }}>
    <CardFormInner {...props} />
  </Elements>
);

export default StripeCardForm;
