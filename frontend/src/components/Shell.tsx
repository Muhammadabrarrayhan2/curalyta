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
      <aside className="hidden md:flex flex-col w-60 bg-ink text-white sticky top-0 h-screen shrink-0">
        <BrandMark roleLabel={roleLabel} />
        <nav className="flex-1 px-3 pt-2 space-y-0.5 overflow-y-auto">
          <div className="eyebrow !text-white/35 px-3 pb-2">Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => clsx('nav-item', isActive && 'active')}
            >
              <Icon name={item.icon} size={16} />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && <Badge tone="sage">{item.badge}</Badge>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => navigate(navItems[0].to.replace(/\/[^/]*$/, '/profile'))}
            className="w-full p-2.5 rounded-[10px] hover:bg-white/5 flex items-center gap-3 transition-colors"
          >
            <Avatar name={user.name} size="sm" className="!from-sage !to-sage-deep" />
            <div className="flex-1 text-left min-w-0">
              <div className="text-[13px] font-semibold text-white truncate">{user.name}</div>
              <div className="text-[11px] text-white/45 truncate">{user.email}</div>
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
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-ink text-white flex flex-col animate-slide-in">
            <div className="flex items-center justify-between pr-3">
              <BrandMark roleLabel={roleLabel} />
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="Tutup menu">
                <Icon name="x" />
              </button>
            </div>
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
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
            <div className="p-3 border-t border-white/10">
              <button onClick={handleLogout} className="nav-item">
                <Icon name="logout" size={16} /> Keluar
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-cream/85 backdrop-blur-md border-b border-stone-200/70">
          <div className="px-5 md:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-stone-100" aria-label="Buka menu">
                <Icon name="menu" />
              </button>
              <div className="min-w-0">
                <div className="eyebrow truncate">{subtitle || roleLabel}</div>
                <h1 className="font-display text-xl text-ink leading-tight mt-0.5 truncate">{title || 'Dashboard'}</h1>
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

        <main className="flex-1 p-5 md:p-8 overflow-x-hidden animate-rise">{children}</main>
      </div>
    </div>
  );
}

function BrandMark({ roleLabel }: { roleLabel: string }) {
  return (
    <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-[10px] bg-white/[0.07] ring-1 ring-white/10 flex items-center justify-center">
        <Icon name="logo" size={20} className="text-[#4FD1C1]" />
      </div>
      <div>
        <div className="font-display font-extrabold text-[17px] text-white leading-none tracking-tight">Curalyta</div>
        <div className="font-mono text-[9.5px] text-white/45 mt-1 tracking-[0.14em] uppercase">{roleLabel} workspace</div>
      </div>
    </div>
  );
}
