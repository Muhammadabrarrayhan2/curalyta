export default function PageHeader({ eyebrow, title, titleAccent, subtitle, actions, children }) {
  return (
    <header className="mb-7 pb-5 border-b border-dashed border-line animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
          <h1 className="font-serif-display text-[36px] md:text-[40px] leading-[1.05] tracking-tight text-ink">
            {title}
            {titleAccent && (
              <>
                {' '}
                <em className="italic text-coral">{titleAccent}</em>
              </>
            )}
          </h1>
          {subtitle && (
            <p className="text-[14.5px] text-ink-mute mt-2.5 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
