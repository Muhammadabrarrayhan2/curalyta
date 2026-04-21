export default function BrandMark({ size = 32, variant = 'default' }) {
  const bg = variant === 'light' ? '#F5F1E8' : '#0A3A36'
  const fg = variant === 'light' ? '#0A3A36' : '#F5F1E8'
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center font-serif-display italic"
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * 0.56,
        fontWeight: 500,
      }}
    >
      C
    </div>
  )
}
