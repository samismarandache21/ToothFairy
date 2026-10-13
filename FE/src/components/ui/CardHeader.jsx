// src/components/ui/CardHeader.jsx

const CardHeader = ({ title, actionLabel, onAction }) => (
  <div className="card__header">
    <div className="card__title">{title}</div>
    {actionLabel && (
      <button className="card__action" onClick={onAction}>{actionLabel}</button>
    )}
  </div>
);

export default CardHeader;
