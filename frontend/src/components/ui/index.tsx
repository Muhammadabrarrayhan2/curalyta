import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type InputHTMLAttributes, useEffect } from 'react';
import clsx from 'clsx';
import { Icon, type IconName } from './Icon';

// ============================================================
// Button
// ============================================================

type ButtonVariant = 'primary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'ghost' && 'btn-ghost',
        variant === 'danger' && 'btn-danger',
        size === 'sm' && 'btn-sm',
        size === 'md' && 'btn-md',
        size === 'lg' && 'btn-lg',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Memproses...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = 'Button';

// ============================================================
// Badge
// ============================================================

type BadgeTone = 'default' | 'sage' | 'danger' | 'warning' | 'success' | 'info' | 'ink';

export function Badge({ children, tone = 'default', className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span className={clsx('badge', `badge-${tone}`, className)}>
      {children}
    </span>
  );
}

// ============================================================
// Avatar
// ============================================================

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export function Avatar({ name, size = 'md', className }: { name: string; size?: AvatarSize; className?: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  const sizeClasses: Record<AvatarSize, string> = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  return (
    <div className={clsx('rounded-full bg-gradient-to-br from-ink to-ink-soft text-cream flex items-center justify-center font-semibold shrink-0', sizeClasses[size], className)}>
      {initials || '?'}
    </div>
  );
}

// ============================================================
// Field (label wrapper)
// ============================================================

interface FieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, error, required, hint, children, className }: FieldProps) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="field-label">
          {label}
          {required && <span className="text-clinical-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="text-[11.5px] text-stone-400">{hint}</span>}
      {error && (
        <span className="text-[11.5px] text-clinical-danger flex items-center gap-1">
          <Icon name="alert" size={12} />
          {error}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Input
// ============================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...rest }, ref) => (
    <input ref={ref} className={clsx('input', error && 'error', className)} {...rest} />
  )
);
Input.displayName = 'Input';

// ============================================================
// Modal
// ============================================================

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
}

export function Modal({ open, onClose, children, size = 'md', closeOnBackdrop = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const widthClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div className={clsx('relative w-full max-h-[92vh] overflow-auto card shadow-lift animate-scale-in', widthClass)}>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Empty state
// ============================================================

interface EmptyProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function Empty({ icon = 'database', title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-stone-50 flex items-center justify-center mb-4">
        <Icon name={icon} size={24} className="text-stone-400" />
      </div>
      <h3 className="font-display text-lg text-ink mb-1">{title}</h3>
      {description && <p className="text-sm text-stone-500 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ============================================================
// Tabs
// ============================================================

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={clsx('flex items-center gap-1 border-b border-stone-100 overflow-x-auto', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={clsx(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
            active === t.id
              ? 'border-ink text-ink'
              : 'border-transparent text-stone-500 hover:text-ink'
          )}
        >
          {t.label}
          {t.count != null && <span className="ml-2 text-[11px] font-mono text-stone-400">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Spinner
// ============================================================

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span
      className={clsx('inline-block border-2 border-current border-t-transparent rounded-full animate-spin', className)}
      style={{ width: size, height: size }}
    />
  );
}

// ============================================================
// Loading screen
// ============================================================

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-gradient">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 text-stone-500">
          <Icon name="logo" size={28} className="text-ink" />
          <span className="font-display text-xl text-ink">Curalyta</span>
        </div>
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <span className="typing-dot w-2 h-2 rounded-full bg-sage inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-sage inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-sage inline-block" />
        </div>
      </div>
    </div>
  );
}
