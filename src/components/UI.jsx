import { classNames } from '../lib/utils'

export function Card({ children, className, padding = true, hoverable = false }) {
  return (
    <div
      className={classNames(
        'bg-ivory-paper border border-line-soft rounded-[14px] shadow-soft',
        padding && 'p-5',
        hoverable && 'transition-all hover:shadow-medium hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, meta, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="font-serif-display text-[19px] font-medium tracking-tight text-ink">
          {title}
        </h3>
        {meta && (
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-mute mt-0.5">
            {meta}
          </div>
        )}
      </div>
      {action}
    </div>
  )
}

export function Stat({ label, value, delta, deltaDirection = 'up', icon: Icon, accent = 'teal' }) {
  const accentStyle = {
    teal: 'from-teal-100 to-transparent',
    coral: 'from-coral-soft to-transparent',
    sand: 'from-sand/40 to-transparent',
    sage: 'from-sage/30 to-transparent',
  }[accent]

  return (
    <div className="relative bg-ivory-paper border border-line-soft rounded-[14px] p-5 shadow-soft overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${accentStyle} rounded-bl-full pointer-events-none`}
      />
      <div className="relative">
        <div className="text-[12px] text-ink-mute mb-2 flex items-center gap-1.5">
          {Icon && <Icon size={12} strokeWidth={1.8} />}
          {label}
        </div>
        <div className="font-serif-display text-[34px] leading-none tracking-tight">{value}</div>
        {delta && (
          <div
            className={classNames(
              'mt-2 text-[11px] font-mono',
              deltaDirection === 'up' ? 'text-teal-700' : 'text-rose-medical'
            )}
          >
            {deltaDirection === 'up' ? '↑' : '↓'} {delta}
          </div>
        )}
      </div>
    </div>
  )
}

const CHIP_VARIANTS = {
  verified: 'bg-teal-100 text-teal-900',
  pending: 'bg-[#F7E8C8] text-[#6B4E0C]',
  urgent: 'bg-rose-soft text-rose-medical',
  new: 'bg-coral-soft text-[#8C2A10]',
  done: 'bg-ivory-deep text-ink-mute',
  online: 'bg-teal-100 text-teal-900',
  offline: 'bg-sand/50 text-ink-soft',
  revision: 'bg-[#F7E8C8] text-[#6B4E0C]',
  ai: 'bg-gradient-to-br from-teal-900 to-teal-500 text-ivory font-serif-display italic',
  neutral: 'bg-ivory-deep text-ink-soft',
}

export function Chip({ children, variant = 'neutral', icon: Icon, className }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono tracking-wide whitespace-nowrap',
        CHIP_VARIANTS[variant] || CHIP_VARIANTS.neutral,
        className
      )}
    >
      {Icon && <Icon size={11} strokeWidth={2} />}
      {children}
    </span>
  )
}

export function DashedDivider({ className }) {
  return <div className={classNames('border-t border-dashed border-line my-4', className)} />
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-ivory-deep flex items-center justify-center mb-4">
          <Icon size={22} strokeWidth={1.5} className="text-ink-mute" />
        </div>
      )}
      <h4 className="font-serif-display text-xl mb-1.5">{title}</h4>
      {description && (
        <p className="text-sm text-ink-mute max-w-md mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
