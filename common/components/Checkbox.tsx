import type { InputHTMLAttributes, ReactElement } from "react";

/**
 * Ported from `pte-web/packages/ui/src/components/Checkbox.tsx` (@pte/ui) with the same props, styled with practice
 * CSS tokens instead of Tailwind.
 */
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  helperText?: string;
  error?: string;
}

export const Checkbox = ({ id, label, helperText, error, className, ...props }: CheckboxProps): ReactElement => (
  <div className="checkbox-field">
    <label className="checkbox-label" htmlFor={id}>
      <input id={id} type="checkbox" className={`checkbox-input${className ? ` ${className}` : ""}`}
        aria-invalid={error ? true : undefined} {...props} />
      <span>{label}</span>
    </label>
    {helperText && !error ? <span className="checkbox-helper">{helperText}</span> : null}
    {error ? <span className="checkbox-error">{error}</span> : null}
  </div>
);
