'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { useTranslation } from '@/i18n';
import {
  Layers,
  FileText,
  ShieldCheck,
  Cpu,
  Filter,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  Mail,
  Sparkles
} from 'lucide-react';

interface PipelineCardProps {
  icon: React.ReactNode;
  step: string;
  title: string;
  desc: string;
  highlight?: 'macro' | 'meso' | 'micro';
}

function PipelineCard({ icon, step, title, desc, highlight }: PipelineCardProps) {
  const getHighlightClass = () => {
    switch (highlight) {
      case 'macro':
        return 'border-red-500/20 bg-red-500/5 hover:border-red-500/40';
      case 'meso':
        return 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40';
      case 'micro':
        return 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40';
      default:
        return 'border-white/5 bg-white/[0.02] hover:border-indigo-500/30';
    }
  };

  return (
    <div
      className={`p-4 sm:p-6 rounded-2xl border ${getHighlightClass()} backdrop-blur-md relative z-10 transition-all duration-500 group cursor-default`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 sm:p-3 rounded-xl bg-black/40 border border-white/10 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all duration-500">
          {icon}
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-600 tracking-widest">{step}</span>
      </div>
      <h3 className="text-white font-bold text-base sm:text-lg mb-1.5 group-hover:text-indigo-400 transition-colors">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(buildApiPath('auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || t('auth.loginFailed'));
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(t('auth.networkError'));
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-[#06080a] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background - Full screen */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Primary gradient - left side emphasis */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(63,94,251,0.06)_0%,_rgba(0,0,0,0)_50%)]"></div>

        {/* Secondary gradient - right side glow connecting to login panel */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,_rgba(99,102,241,0.04)_0%,_rgba(0,0,0,0)_40%)]"></div>

        {/* Center bridge glow - creates visual connection */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(79,70,229,0.03)_0%,_rgba(0,0,0,0)_60%)]"></div>

        {/* Animated Particles - distributed across full width */}
        {mounted && [...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/10 rounded-full blur-sm"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              left: `${Math.random() * 90}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${15 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Centered Content Container - Tighter for cohesion */}
      <div className="max-w-[1280px] mx-auto min-h-screen flex flex-col lg:flex-row relative">
        {/* Left Column: Content */}
        <div className="flex-1 relative z-10 p-6 sm:p-8 lg:p-12 xl:pl-16 xl:pr-8 overflow-y-auto">
        {/* Logo/Brand - In normal document flow */}
        <div className="flex items-center gap-3 mb-8 lg:mb-12">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Layers className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">Expert Note</span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Knowledge OS</span>
          </div>
        </div>

        {/* Hero Section - Removed max-w constraint for better balance */}
        <div className={`transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Tagline Badge */}
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-medium mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 mr-2 text-indigo-400" />
            {t('landing.tagline')}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.15] mb-6 tracking-tight">
            <span className="block">{t('landing.headline1')}.</span>
            <span className="block">{t('landing.headline2')}.</span>
            <span className="block text-indigo-500">{t('landing.headline3')}.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-8 lg:mb-10">
            {t('landing.subheadline')}
          </p>

          {/* Pipeline Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-8">
            <PipelineCard
              icon={<FileText className="text-blue-400 w-5 h-5" />}
              step="01"
              title={t('landing.step1Title')}
              desc={t('landing.step1Desc')}
            />
            <PipelineCard
              icon={<ShieldCheck className="text-red-400 w-5 h-5" />}
              step="02"
              title={t('landing.step2Title')}
              desc={t('landing.step2Desc')}
              highlight="macro"
            />
            <PipelineCard
              icon={<Cpu className="text-emerald-400 w-5 h-5" />}
              step="03"
              title={t('landing.step3Title')}
              desc={t('landing.step3Desc')}
            />
            <PipelineCard
              icon={<Filter className="text-amber-400 w-5 h-5" />}
              step="04"
              title={t('landing.step4Title')}
              desc={t('landing.step4Desc')}
            />
          </div>
        </div>
      </div>

        {/* Visual Connector Bridge - desktop only */}
        <div className="hidden lg:flex items-center justify-center relative flex-shrink-0" style={{ width: '80px' }}>
          {/* Gradient glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-indigo-500/10 to-indigo-500/5 blur-2xl" />

          {/* Central divider line */}
          <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-gradient-to-b from-transparent via-indigo-500/30 to-transparent" />

          {/* Connecting nodes */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-500/60 rounded-full shadow-lg shadow-indigo-500/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500/80 rounded-full blur-sm animate-pulse shadow-lg shadow-indigo-500/50" />
          <div className="absolute top-2/3 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-500/60 rounded-full shadow-lg shadow-indigo-500/50" />
        </div>

        {/* Right Column: Login - Adjusted width for better balance */}
        <div className="w-full lg:w-[440px] lg:min-w-[400px] xl:min-w-[440px] flex-shrink-0 relative z-10 p-6 lg:p-8 lg:pl-4 flex items-center justify-center bg-white/[0.01] lg:bg-gradient-to-l lg:from-white/[0.03] lg:to-transparent backdrop-blur-xl border-t lg:border-t-0 border-white/5 lg:min-h-screen lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="absolute top-6 right-6 lg:top-8 lg:right-8 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-xs text-slate-300 font-medium z-20"
        >
          <Globe className="w-4 h-4" />
          {language === 'zh' ? 'EN' : '中文'}
        </button>

        {/* Login Card */}
        <div className={`w-full max-w-sm bg-slate-900/50 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl transition-all duration-500 ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {/* Corner Dots */}
          <div className="absolute top-4 right-4 flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">{t('landing.loginTitle')}</h2>
            <p className="text-slate-400 text-sm">{t('landing.loginSub')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-3">
                {t('landing.usernameOrEmail')}
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-white placeholder:text-slate-600 text-sm"
                  placeholder="name@expert.com"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-3">
                {t('auth.password')}
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-11 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-white placeholder:text-slate-600 text-sm"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 mt-2"
            >
              <span className="relative z-10 text-sm">{loading ? t('auth.signingIn') : t('landing.startThinking')}</span>
              {!loading && <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
            <Link
              href="/register"
              className="text-sm text-slate-400 hover:text-indigo-400 transition-colors text-center"
            >
              {t('auth.dontHaveAccount')} {t('auth.registerWithCode')}
            </Link>

            <div className="flex items-center gap-3">
              <div className="h-px w-6 bg-gradient-to-r from-transparent to-slate-700" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/5 bg-white/[0.02]">
                <div className="flex -space-x-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-slate-500">{t('landing.wisdomEngine')}</span>
              </div>
              <div className="h-px w-6 bg-gradient-to-l from-transparent to-slate-700" />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes float-particle {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translate(35vw, -15vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
