import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../hooks/useNavigate';
import { Zap, ArrowRight, Eye, EyeOff, Sparkles, Building2, LayoutDashboard, Database } from 'lucide-react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-primary flex overflow-hidden">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-16 bg-canvas-secondary border-r border-line overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid pointer-events-none opacity-40" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[80%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-[-5%] right-[-5%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4 animate-slide-up group cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/20 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-black" fill="black" />
          </div>
          <span className="text-2xl font-extrabold tracking-tighter">bishopAI</span>
        </div>

        {/* Value prop content */}
        <div className="relative z-10 max-w-sm">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm font-bold text-amber-500 mb-12 shadow-lg shadow-amber-500/10 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            Empowering modern agencies
          </div>
          <h2 className="text-5xl font-extrabold text-ink-primary leading-[1.1] tracking-tight mb-8">
            Turn your website into a <br />
            <span className="text-gradient-amber">lead machine</span>
          </h2>
          <p className="text-xl text-ink-secondary leading-relaxed font-light mb-12">
            Automate your intake process and focus on what matters: delivering world-class results.
          </p>

          <div className="space-y-6">
            {[
              { icon: Building2, label: 'Custom Agency Integration' },
              { icon: LayoutDashboard, label: 'Unified Client Dashboard' },
              { icon: Database, label: 'Structured AI Analysis' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-line animate-slide-up" style={{ animationDelay: `${0.1 * (i + 1)}s` }}>
                <div className="w-10 h-10 rounded-xl bg-canvas-elevated border border-line flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-ink-tertiary" />
                </div>
                <span className="text-base font-medium text-ink-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats footer */}
        <div className="relative z-10 flex items-center gap-12 text-ink-tertiary">
          <div>
            <p className="text-3xl font-extrabold text-ink-primary">12k+</p>
            <p className="text-xs uppercase tracking-widest font-bold opacity-60">Forms Built</p>
          </div>
          <div className="w-px h-8 bg-line" />
          <div>
            <p className="text-3xl font-extrabold text-ink-primary">99.9%</p>
            <p className="text-xs uppercase tracking-widest font-bold opacity-60">Uptime Rate</p>
          </div>
        </div>
      </div>

      {/* ── Right auth panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-20 relative bg-canvas">
        {/* Mobile background elements */}
        <div className="lg:hidden absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="lg:hidden absolute inset-0 bg-radial-glow opacity-60 pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-slide-up">
          {/* Mobile logo only */}
          <div className="lg:hidden flex items-center gap-4 mb-16 animate-slide-up group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-black" fill="black" />
            </div>
            <span className="text-2xl font-extrabold tracking-tighter text-ink-primary">bishopAI</span>
          </div>

          <div className="mb-12">
            <h1 className="text-4xl font-extrabold text-ink-primary tracking-tight mb-4">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-lg text-ink-secondary font-medium">
              {isSignUp
                ? 'Join thousands of high-perfoming agencies today.'
                : 'Sign in to manage your AI onboarding forms.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-sm shadow-xl shadow-amber-500/5 text-ink-primary">
                <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold tracking-wide uppercase text-ink-tertiary">
                Business Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-base"
                placeholder="CEO@youragency.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold tracking-wide uppercase text-ink-tertiary">
                Workspace Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input-base pr-14"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-primary transition-colors p-2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg mt-6 shadow-xl shadow-amber-500/10"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Authenticating…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-base text-ink-tertiary">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-amber-500 font-bold hover:underline transition-all"
            >
              {isSignUp ? 'Sign in' : 'Create account'}
            </button>
          </p>

          <div className="mt-16 flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all cursor-default">
            {/* Logo placeholders for social proof */}
            <div className="text-xs font-bold uppercase tracking-widest text-ink-tertiary">Trusted by agencies at</div>
            <div className="flex gap-6">
              <span className="font-extrabold text-sm translate-y-[2px]">STRIPE</span>
              <span className="font-extrabold text-sm translate-y-[2px]">VERCEL</span>
              <span className="font-extrabold text-sm translate-y-[2px]">LINEAR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
