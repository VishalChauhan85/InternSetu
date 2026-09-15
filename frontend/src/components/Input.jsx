/**
 * Standard form input used across the app.
 *
 * Bakes in two layers of defense against browser-extension icon
 * injection (password managers, some antivirus toolbars):
 *
 * 1. Attribute opt-outs the major extensions actually honor:
 *    data-lpignore (LastPass), data-1p-ignore (1Password),
 *    data-bwignore (Bitwarden), data-form-type="other" (Dashlane
 *    and others use this as a signal to skip the field). These
 *    are the *reliable* fix — most icons never get injected at all.
 * 2. A `.field-shield` wrapper (see index.css) as a fallback for
 *    extensions that ignore those attributes: anything injected
 *    inside the wrapper gets hard-capped to 24px and z-indexed
 *    behind the real input.
 *
 * Usage:
 *   <Input label="Email Address" type="email" name="email"
 *          value={formData.email} onChange={handleChange} />
 */
const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  className = '',
  ...rest
}) => {
  return (
    <div>
      {label && (
        <label
          htmlFor={name}
          className="block text-xs font-medium text-slate-600 mb-1"
        >
          {label}
        </label>
      )}
      <div className="field-shield rounded-lg">
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete || 'off'}
          // Extension opt-out attributes
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          data-form-type="other"
          className={`w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent ${className}`}
          {...rest}
        />
      </div>
    </div>
  );
};

export default Input;
