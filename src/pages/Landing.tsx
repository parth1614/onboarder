import { useNavigate } from '../hooks/useNavigate';
import { Building2, Users, Zap, ArrowRight, BarChart3, Globe, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const features = [
  {
    icon: Zap,
    title: 'AI Form Generation',
    desc: 'Paste your URL — AI reads your site and writes the perfect questions instantly.',
  },
  {
    icon: Globe,
    title: 'Smart Analysis',
    desc: 'Understands your industry, ICP, and services to create deeply relevant questions.',
  },
  {
    icon: BarChart3,
    title: 'Response Dashboard',
    desc: 'View, filter, and export client responses. Everything in one place.',
  },
];

const steps = [
  { icon: Globe, title: "Website Analysis", desc: "Our AI deeply crawls your site to understand your services, target audience, and business model." },
  { icon: Sparkles, title: "AI Generation", desc: "Using advanced LLMs, we generate 10-15 highly specific onboarding questions tailored to your needs." },
  { icon: Shield, title: "Ready for Delivery", desc: "A polished, structured onboarding form is ready for your clients in seconds." }
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-canvas text-ink-primary">
      {/* ── Background decoration ── */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40 z-0" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />

      {/* ── Navigation (80px) ── */}
      <nav className="relative z-50 border-b border-line bg-canvas/80 backdrop-blur-3xl sticky top-0" style={{ height: '80px', minHeight: '80px' }}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center transition-transform group-hover:scale-110">
              <Zap className="w-5 h-5 text-black" fill="black" />
            </div>
            <span className="text-xl font-bold tracking-tight">bishopAI</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary px-8 py-3"
            >
              My Forms
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* ── Hero section ── */}
        <section className="max-w-5xl mx-auto px-6 pt-32 pb-24 text-center">
          <div className="animate-slide-up flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-sm font-semibold text-amber-500 mb-10 shadow-lg shadow-amber-500/10 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              NEW: GPT-4o Enhanced Analysis
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold mb-8 leading-[1.1] tracking-tight text-ink-primary px-4">
              Onboarding forms that<br />
              <span className="text-gradient-amber">write themselves</span>
            </h1>

            <p className="text-lg sm:text-xl text-ink-secondary max-w-2xl mx-auto mb-12 leading-relaxed font-light px-6 opacity-80">
              Don't manually craft onboarding questions. Let our AI analyze your website and build high-converting forms in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 px-6 w-full sm:w-auto">
              <button
                onClick={() => navigate('/create?type=agency')}
                className="btn-primary px-10 py-5 text-lg shadow-xl group w-full sm:w-auto"
              >
                Create a form
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary px-10 py-5 text-lg w-full sm:w-auto"
              >
                View dashboard
              </button>
            </div>
          </div>
        </section>

        {/* ── Form choice grid ── */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="mb-8 text-center">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-tertiary">Select your workflow</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div
              onClick={() => navigate('/create?type=agency')}
              className="group card-premium p-8 cursor-pointer hover:border-amber-500/30"
            >
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-canvas-elevated border border-line flex items-center justify-center shrink-0 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 transition-all duration-300">
                  <Building2 className="w-7 h-7 text-ink-secondary group-hover:text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold">Agency intake</h3>
                    <div className="w-8 h-8 rounded-full bg-canvas-elevated border border-line flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                      <ArrowRight className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                  <p className="text-base text-ink-secondary leading-relaxed mb-6">
                    Paste your website URL. AI analyzes your services to generate a tailored onboarding journey.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="badge-amber">AI Website Scan</span>
                    <span className="badge-neutral">10–15 q's</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate('/create?type=customer')}
              className="group card-premium p-8 cursor-pointer hover:border-amber-500/30"
            >
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-canvas-elevated border border-line flex items-center justify-center shrink-0 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 transition-all duration-300">
                  <Users className="w-7 h-7 text-ink-secondary group-hover:text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold">Customer onboarding</h3>
                    <div className="w-8 h-8 rounded-full bg-canvas-elevated border border-line flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                      <ArrowRight className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                  <p className="text-base text-ink-secondary leading-relaxed mb-6">
                    Describe your business profile once and get a reusable intake link for all your clients.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="badge-amber">Reusable Link</span>
                    <span className="badge-neutral">Custom branded</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Steps ── */}
        <section className="bg-canvas-secondary border-y border-line py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="max-w-5xl mx-auto px-6 relative z-10">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold mb-4">The path to automated client intake</h2>
              <p className="text-ink-secondary max-w-xl mx-auto">Skip the manual work. We automated the entire process so you can focus on building relationships.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-canvas-elevated border border-line flex items-center justify-center mb-6 group-hover:border-amber-500/30 transition-colors">
                    <step.icon className="w-8 h-8 text-ink-secondary group-hover:text-amber-500" />
                  </div>
                  <h4 className="text-xl font-bold mb-3">{step.title}</h4>
                  <p className="text-ink-secondary leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features strip ── */}
        <section className="max-w-5xl mx-auto px-6 py-28">
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-amber-500" />
                </div>
                <h4 className="text-lg font-bold">{f.title}</h4>
                <p className="text-base text-ink-tertiary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-line py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-ink-tertiary">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500" fill="currentColor" />
              </div>
              <span className="text-lg font-bold text-ink-secondary">bishopAI</span>
            </div>
            <div className="flex items-center gap-8 text-sm font-medium">
              <a href="#" className="hover:text-ink-primary transition-colors">Product</a>
              <a href="#" className="hover:text-ink-primary transition-colors">Twitter</a>
              <a href="#" className="hover:text-ink-primary transition-colors">Pricing</a>
              <a href="#" className="hover:text-ink-primary transition-colors">Support</a>
            </div>
            <p className="text-xs tracking-widest font-bold uppercase opacity-50">© 2024 BishopAI Corp</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
