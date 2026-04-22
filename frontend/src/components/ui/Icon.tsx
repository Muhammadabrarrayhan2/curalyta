import type { SVGProps } from 'react';

export type IconName =
  | 'stethoscope' | 'user' | 'users' | 'shield' | 'home' | 'calendar' | 'bell'
  | 'settings' | 'logout' | 'plus' | 'search' | 'check' | 'checkCircle' | 'x'
  | 'alert' | 'arrowRight' | 'arrowLeft' | 'mail' | 'phone' | 'lock' | 'eye'
  | 'eyeOff' | 'fileText' | 'activity' | 'heart' | 'brain' | 'sparkles'
  | 'trending' | 'trendingDown' | 'clock' | 'list' | 'upload' | 'edit'
  | 'trash' | 'chevronDown' | 'chevronRight' | 'chevronLeft' | 'menu'
  | 'database' | 'filter' | 'download' | 'info' | 'send' | 'clipboard'
  | 'thermometer' | 'building' | 'refresh' | 'more' | 'logo' | 'verified'
  | 'messageSquare' | 'target' | 'layers';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, strokeWidth = 1.75, className = '', ...rest }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    ...rest,
  };

  switch (name) {
    case 'stethoscope': return <svg {...common}><path d="M4.8 2v4.8A4.8 4.8 0 009.6 11.6a4.8 4.8 0 004.8-4.8V2"/><circle cx="18.4" cy="14" r="2.4"/><path d="M9.6 11.6v2.4a6 6 0 006 6h.8a3.2 3.2 0 003.2-3.2v-2.4"/></svg>;
    case 'user': return <svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case 'users': return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M18 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'shield': return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'home': return <svg {...common}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>;
    case 'calendar': return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
    case 'bell': return <svg {...common}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
    case 'settings': return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'logout': return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
    case 'check': return <svg {...common}><path d="M20 6L9 17l-5-5"/></svg>;
    case 'checkCircle': return <svg {...common}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>;
    case 'x': return <svg {...common}><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case 'alert': return <svg {...common}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>;
    case 'arrowRight': return <svg {...common}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
    case 'arrowLeft': return <svg {...common}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
    case 'mail': return <svg {...common}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>;
    case 'phone': return <svg {...common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
    case 'lock': return <svg {...common}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case 'eye': return <svg {...common}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eyeOff': return <svg {...common}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>;
    case 'fileText': return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>;
    case 'activity': return <svg {...common}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    case 'heart': return <svg {...common}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    case 'brain': return <svg {...common}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4M12 18v-4"/></svg>;
    case 'sparkles': return <svg {...common}><path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'trending': return <svg {...common}><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>;
    case 'trendingDown': return <svg {...common}><path d="M23 18l-9.5-9.5-5 5L1 6"/><path d="M17 18h6v-6"/></svg>;
    case 'clock': return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    case 'list': return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
    case 'upload': return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></svg>;
    case 'edit': return <svg {...common}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case 'trash': return <svg {...common}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
    case 'chevronDown': return <svg {...common}><path d="M6 9l6 6 6-6"/></svg>;
    case 'chevronRight': return <svg {...common}><path d="M9 18l6-6-6-6"/></svg>;
    case 'chevronLeft': return <svg {...common}><path d="M15 18l-9-6 9-6"/></svg>;
    case 'menu': return <svg {...common}><path d="M3 12h18M3 6h18M3 18h18"/></svg>;
    case 'database': return <svg {...common}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
    case 'filter': return <svg {...common}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>;
    case 'download': return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>;
    case 'info': return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>;
    case 'send': return <svg {...common}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
    case 'clipboard': return <svg {...common}><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>;
    case 'thermometer': return <svg {...common}><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4 4 0 1 0 5 0z"/></svg>;
    case 'building': return <svg {...common}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>;
    case 'refresh': return <svg {...common}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
    case 'more': return <svg {...common}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
    case 'verified': return <svg {...common}><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-3.582 9-8 9s-8-4.03-8-9c0-1.65.4-3.202 1.11-4.557.7-1.339 1.688-2.458 2.89-3.216a7.948 7.948 0 0 1 8 0c1.201.758 2.19 1.877 2.89 3.216C20.6 8.797 21 10.35 21 12Z"/></svg>;
    case 'messageSquare': return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'target': return <svg {...common}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    case 'layers': return <svg {...common}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
    case 'logo': return <svg {...common}><path d="M16 3L5 8v8c0 6.5 4.7 12.5 11 14 6.3-1.5 11-7.5 11-14V8l-11-5z" fill="currentColor" fillOpacity="0.15"/><path d="M16 3L5 8v8c0 6.5 4.7 12.5 11 14 6.3-1.5 11-7.5 11-14V8l-11-5z"/><path d="M11 15l3.5 3.5L21 12"/></svg>;
    default: return null;
  }
}
