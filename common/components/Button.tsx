import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonAppearance = "fill" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  appearance?: ButtonAppearance;
  size?: ButtonSize;
  isLoading?: boolean;
  isPending?: boolean;
  isDisabled?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  iconOnly?: boolean;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

/** Mirrors @pte/ui Button's public variants and uses the same theme/action palette. */
export const Button = ({ variant = "primary", appearance, size = "md", isLoading = false, isPending = false,
  isDisabled = false, loadingText, leftIcon, rightIcon, fullWidth, iconOnly, disabled, className = "", children,
  type = "button", ref, ...props }: ButtonProps): ReactElement => {
  const busy = isLoading || isPending;
  const resolvedAppearance = appearance ?? (variant === "secondary" ? "outline" : "fill");
  return (
    <button {...props} ref={ref} type={type} disabled={disabled || isDisabled || busy} aria-busy={busy || undefined}
      className={`pte-button ${className}`.trim()} data-variant={variant} data-appearance={resolvedAppearance}
      data-size={size} data-full-width={fullWidth || undefined} data-icon-only={iconOnly || undefined}>
      {busy ? <span className="pte-button-spinner" aria-hidden="true" /> : leftIcon}
      <span>{busy && loadingText ? loadingText : children}</span>
      {!busy ? rightIcon : null}
    </button>
  );
};
