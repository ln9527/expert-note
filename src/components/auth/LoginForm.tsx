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
  delay: string;
}

function PipelineCard({ icon, step, title, desc, highlight, delay }: PipelineCardProps) {
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
      className={`p-6 rounded-[1.5rem] border ${getHighlightClass()} backdrop-blur-md relative z-10 transition-all duration-500 group cursor-default`}
    >
      <div className="flex justify-between items-start mb-5">
        <div className="p-3 rounded-2xl bg-black/40 border border-white/10 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all duration-500">
          {icon}
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-700 tracking-widest">{step}</span>
      </div>
      <h3 className="text-white font-bold text-lg mb-2 group-hover:text-indigo-400 transition-colors">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>

      {/* Decorative inner glow */}
      <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
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

      // Redirect to dashboard
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
    <div className="min-h-screen bg-[#06080a] text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col lg:flex-row relative">
      {/* Dynamic Background: The Noise-to-Signal Metaphor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(63,94,251,0.05)_0%,_rgba(0,0,0,0)_50%)]"></div>

        {/* Animated Particles (Scattered Noise) */}
        {mounted && [...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/10 rounded-full blur-sm animate-float-particle"
            style={{
              width: Math.random() * 4 + 'px',
              height: Math.random() * 4 + 'px',
              left: Math.random() * 60 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 10 + 10 + 's'
            }}
          ></div>
        ))}

        {/* The "Filter" Line Visual */}
        <div className="absolute top-0 bottom-0 left-[58%] w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent hidden lg:block">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-500/40 rounded-full blur-md animate-pulse"></div>
        </div>
      </div>

      {/* Left Column: Narrative & Storytelling */}
      <div className="w-full lg:w-[58%] p-8 lg:p-12 xl:p-20 flex flex-col justify-start lg:justify-center relative z-10 lg:overflow-y-auto lg:max-h-screen">
        {/* Navigation/Brand */}
        <div className="absolute top-10 left-10 lg:left-20 flex items-center gap-3 group cursor-pointer">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/20 group-hover:rotate-12 transition-all duration-300">
            <Layers className="text-white size-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white">Expert Note</span>
            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Knowledge OS</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className={`mt-20 lg:mt-16 max-w-2xl transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-medium mb-8 backdrop-blur-md">
            <Sparkles className="size-3.5 mr-2 text-indigo-400" />
            {t('landing.tagline')}
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-8 tracking-tighter">
            <span className="block">{t('landing.headline1')}.</span>
            <span className="block">{t('landing.headline2')}.</span>
            <span className="block text-indigo-500">{t('landing.headline3')}.</span>
          </h1>

          <p className="text-lg lg:text-xl text-slate-400 leading-relaxed mb-12 max-w-xl">
            {t('landing.subheadline')}
          </p>

          {/* 4-Step Pipeline Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            <PipelineCard
              icon={<FileText className="text-blue-400" />}
              step="01"
              title={t('landing.step1Title')}
              desc={t('landing.step1Desc')}
              delay="0"
            />
            <PipelineCard
              icon={<ShieldCheck className="text-red-400" />}
              step="02"
              title={t('landing.step2Title')}
              desc={t('landing.step2Desc')}
              highlight="macro"
              delay="100"
            />
            <PipelineCard
              icon={<Cpu className="text-emerald-400" />}
              step="03"
              title={t('landing.step3Title')}
              desc={t('landing.step3Desc')}
              delay="200"
            />
            <PipelineCard
              icon={<Filter className="text-amber-400" />}
              step="04"
              title={t('landing.step4Title')}
              desc={t('landing.step4Desc')}
              delay="300"
            />
          </div>
        </div>
      </div>

      {/* Right Column: Login UI */}
      <div className="w-full lg:w-[42%] p-6 lg:p-0 flex items-center justify-center bg-white/[0.02] backdrop-blur-3xl relative z-10 border-l border-white/5 lg:min-h-screen lg:sticky lg:top-0">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="absolute top-10 right-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-xs text-slate-300 font-medium z-20 group"
        >
          <Globe className="size-4 group-hover:rotate-180 transition-transform duration-500" />
          {language === 'zh' ? 'English' : '中文'}
        </button>

        {/* Login Card */}
        <div className={`w-full max-w-md bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative transition-all duration-1000 delay-300 ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {/* Subtle Corner Accents */}
          <div className="absolute top-0 right-0 p-4">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>

          <div className="mb-10 text-center">
            <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">{t('landing.loginTitle')}</h2>
            <p className="text-slate-400 text-sm font-medium">{t('landing.loginSub')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-4">
                {t('landing.usernameOrEmail')}
              </label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all text-white placeholder:text-slate-700"
                  placeholder="name@expert.com"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-4">
                {t('auth.password')}
              </label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-12 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all text-white placeholder:text-slate-700"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 mt-4"
            >
              <span className="relative z-10">{loading ? t('auth.signingIn') : t('landing.startThinking')}</span>
              {!loading && <ArrowRight className="relative z-10 size-5 group-hover:translate-x-1 transition-transform" />}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </form>

          {/* Registration Section */}
          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
            <Link
              href="/register"
              className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-all hover:-translate-y-0.5 text-center leading-relaxed"
            >
              {t('auth.dontHaveAccount')} {t('auth.registerWithCode')}
            </Link>

            <div className="flex items-center gap-4">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-slate-700"></div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02]">
                <div className="flex -space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-slate-500">{t('landing.wisdomEngine')}</span>
              </div>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-slate-700"></div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float-particle {
          0% { transform: translate(0, 0); opacity: 0; }
          20% { opacity: 0.5; }
          80% { opacity: 0.5; }
          100% { transform: translate(40vw, -20vh); opacity: 0; }
        }
        .animate-float-particle {
          animation: float-particle linear infinite;
        }

        @keyframes reveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-reveal {
          animation: reveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}
