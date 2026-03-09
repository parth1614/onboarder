import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { supabase } from '../lib/supabase';
import {
  Zap, Plus, FileText, LogOut, ExternalLink,
  Copy, Settings,
  Search, Filter, Globe, Activity,
  Database as DatabaseIcon
} from 'lucide-react';
import type { Database as DBTypes } from '../lib/database.types';

type Form = DBTypes['public']['Tables']['forms']['Row'];

interface FormWithStats extends Form {
  response_count?: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadForms(); }, [user]);

  const loadForms = async () => {
    if (!user) return;
    try {
      const { data: formsData, error: formsError } = await supabase
        .from('forms').select('*').eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (formsError) throw formsError;
      const formsWithStats = await Promise.all(
        ((formsData as any[]) || []).map(async (form: any) => {
          const { count } = await supabase.from('responses')
            .select('*', { count: 'exact', head: true }).eq('form_id', form.id);
          return { ...form, response_count: count || 0 };
        })
      );
      setForms(formsWithStats as FormWithStats[]);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const copyFormLink = (formId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/form/${formId}`);
    setCopiedId(formId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalResponses = forms.reduce((sum, f) => sum + (f.response_count || 0), 0);
  const publishedForms = forms.filter(f => f.is_published).length;

  const filteredForms = forms.filter(f =>
    f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-canvas text-ink-primary flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-[0.03] z-0" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0 opacity-40" />

      {/* ── Fixed Navigation (80px) ── */}
      <nav
        className="relative z-50 border-b border-line bg-canvas/90 backdrop-blur-3xl sticky top-0 flex items-center shadow-2xl"
        style={{ height: '80px', minHeight: '80px' }}
      >
        <div className="max-w-[1500px] mx-auto w-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/landing')}>
              <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center transition-all group-hover:scale-110 shadow-xl shadow-amber-500/30">
                <Zap className="w-6 h-6 text-black" fill="black" />
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase italic">bishopAI</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 h-12 px-2 bg-canvas-elevated/40 rounded-2xl border border-line">
              <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-xl text-[11px] font-black tracking-[0.2em] bg-amber-500 text-black shadow-lg shadow-amber-500/10 transition-all uppercase">Dashboard</button>
              <button className="px-6 py-2.5 rounded-xl text-[11px] font-black text-ink-tertiary hover:text-ink-primary transition-colors uppercase tracking-[0.2em]">Templates</button>
              <button className="px-6 py-2.5 rounded-xl text-[11px] font-black text-ink-tertiary hover:text-ink-primary transition-colors uppercase tracking-[0.2em]">Settings</button>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden sm:flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/80">Active Session</span>
              </div>
              <span className="text-xs font-bold text-ink-secondary opacity-70">{user?.email}</span>
            </div>
            <div className="w-px h-10 bg-line/50" />
            <button onClick={handleSignOut} className="w-12 h-12 rounded-2xl bg-canvas-secondary border border-line flex items-center justify-center text-ink-tertiary hover:text-danger hover:bg-danger/10 transition-all shadow-xl group border-line-strong hover:scale-105">
              <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-[1400px] mx-auto w-full px-6 py-10 flex-1">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-slide-up">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[9px] font-bold text-amber-500 uppercase tracking-wider backdrop-blur-sm">
                Form Management
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight leading-tight mb-2">Dashboard</h1>
              <p className="text-sm text-ink-secondary font-medium max-w-2xl">
                Manage your <span className="text-ink-primary font-semibold">{forms.length} active forms</span> and track client responses
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/create?type=agency')}
            className="btn-primary gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Form
          </button>
        </div>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {[
            { label: 'Total Forms', value: forms.length, sub: 'Created forms', icon: Globe },
            { label: 'Live Forms', value: publishedForms, sub: 'Active links', icon: Activity },
            { label: 'Submissions', value: totalResponses, sub: 'Responses', icon: DatabaseIcon },
          ].map((s) => (
            <div key={s.label} className="group relative">
              <div className="card-premium h-full bg-canvas-secondary/50 backdrop-blur-xl p-5 rounded-2xl border border-line group-hover:border-amber-500/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-canvas-elevated border border-line flex items-center justify-center group-hover:border-amber-500/20 transition-all">
                    <s.icon className="w-5 h-5 text-ink-tertiary group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink-muted mb-2">{s.label}</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-ink-primary tracking-tight tabular-nums">{s.value}</span>
                </div>
                <p className="text-[10px] font-medium text-ink-tertiary">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form Management */}
        <div className="flex flex-col lg:flex-row gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {/* Main Feed */}
          <div className="flex-1 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-4">
                <h2 className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">My Forms</h2>
                <div className="h-4 w-px bg-line/60" />
                <div className="relative group w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
                  <input
                    type="text"
                    placeholder="Search forms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-base pl-10 pr-4 py-2 text-sm w-full"
                  />
                </div>
              </div>
              <button className="btn-secondary text-xs gap-2">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 card-premium bg-canvas-secondary/10 border-dashed border-2 rounded-2xl">
                <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-sm font-bold uppercase tracking-wider text-ink-tertiary">Loading...</p>
              </div>
            ) : forms.length === 0 ? (
              <div className="card-premium p-12 text-center flex flex-col items-center bg-canvas-secondary/30 backdrop-blur-xl rounded-2xl">
                <div className="w-16 h-16 rounded-xl bg-canvas-elevated border border-line flex items-center justify-center mb-6">
                  <Plus className="w-8 h-8 text-ink-tertiary" />
                </div>
                <h3 className="text-2xl font-bold text-ink-primary mb-3">No forms yet</h3>
                <p className="text-sm text-ink-secondary mb-8 max-w-md">
                  Create your first AI-powered form to start collecting client data.
                </p>
                <button onClick={() => navigate('/create?type=agency')} className="btn-primary gap-2">
                  <Zap className="w-4 h-4" /> Create First Form
                </button>
              </div>
            ) : (
              <div className="grid gap-5">
                {filteredForms.map((form) => (
                  <div key={form.id} className="group relative">
                    <div className="card-premium p-5 transition-all duration-300 bg-canvas-secondary/50 hover:bg-canvas-secondary/80 border-line hover:border-amber-500/30 rounded-xl">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-canvas-elevated border border-line flex items-center justify-center shrink-0 group-hover:border-amber-500/40 transition-all">
                            <FileText className="w-6 h-6 text-ink-tertiary group-hover:text-amber-500 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-ink-primary truncate">{form.title}</h3>
                              {form.is_published && (
                                <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 uppercase tracking-wide flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Live
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="px-2 py-1 rounded-lg bg-canvas-elevated border border-line text-[9px] font-bold text-ink-secondary uppercase tracking-wide">
                                {form.form_type === 'agency' ? 'Agency' : 'Business'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between lg:justify-start gap-6 lg:pl-6 lg:border-l border-line/40 shrink-0">
                          <div className="text-center min-w-[80px]">
                            <p className="text-2xl font-bold text-ink-primary tabular-nums">{form.response_count}</p>
                            <p className="text-[9px] font-medium uppercase tracking-wide text-ink-muted">Responses</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/form/${form.id}/responses`)}
                              className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all"
                              title="View Responses"
                            >
                              <Activity className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => navigate(`/form/${form.id}/edit`)}
                              className="w-10 h-10 rounded-lg bg-canvas-elevated border border-line flex items-center justify-center text-ink-tertiary hover:text-ink-primary hover:border-amber-500/30 transition-all hover:scale-105 active:scale-95"
                              title="Edit Form"
                            >
                              <Settings className="w-5 h-5" />
                            </button>
                            {form.is_published && (
                              <button
                                onClick={() => copyFormLink(form.id)}
                                className="w-10 h-10 rounded-lg bg-canvas-elevated border border-line flex items-center justify-center text-ink-tertiary hover:text-amber-500 hover:border-amber-500/30 transition-all hover:scale-105 active:scale-95"
                                title="Copy Link"
                              >
                                {copiedId === form.id
                                  ? <ExternalLink className="w-5 h-5 text-emerald-500" />
                                  : <Copy className="w-5 h-5" />
                                }
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="lg:w-80 space-y-5">
            <div className="card-premium p-5 bg-amber-500/5 backdrop-blur-xl border-amber-500/20 rounded-xl relative overflow-hidden">
              <h4 className="text-[9px] font-bold uppercase tracking-wider text-amber-500 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Performance
              </h4>
              <p className="text-sm font-medium text-ink-secondary leading-relaxed mb-4">
                Your forms are performing well. Submission rates trending up.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wide text-ink-muted">
                  <span>Overall</span>
                  <span className="text-amber-500">94%</span>
                </div>
                <div className="w-full h-1.5 bg-canvas-elevated border border-line rounded-full overflow-hidden">
                  <div className="w-[94%] h-full bg-amber-500" />
                </div>
              </div>
            </div>

            <div className="card-premium p-5 bg-canvas-secondary/50 backdrop-blur-xl rounded-xl border-line">
              <h4 className="text-[9px] font-bold uppercase tracking-wider text-ink-muted mb-5">Capabilities</h4>
              <div className="space-y-4">
                {[
                  { title: "Smart Analysis", desc: "Website crawling", icon: "AI" },
                  { title: "AI Generation", desc: "Custom questions", icon: "GEN" },
                  { title: "Analytics", desc: "Real-time tracking", icon: "TRK" }
                ].map((p, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-canvas-elevated border border-line flex items-center justify-center text-[8px] font-bold text-amber-500/60 shrink-0">
                      {p.icon}
                    </div>
                    <div className="space-y-0.5 py-0.5">
                      <p className="text-xs font-bold text-ink-primary">{p.title}</p>
                      <p className="text-[9px] font-medium text-ink-tertiary">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 border border-line/30 rounded-xl bg-canvas-elevated/20">
              <div className="flex items-center gap-2 text-[9px] font-bold text-ink-muted uppercase tracking-wide">
                <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> System Live
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center mt-16 border-t border-line/10">
        <p className="text-[9px] font-medium uppercase tracking-wider text-ink-muted/50">bishopAI © 2024</p>
      </footer>
    </div>
  );
}
