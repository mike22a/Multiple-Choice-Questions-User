'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname, Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { 
  GraduationCap,
  LogOut, 
  Globe, 
  User,
  ChevronDown
} from 'lucide-react';

type Props = {
  children: ReactNode;
  params: { locale: string };
};

export default function CandidateDashboardLayout({ children, params: { locale } }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const tc = useTranslations('Common');

  const { profile, isAuthenticated, clearAuth } = useAuthStore();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Monitor store hydration
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    return () => unsub();
  }, []);

  // Authentication Guard
  useEffect(() => {
    setIsMounted(true);
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!isMounted || !hasHydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          <span className="text-sm font-medium">{tc('loading')}</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const toggleLanguage = () => {
    const nextLocale = locale === 'en' ? 'id' : 'en';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-teal-600/5 blur-[150px] pointer-events-none" />

      {/* Header bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-900 bg-slate-950/70 px-6 lg:px-8 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/10">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-white">{tc('title')}</span>
        </Link>

        {/* Right menu tools */}
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{locale === 'en' ? 'EN' : 'ID'}</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 p-1.5 pr-3 text-sm text-slate-300 hover:bg-slate-900 hover:text-white focus:outline-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-400">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold leading-none text-white">{profile?.fullName}</p>
                <p className="mt-0.5 text-[10px] leading-none text-slate-400 truncate max-w-[120px]">{profile?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>

            {isProfileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 z-20 w-48 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-xl">
                  <div className="px-3 py-2 text-xs border-b border-slate-800 mb-1">
                    <p className="font-semibold text-slate-400">Logged in as</p>
                    <p className="font-bold text-white truncate">{profile?.username}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{tc('logout')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="min-h-[calc(100vh-4rem)] max-w-6xl mx-auto p-6 lg:p-8 w-full min-w-0">
        {children}
      </main>
    </div>
  );
}
