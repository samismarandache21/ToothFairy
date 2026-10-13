// src/components/ui/PlanPicker.jsx

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '69 RON/lună',
    badge: null,
    fairy: '/fairy1.png',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '99 RON/lună',
    badge: '⭐ Popular',
    fairy: '/fairy2.png',
  },
];

const PlanPicker = ({ selected, onSelect }) => {
  return (
    <div className="plan-picker">
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          className={`plan-card ${selected === plan.id ? 'plan-card--selected' : ''}`}
          onClick={() => onSelect(plan.id)}
        >
          {plan.badge && (
            <div className="plan-card__badge">{plan.badge}</div>
          )}
          <img
            src={plan.fairy}
            alt={plan.name}
            className="plan-card__fairy"
          />
          <div className="plan-card__name">{plan.name}</div>
          <div className="plan-card__price">{plan.price}</div>
        </div>
      ))}
    </div>
  );
};

export default PlanPicker;
