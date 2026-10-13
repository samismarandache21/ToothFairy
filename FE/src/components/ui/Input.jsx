// src/components/ui/Input.jsx

const Input = ({
  label,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  name,
  className = '',
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}

      <div className="input-wrap">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={[
            'input-field',
            !icon ? 'input-field--no-icon' : '',
            error ? 'input-field--error' : '',
          ].filter(Boolean).join(' ')}
        />
      </div>

      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default Input;
