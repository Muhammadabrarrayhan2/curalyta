import { format, formatDistanceToNow, differenceInYears, parseISO, isValid } from 'date-fns';
import { id } from 'date-fns/locale';

export function fmtDate(date: string | Date | null | undefined, pattern = 'dd MMM yyyy'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, pattern, { locale: id });
}

export function fmtDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, 'dd MMM yyyy, HH:mm', { locale: id });
}

export function fmtTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, 'HH:mm', { locale: id });
}

export function relativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return formatDistanceToNow(d, { addSuffix: true, locale: id });
}

export function computeAge(dob: string | Date | null | undefined): number | null {
  if (!dob) return null;
  const d = typeof dob === 'string' ? parseISO(dob) : dob;
  if (!isValid(d)) return null;
  return differenceInYears(new Date(), d);
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

export function genderLabel(g: string | null | undefined): string {
  if (g === 'MALE') return 'Laki-laki';
  if (g === 'FEMALE') return 'Perempuan';
  if (g === 'OTHER') return 'Lainnya';
  return '—';
}

export function newsBadgeTone(level: string): 'success' | 'info' | 'warning' | 'danger' | 'default' {
  if (level === 'critical') return 'danger';
  if (level === 'high') return 'warning';
  if (level === 'medium') return 'info';
  if (level === 'low') return 'success';
  return 'default';
}

export function newsLabel(level: string): string {
  if (level === 'critical') return 'Kritis';
  if (level === 'high') return 'Tinggi';
  if (level === 'medium') return 'Sedang';
  if (level === 'low') return 'Rendah';
  return '—';
}

export function priorityBadgeTone(p: TaskPriorityStr): 'danger' | 'warning' | 'info' | 'default' {
  if (p === 'URGENT') return 'danger';
  if (p === 'HIGH') return 'warning';
  if (p === 'MEDIUM') return 'info';
  return 'default';
}

export function priorityLabel(p: TaskPriorityStr): string {
  if (p === 'URGENT') return 'Urgent';
  if (p === 'HIGH') return 'Tinggi';
  if (p === 'MEDIUM') return 'Sedang';
  return 'Rendah';
}

type TaskPriorityStr = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export function todayISOStringDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, delay: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
