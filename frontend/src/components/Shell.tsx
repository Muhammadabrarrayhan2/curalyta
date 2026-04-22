import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Avatar, Badge } from '@/components/ui';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import type { Notification as NotifType } from '@/types';
import clsx from 'clsx';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  badge?: number;
}

interface ShellProps {
  navItems: NavItem[];
  title?: string;
  subtitle?: string;
  roleLabel: string;
  roleIcon: IconName;
  children: ReactNode;
  headerRight?: ReactNode;
}

export function Shell({ navItems, title, subtitle, roleLabel, roleIcon, children, headerRight }: ShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifType[]>([]);
  const [unread, setUnread] = useState(0);

  const loadNotifs = useCallback(async () => {
    try {
      const { data } = await api.get<{ notifications: NotifType[]; unreadCount: number }>('/notifications', {
        params: { limit: 20 },
      });
      setNotifs(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadNotifs();
    const t = setInterval(loadNotifs, 20_000);
    return () => clearInterval(t);
  }, [loadNotifs]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  async function markAllRead() {
    try {
      await api.post('/notifications/read-all');
      loadNotifs();
    } catch {
      // ignore
    }
  }

  async function markOneRead(id: string) {
    try {
      await api.post(`/notifications/${id}/read`);
      loadNotifs();
    } catch {
      // ignore
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 border-r border-stone-100 bg-white sticky top-0 h-screen shrink-0">
        <div className="p-5 border-b border-stone-100 flex items-center gap-2">
          <Icon name="logo" size={24} className="text-ink" />
          <div>
            <div className="font-display font-semibold text-ink leading-none">Curalyta</div>
            <div className="text-[10px] text-stone-400 mt-0.5 tracking-wider uppercase">{roleLabel} workspace</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => clsx('nav-item', isActive && 'active')}
            >
              <Icon name={item.icon} size={16} />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && <Badge tone="ink">{item.badge}</Badge>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-stone-100">
          <button
            onClick={() => navigate(navItems[0].to.replace(/\/[^/]*$/, '/profile'))}
            className="w-full p-2.5 rounded-lg hover:bg-stone-50 flex items-center gap-3 transition-colors"
          >
            <Avatar name={user.name} size="sm" />
            <div className="flex-1 text-left min-w-0">
              <div className="text-[13px] font-medium text-ink truncate">{user.name}</div>
              <div className="text-[11px] text-stone-400 truncate">{user.email}</div>
            </div>
          </button>
          <button onClick={handleLogout} className="nav-item mt-1">
            <Icon name="logout" size={16} /> <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white p-4 flex flex-col animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon name="logo" size={24} className="text-ink" />
                <span className="font-display font-semibold">Curalyta</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-stone-50">
                <Icon name="x" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => clsx('nav-item', isActive && 'active')}
                >
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <button onClick={handleLogout} className="nav-item mt-2 border-t border-stone-100 pt-3">
              <Icon name="logout" size={16} /> Keluar
            </button>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur border-b border-stone-100">
          <div className="px-5 md:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-stone-100">
                <Icon name="menu" />
              </button>
              <div>
                <div className="text-[11px] text-stone-400 uppercase tracking-wider">{subtitle || roleLabel}</div>
                <h1 className="font-display text-xl text-ink leading-tight">{title || 'Dashboard'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {headerRight}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="p-2 rounded-lg hover:bg-stone-100 relative"
                  aria-label="Notifikasi"
                >
                  <Icon name="bell" size={18} className="text-stone-500" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent ring-2 ring-cream" />
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 card shadow-lift overflow-hidden z-20">
                      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                        <div className="font-medium text-sm text-ink">Notifikasi</div>
                        {unread > 0 && (
                          <button onClick={markAllRead} className="text-[11px] text-sage-deep hover:underline">
                            Tandai terbaca
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-auto">
                        {notifs.length === 0 ? (
                          <div className="py-12 text-center text-sm text-stone-400">Tidak ada notifikasi</div>
                        ) : (
                          notifs.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => markOneRead(n.id)}
                              className={clsx(
                                'w-full text-left px-4 py-3 border-b border-stone-50 last:border-b-0 hover:bg-stone-50',
                                !n.read && 'bg-sage-light/40'
                              )}
                            >
                              <div className="text-sm text-ink font-medium">{n.title}</div>
                              {n.message && <div className="text-[12px] text-stone-500 mt-0.5">{n.message}</div>}
                              <div className="text-[11px] text-stone-400 mt-1">{relativeTime(n.createdAt)}</div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-stone-200">
                <Avatar name={user.name} size="sm" />
                <div className="text-[13px]">
                  <div className="font-medium text-ink leading-none">{user.name}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                    <Icon name={roleIcon} size={12} /> {roleLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
