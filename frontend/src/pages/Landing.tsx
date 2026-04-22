import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Badge } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { AuthModal, type AuthTab } from './auth/AuthModal';
import { PublicAISection } from '@/components/public/PublicAISection';
import { api } from '@/lib/api';
import clsx from 'clsx';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string | null;
  source: string;
  publishedAt: string;
}

interface PublicStats {
  doctorCount: number;
  specializationCount: number;
  specializations: string[];
}

interface PublicDoctor {
  id: string;
  name: string;
  specialization: string;
  institution: string;
  experience: number;
  bio: string | null;
}

export function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthTab>('patient-login');
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorListOpen, setDoctorListOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const state = location.state as { authMode?: AuthTab } | null;
    if (state?.authMode) {
      setAuthMode(state.authMode);
      setAuthOpen(true);
    }
  }, [location.state]);

  const openAuth = (mode: AuthTab) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const closeAuth = () => {
    setAuthOpen(false);
    const state = location.state as { authMode?: AuthTab } | null;
    if (state?.authMode) {
      navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
        },
        { replace: true, state: null }
      );
    }
  };

  const { data: stats } = useQuery({
    queryKey: ['public', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<PublicStats>('/public/stats');
      return data;
    },
  });

  const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
    queryKey: ['public', 'doctors', searchQuery],
    queryFn: async () => {
      const { data } = await api.get<{ doctors: PublicDoctor[] }>('/public/doctors', {
        params: { pageSize: 8, ...(searchQuery ? { search: searchQuery } : {}) },
      });
      return data;
    },
  });

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['public', 'news'],
    queryFn: async () => {
      const { data } = await api.get<{ articles: NewsArticle[] }>('/news');
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  return (
    <div className="min-h-screen bg-white">
      {/* ============ NAV ============ */}
      <nav
        className={clsx(
          'sticky top-0 z-40 transition-all border-b',
          scrolled ? 'bg-white/95 backdrop-blur-md border-stone-200 shadow-sm' : 'bg-transparent border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <Icon name="logo" size={26} className="text-sage-deep" />
            <span className="font-display font-semibold text-xl text-ink tracking-tight">Curalyta</span>
          </a>

          <div className="hidden md:flex items-center gap-6">
            <a href="#cari-dokter" className="text-sm text-stone-600 hover:text-ink transition-colors">Cari Dokter</a>
            <a href="#layanan" className="text-sm text-stone-600 hover:text-ink transition-colors">Layanan</a>
            <a href="#tanya-ai" className="text-sm text-stone-600 hover:text-ink transition-colors flex items-center gap-1.5">
              <Icon name="sparkles" size={14} />
              Tanya AI
            </a>
            <a href="#berita" className="text-sm text-stone-600 hover:text-ink transition-colors">Info Kesehatan</a>
            <a href="#untuk-dokter" className="text-sm text-stone-600 hover:text-ink transition-colors flex items-center gap-1.5">
              <Icon name="stethoscope" size={14} />
              Untuk Dokter
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openAuth('patient-login')}
              className="hidden sm:inline-flex text-sm font-medium text-stone-700 hover:text-ink px-3 py-2 transition-colors"
            >
              Masuk
            </button>
            <Button size="md" onClick={() => openAuth('patient-register')}>
              Daftar Gratis
            </Button>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #FAF7F2 100%)',
          }}
        />
        <div
          className="absolute inset-0 -z-10 opacity-[0.5]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(92, 139, 126, 0.15) 0%, transparent 60%),
                              radial-gradient(circle at 80% 70%, rgba(74, 144, 226, 0.12) 0%, transparent 55%)`,
          }}
        />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-12 md:pt-20 pb-16">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-16 items-center">
            <div>
              <Badge tone="sage" className="!px-3 !py-1.5 !text-xs mb-6">
                <Icon name="verified" size={12} /> Platform Kesehatan Terpercaya
              </Badge>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-ink leading-[1.05] tracking-tight mb-6">
                Layanan Cepat <br />
                dan <span className="font-serif-italic text-sage-deep">Tepat</span>
              </h1>

              <p className="text-base md:text-lg text-stone-600 leading-relaxed max-w-xl mb-8">
                Layanan booking dan chat dokter terbaik di Indonesia. Konsultasi kapan saja, rekam medis terdigitalisasi, dan didukung AI untuk pengalaman kesehatan yang lebih baik.
              </p>

              {/* Search bar */}
              <div className="bg-white rounded-2xl shadow-lg border border-stone-100 p-2 flex gap-2 max-w-xl mb-6">
                <div className="flex items-center gap-2 flex-1 px-3 py-2">
                  <Icon name="search" size={18} className="text-stone-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Cari dokter, spesialisasi, atau klinik..."
                    className="flex-1 bg-transparent border-0 focus:outline-none text-sm placeholder:text-stone-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') document.getElementById('cari-dokter')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                </div>
                <button
                  onClick={() => document.getElementById('cari-dokter')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-5 py-2.5 bg-sage-deep text-white rounded-xl font-medium text-sm hover:bg-sage transition-colors"
                >
                  Cari
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                <div className="flex items-center gap-1.5">
                  <Icon name="checkCircle" size={16} className="text-sage-deep" />
                  Dokter terverifikasi
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="shield" size={16} className="text-sage-deep" />
                  Data terenkripsi
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="sparkles" size={16} className="text-sage-deep" />
                  Didukung AI
                </div>
              </div>
            </div>

            {/* Right side - decorative doctor illustration */}
            <div className="relative hidden lg:block">
              <div className="relative aspect-[4/5] max-w-md ml-auto">
                <div
                  className="absolute inset-0 rounded-full opacity-20 blur-3xl"
                  style={{ background: 'radial-gradient(circle, #5C8B7E 0%, transparent 70%)' }}
                />
                <div className="relative h-full flex items-end justify-center">
                  {/* Clean SVG illustration — no external image needed */}
                  <DoctorIllustration />
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute top-8 left-4 bg-white rounded-2xl shadow-xl p-4 max-w-[200px] border border-stone-100 animate-[float_4s_ease-in-out_infinite]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center">
                    <Icon name="stethoscope" size={14} className="text-sage-deep" />
                  </div>
                  <span className="text-xs font-semibold text-ink">
                    {stats?.doctorCount ?? '—'}+ Dokter
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">Tersedia di berbagai spesialisasi</p>
              </div>

              <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-xl p-4 max-w-[220px] border border-stone-100 animate-[float_4s_ease-in-out_infinite_1s]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <Icon name="sparkles" size={14} className="text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-ink">AI Assistant</span>
                </div>
                <p className="text-[11px] text-stone-500">Ringkasan pemeriksaan otomatis untuk dokter</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SERVICE TILES ============ */}
      <section id="layanan" className="max-w-7xl mx-auto px-4 lg:px-8 py-12 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-ink mb-3">
            Semua kebutuhan kesehatan <span className="font-serif-italic text-sage-deep">dalam satu tempat</span>
          </h2>
          <p className="text-stone-500">Pilih layanan yang Anda butuhkan — kami siap membantu.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <ServiceTile
            icon="messageSquare"
            iconBg="from-blue-400 to-blue-600"
            label="Chat Dokter"
            description="Konsultasi online kapan saja"
            onClick={() => openAuth('patient-register')}
          />
          <ServiceTile
            icon="calendar"
            iconBg="from-rose-400 to-rose-600"
            label="Buat Janji"
            description="Booking appointment mudah"
            onClick={() => openAuth('patient-register')}
          />
          <ServiceTile
            icon="clipboard"
            iconBg="from-emerald-400 to-emerald-600"
            label="Rekam Medis"
            description="Digital, aman, terorganisir"
            onClick={() => openAuth('patient-register')}
          />
          <ServiceTile
            icon="brain"
            iconBg="from-amber-400 to-orange-500"
            label="Tanya AI"
            description="Tanya kesehatan umum tanpa login"
            onClick={() => scrollToSection('tanya-ai')}
          />
        </div>
      </section>

      <PublicAISection />

      {/* ============ DOCTOR DIRECTORY ============ */}
      <section id="cari-dokter" className="bg-stone-50/70 py-12 md:py-20 border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-ink mb-2">Temui Dokter Kami</h2>
              <p className="text-stone-500">
                {stats?.doctorCount ?? 0} dokter terverifikasi siap membantu Anda
              </p>
            </div>
            {stats && stats.specializations.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <Icon name="filter" size={14} />
                <span>{stats.specializationCount} spesialisasi tersedia</span>
              </div>
            )}
          </div>

          {doctorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                  <div className="h-20 w-20 rounded-full bg-stone-100 mx-auto mb-4" />
                  <div className="h-4 bg-stone-100 rounded w-3/4 mx-auto mb-2" />
                  <div className="h-3 bg-stone-100 rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : doctorsData && doctorsData.doctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {doctorsData.doctors.map((d) => (
                <DoctorCard key={d.id} doctor={d} onBook={() => openAuth('patient-register')} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Icon name="stethoscope" size={40} className="text-stone-300 mx-auto mb-3" />
              <h3 className="font-display text-xl text-ink mb-1">Belum ada dokter tersedia</h3>
              <p className="text-sm text-stone-500 max-w-md mx-auto">
                Kami sedang mengundang dokter-dokter profesional untuk bergabung. Daftar sekarang dan tim kami akan memberi tahu Anda.
              </p>
              <Button className="mt-5" onClick={() => openAuth('patient-register')}>
                Daftar sebagai Pasien
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ============ WHY US ============ */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge tone="sage" className="mb-4">Keunggulan Kami</Badge>
            <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-5">
              Kenapa <span className="font-serif-italic">Curalyta</span> berbeda?
            </h2>
            <p className="text-stone-500 leading-relaxed mb-8">
              Bukan sekadar platform booking — kami membangun ekosistem kesehatan yang menghubungkan pasien dan dokter dengan teknologi modern.
            </p>

            <div className="space-y-5">
              <Feature
                icon="verified"
                title="Dokter Terverifikasi"
                desc="Setiap dokter melalui verifikasi STR/SIP oleh tim admin kami sebelum praktik."
              />
              <Feature
                icon="lock"
                title="Data Anda Terlindungi"
                desc="Enkripsi kredensial bcrypt, akses role-based, dan audit log lengkap."
              />
              <Feature
                icon="brain"
                title="AI Clinical Support"
                desc="Dokter dibantu AI untuk ringkasan pemeriksaan dan deteksi dini."
              />
              <Feature
                icon="activity"
                title="NEWS2 Scoring"
                desc="Sistem early warning kelas klinis otomatis pada setiap pemeriksaan."
              />
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Pasien Terdaftar" value="Segera" sub="Bergabunglah sebagai yang pertama" />
              <StatCard label="Dokter Aktif" value={`${stats?.doctorCount ?? 0}+`} sub="Dan terus bertambah" />
              <StatCard label="Spesialisasi" value={`${stats?.specializationCount ?? 0}+`} sub="Beragam bidang" />
              <StatCard label="Clinical Score" value="NEWS2" sub="Standar internasional" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ NEWS SECTION ============ */}
      <section id="berita" className="bg-stone-50/70 py-12 md:py-20 border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <Badge tone="info" className="mb-3">Info Kesehatan</Badge>
              <h2 className="font-display text-3xl md:text-4xl text-ink">Artikel Kesehatan Terkini</h2>
              <p className="text-stone-500 mt-2">Kumpulan berita & tips kesehatan dari sumber terpercaya</p>
            </div>
          </div>

          {newsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-stone-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-stone-100 rounded w-3/4" />
                    <div className="h-3 bg-stone-100 rounded w-full" />
                    <div className="h-3 bg-stone-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : newsData && newsData.articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {newsData.articles.slice(0, 6).map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Icon name="fileText" size={40} className="text-stone-300 mx-auto mb-3" />
              <h3 className="font-display text-xl text-ink">Belum bisa memuat berita</h3>
              <p className="text-sm text-stone-500 mt-1">Periksa koneksi internet Anda atau coba lagi nanti.</p>
            </div>
          )}

          {newsData && newsData.articles.length > 6 && (
            <div className="text-center mt-8">
              <p className="text-xs text-stone-400">Sumber: Detik Health, Kompas Health, CNN Indonesia</p>
            </div>
          )}
        </div>
      </section>

      {/* ============ FOR DOCTORS ============ */}
      <section id="untuk-dokter" className="py-12 md:py-20 bg-ink text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="!bg-white/10 !text-white !border-white/20 mb-4">
                <Icon name="stethoscope" size={12} /> Khusus Dokter
              </Badge>
              <h2 className="font-display text-3xl md:text-5xl leading-tight mb-5">
                Praktik klinis yang <br />
                <span className="font-serif-italic text-sage">lebih cerdas</span>
              </h2>
              <p className="text-stone-300 leading-relaxed mb-8 max-w-xl">
                Bergabunglah dengan Curalyta sebagai dokter profesional. Dapatkan akses ke AI clinical assistant, manajemen pasien terstruktur, dan early warning system berbasis NEWS2.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <DoctorFeature icon="users" label="Manajemen pasien terpusat" />
                <DoctorFeature icon="sparkles" label="AI clinical support" />
                <DoctorFeature icon="activity" label="Vital signs & NEWS2 otomatis" />
                <DoctorFeature icon="list" label="Task harian terintegrasi" />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => openAuth('doctor-register')}
                  className="inline-flex items-center gap-2 bg-sage text-ink px-6 py-3 rounded-xl font-semibold hover:bg-sage-light transition-all hover:-translate-y-0.5"
                >
                  Daftar sebagai Dokter
                  <Icon name="arrowRight" size={16} />
                </button>
                <button
                  onClick={() => openAuth('doctor-login')}
                  className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors"
                >
                  Masuk Dokter
                </button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
                      <Icon name="sparkles" size={18} className="text-sage" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Prioritas klinis otomatis</div>
                      <div className="text-xs text-stone-400">Ringkasan pasien berisiko tampil lebih dulu</div>
                    </div>
                    <Badge className="!bg-rose-500/20 !text-rose-300 !border-rose-500/30">
                      NEWS2: 6
                    </Badge>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-xs text-sage mb-2">
                      <Icon name="sparkles" size={12} />
                      <span className="font-medium">AI Ringkasan</span>
                    </div>
                    <p className="text-xs leading-relaxed text-stone-300">
                      Pasien menunjukkan tanda peringatan sedang. Tekanan darah terus meningkat dalam 3 kunjungan terakhir. Pertimbangkan penyesuaian dosis antihipertensi...
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <MiniStat label="BP" value="160/95" unit="mmHg" tone="rose" />
                    <MiniStat label="HR" value="98" unit="bpm" tone="amber" />
                    <MiniStat label="SpO₂" value="96" unit="%" tone="sage" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-white border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="logo" size={24} className="text-sage-deep" />
                <span className="font-display font-semibold text-lg text-ink">Curalyta</span>
              </div>
              <p className="text-sm text-stone-500 leading-relaxed">
                Platform clinical intelligence untuk praktik medis modern di Indonesia.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-ink mb-3 text-sm">Untuk Pasien</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><button onClick={() => openAuth('patient-register')} className="hover:text-ink">Daftar Akun</button></li>
                <li><a href="#cari-dokter" className="hover:text-ink">Cari Dokter</a></li>
                <li><a href="#berita" className="hover:text-ink">Info Kesehatan</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-ink mb-3 text-sm">Untuk Dokter</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><button onClick={() => openAuth('doctor-register')} className="hover:text-ink">Daftar sebagai Dokter</button></li>
                <li><button onClick={() => openAuth('doctor-login')} className="hover:text-ink">Login Dokter</button></li>
                <li><a href="#untuk-dokter" className="hover:text-ink">Fitur Dokter</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-6 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
            <div>© {new Date().getFullYear()} Curalyta. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>Clinical Intelligence Platform</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      <AuthModal open={authOpen} mode={authMode} onClose={closeAuth} onChangeMode={setAuthMode} />
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function ServiceTile({
  icon,
  iconBg,
  label,
  description,
  onClick,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  iconBg: string;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group bg-white hover:bg-stone-50 border border-stone-100 hover:border-stone-200 rounded-2xl p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconBg} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        <Icon name={icon} size={24} />
      </div>
      <div className="font-semibold text-ink mb-1">{label}</div>
      <div className="text-xs text-stone-500">{description}</div>
    </button>
  );
}

function DoctorCard({ doctor, onBook }: { doctor: PublicDoctor; onBook: () => void }) {
  const initials = doctor.name
    .split(' ')
    .filter((p) => !/^(dr|drg|prof|ir)\.?$/i.test(p))
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-100 hover:border-sage-deep/30 hover:shadow-lg transition-all group">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage to-sage-deep text-white flex items-center justify-center text-2xl font-bold mb-3 ring-4 ring-sage-light">
          {initials || '?'}
        </div>
        <div className="font-semibold text-ink text-sm mb-1 line-clamp-1">{doctor.name}</div>
        <div className="text-xs text-sage-deep mb-2">{doctor.specialization}</div>
        <div className="text-[11px] text-stone-500 mb-3 line-clamp-1">{doctor.institution}</div>
        <div className="text-[11px] text-stone-400 mb-4">
          {doctor.experience} tahun pengalaman
        </div>
        <button
          onClick={onBook}
          className="w-full text-xs font-medium text-sage-deep border border-sage-deep/20 hover:bg-sage-deep hover:text-white rounded-lg py-2 transition-colors"
        >
          Buat Janji
        </button>
      </div>
    </div>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  const fallbackGradient = 'linear-gradient(135deg, #E0F2FE 0%, #E8F0EC 100%)';

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-2xl overflow-hidden border border-stone-100 hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      <div
        className="aspect-[16/10] relative overflow-hidden"
        style={article.imageUrl ? {} : { background: fallbackGradient }}
      >
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="fileText" size={40} className="text-sage-deep/40" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge tone="sage" className="!bg-white/95 backdrop-blur !text-sage-deep">
            {article.source}
          </Badge>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg text-ink line-clamp-2 mb-2 group-hover:text-sage-deep transition-colors leading-snug">
          {article.title}
        </h3>
        <p className="text-sm text-stone-500 line-clamp-2 mb-3">{article.description}</p>
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span>{new Date(article.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span className="flex items-center gap-1 text-sage-deep font-medium">
            Baca <Icon name="arrowRight" size={12} />
          </span>
        </div>
      </div>
    </a>
  );
}

function Feature({ icon, title, desc }: { icon: Parameters<typeof Icon>[0]['name']; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-xl bg-sage-light text-sage-deep flex items-center justify-center shrink-0">
        <Icon name={icon} size={18} />
      </div>
      <div>
        <div className="font-semibold text-ink mb-1">{title}</div>
        <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-gradient-to-br from-stone-50 to-white rounded-2xl p-6 border border-stone-100">
      <div className="text-xs text-stone-500 uppercase tracking-wider mb-2">{label}</div>
      <div className="font-display text-3xl md:text-4xl text-ink mb-1">{value}</div>
      <div className="text-xs text-stone-500">{sub}</div>
    </div>
  );
}

function DoctorFeature({ icon, label }: { icon: Parameters<typeof Icon>[0]['name']; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-stone-200">
      <Icon name={icon} size={16} className="text-sage shrink-0" />
      <span>{label}</span>
    </div>
  );
}

function MiniStat({ label, value, unit, tone }: { label: string; value: string; unit: string; tone: 'rose' | 'amber' | 'sage' }) {
  const toneClass = tone === 'rose' ? 'text-rose-300' : tone === 'amber' ? 'text-amber-300' : 'text-sage';
  return (
    <div className="bg-white/5 rounded-lg p-2.5 text-center border border-white/10">
      <div className="text-[10px] text-stone-400 uppercase mb-0.5">{label}</div>
      <div className={`font-mono font-semibold text-sm ${toneClass}`}>
        {value}
        <span className="text-[9px] text-stone-500 ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

function DoctorIllustration() {
  return (
    <svg viewBox="0 0 400 500" className="w-full h-full drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f0f4f2" />
        </linearGradient>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4cdab" />
          <stop offset="1" stopColor="#e0b088" />
        </linearGradient>
        <linearGradient id="hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d2817" />
          <stop offset="1" stopColor="#1f1309" />
        </linearGradient>
      </defs>

      {/* Circle bg */}
      <circle cx="200" cy="250" r="200" fill="#E8F0EC" opacity="0.4" />

      {/* Body (coat) */}
      <path
        d="M 90 500 L 90 320 Q 90 260 160 250 L 240 250 Q 310 260 310 320 L 310 500 Z"
        fill="url(#coat)"
      />
      <path d="M 200 250 L 200 500" stroke="#d0d8d4" strokeWidth="2" />

      {/* Stethoscope */}
      <path
        d="M 165 270 Q 150 320 165 360 M 235 270 Q 250 320 235 360"
        fill="none"
        stroke="#3E6B5E"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="200" cy="370" r="14" fill="#5C8B7E" />
      <circle cx="200" cy="370" r="8" fill="#3E6B5E" />

      {/* Tie */}
      <path d="M 192 260 L 208 260 L 214 275 L 200 340 L 186 275 Z" fill="#4A6FA5" />

      {/* Neck */}
      <rect x="185" y="225" width="30" height="40" fill="url(#skin)" />

      {/* Head */}
      <ellipse cx="200" cy="180" rx="60" ry="70" fill="url(#skin)" />

      {/* Hair */}
      <path
        d="M 145 170 Q 140 110 200 105 Q 260 110 255 170 Q 250 140 200 140 Q 150 140 145 170"
        fill="url(#hair)"
      />

      {/* Eyes */}
      <ellipse cx="180" cy="185" rx="4" ry="5" fill="#1f1309" />
      <ellipse cx="220" cy="185" rx="4" ry="5" fill="#1f1309" />
      <circle cx="181" cy="183" r="1" fill="white" />
      <circle cx="221" cy="183" r="1" fill="white" />

      {/* Eyebrows */}
      <path d="M 170 175 Q 180 172 190 175" stroke="#3d2817" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 210 175 Q 220 172 230 175" stroke="#3d2817" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Smile */}
      <path d="M 185 215 Q 200 225 215 215" stroke="#8b5a3c" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Badge on coat */}
      <rect x="230" y="290" width="30" height="40" rx="3" fill="#5C8B7E" opacity="0.15" />
      <rect x="230" y="290" width="30" height="40" rx="3" fill="none" stroke="#5C8B7E" strokeWidth="1" />
      <circle cx="245" cy="305" r="5" fill="#5C8B7E" />
      <rect x="236" y="315" width="18" height="2" fill="#5C8B7E" opacity="0.5" />
      <rect x="236" y="319" width="14" height="2" fill="#5C8B7E" opacity="0.5" />
    </svg>
  );
}
