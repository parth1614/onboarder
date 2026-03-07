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

      <div className="relative z-10 max-w-[1500px] mx-auto w-full px-8 py-16 flex-1">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-24 animate-slide-up">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] backdrop-blur-sm">
                Form Management Center
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-line to-transparent min-w-[100px]" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight sm:leading-none mb-6 italic uppercase">Dashboard</h1>
              <p className="text-lg sm:text-2xl text-ink-secondary font-light italic opacity-50 max-w-3xl leading-relaxed">
                Manage your <span className="text-ink-primary font-bold">{forms.length} active onboarding forms</span> and track incoming client data.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/create?type=agency')}
            className="btn-primary py-4 sm:py-6 px-8 sm:px-12 text-xl sm:text-2xl gap-3 sm:gap-5 shadow-3xl group rounded-[2rem] sm:rounded-[3rem] border border-amber-400/20 hover:scale-105 transition-all duration-500 w-full md:w-auto"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-black flex items-center justify-center">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 transition-transform group-hover:rotate-180 duration-700" />
            </div>
            Create New Form
          </button>
        </div>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-32 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {[
            { label: 'Total Forms', value: forms.length, sub: 'Created intake forms', icon: Globe },
            { label: 'Live Forms', value: publishedForms, sub: 'Currently active links', icon: Activity },
            { label: 'Submissions', value: totalResponses, sub: 'Client data captured', icon: DatabaseIcon },
          ].map((s) => (
            <div key={s.label} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-10" />
              <div className="card-premium h-full bg-canvas-secondary/30 backdrop-blur-3xl p-10 rounded-[3rem] border border-line group-hover:border-amber-500/40 transition-all duration-700 shadow-2xl">
                <div className="flex items-center justify-between mb-12">
                  <div className="w-16 h-16 rounded-3xl bg-canvas-elevated border border-line flex items-center justify-center shadow-inner group-hover:scale-110 transition-all group-hover:border-amber-500/20">
                    <s.icon className="w-8 h-8 text-ink-tertiary group-hover:text-amber-500 transition-colors" />
                  </div>
                  <div className="px-3 py-1 bg-canvas-elevated border border-line rounded-xl opacity-20 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-0.5 bg-ink-primary rounded-full mb-1" />
                    <div className="w-5 h-0.5 bg-ink-primary rounded-full" />
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ink-muted mb-3 group-hover:text-amber-500/60 transition-colors">{s.label}</p>
                <div className="flex items-baseline gap-4 mb-3">
                  <span className="text-5xl sm:text-7xl font-black text-ink-primary tracking-tighter uppercase tabular-nums">{s.value}</span>
                  <div className="w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse" />
                </div>
                <p className="text-xs font-bold text-ink-tertiary uppercase tracking-widest opacity-40">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form Management */}
        <div className="flex flex-col lg:flex-row gap-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {/* Main Feed */}
          <div className="flex-1 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4 mb-4">
              <div className="flex items-center gap-8">
                <h2 className="text-[11px] font-black text-ink-muted uppercase tracking-[0.5em]">My Forms</h2>
                <div className="h-8 w-px bg-line/60" />
                <div className="relative group min-w-[320px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-tertiary focus-within:text-amber-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search your forms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-canvas-elevated/30 border border-line/50 rounded-[1.5rem] pl-14 pr-8 py-4 text-base focus:outline-none focus:border-amber-500/40 transition-all w-full font-bold shadow-inner"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="h-12 px-6 rounded-2xl bg-canvas-elevated border border-line flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-ink-tertiary hover:text-ink-primary transition-all shadow-xl">
                  <Filter className="w-4 h-4" /> Filter Forms
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-48 gap-10 card-premium bg-canvas-secondary/10 border-dashed border-2 rounded-[4rem] animate-pulse">
                <div className="w-24 h-24 border-4 border-amber-500/5 border-t-amber-500 rounded-full animate-spin shadow-2xl shadow-amber-500/10" />
                <p className="text-xl font-black uppercase tracking-[0.5em] text-ink-tertiary">Loading Forms...</p>
              </div>
            ) : forms.length === 0 ? (
              <div className="card-premium p-32 text-center flex flex-col items-center max-w-4x mx-auto bg-canvas-secondary/20 backdrop-blur-3xl border-line rounded-[4rem] shadow-3xl">
                <div className="w-32 h-32 rounded-[3.5rem] bg-canvas-elevated border-2 border-line/40 flex items-center justify-center mb-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] group hover:scale-105 transition-all">
                  <Plus className="w-16 h-16 text-ink-tertiary group-hover:text-amber-500 transition-colors duration-500" />
                </div>
                <h3 className="text-5xl font-black text-ink-primary mb-6 tracking-tighter italic">NO FORMS YET</h3>
                <p className="text-2xl text-ink-secondary mb-16 max-w-xl font-light italic opacity-60 leading-relaxed px-10">
                  Create your first AI-powered onboarding form to start collecting client intake data efficiently.
                </p>
                <button onClick={() => navigate('/create?type=agency')} className="btn-primary py-7 px-16 text-2xl gap-6 shadow-3xl rounded-[3rem]">
                  <Zap className="w-8 h-8" fill="currentColor" /> Create First Form
                </button>
              </div>
            ) : (
              <div className="grid gap-10">
                {filteredForms.map((form) => (
                  <div key={form.id} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-3xl -z-10" />
                    <div className="card-premium p-6 sm:p-10 transition-all duration-700 bg-canvas-secondary/40 hover:bg-canvas-secondary/90 border-line hover:border-amber-500/30 rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden group/card hover:scale-[1.01]">
                      <div className="flex flex-col xl:flex-row xl:items-center gap-8 sm:gap-12 relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12 flex-1 min-w-0">
                          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2rem] bg-canvas-elevated border border-line flex items-center justify-center shrink-0 group-hover/card:border-amber-500/40 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.4)] group-hover/card:scale-105 group-hover/card:bg-amber-500/5">
                            <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-ink-tertiary group-hover/card:text-amber-500 transition-colors duration-700" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                              <h3 className="text-2xl sm:text-4xl font-black text-ink-primary truncate tracking-tighter group-hover/card:text-amber-300 transition-colors uppercase italic">{form.title}</h3>
                              {form.is_published && (
                                <div className="self-start sm:self-auto px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                  Live Form
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                              <div className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl bg-canvas-elevated border border-line-strong text-[10px] sm:text-[11px] font-black text-ink-secondary uppercase tracking-widest">
                                <DatabaseIcon className="w-3.5 h-3.5" /> {form.form_type === 'agency' ? 'AGENCY' : 'BUSINESS'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row xl:flex-row items-center justify-between sm:justify-start gap-8 sm:gap-12 sm:pl-12 sm:border-l border-line/40 shrink-0">
                          <div className="text-center min-w-[100px] sm:min-w-[140px] group/shard">
                            <p className="text-4xl sm:text-6xl font-black text-ink-primary tracking-tighter group-hover/shard:text-amber-500 transition-colors tabular-nums">{form.response_count}</p>
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.5em] text-ink-muted opacity-60">Submissions</p>
                          </div>

                          <div className="flex items-center gap-3 sm:gap-5">
                            <button
                              onClick={() => navigate(`/form/${form.id}/responses`)}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] bg-amber-500 flex items-center justify-center text-black shadow-2xl shadow-amber-500/20 hover:scale-110 active:scale-95 transition-all group/btn"
                              title="View Form Responses"
                            >
                              <Activity className="w-6 h-6 sm:w-8 sm:h-8 group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={() => navigate(`/form/${form.id}/edit`)}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] bg-canvas-elevated border border-line-strong flex items-center justify-center text-ink-tertiary hover:text-ink-primary hover:border-amber-500/30 transition-all hover:scale-110 active:scale-95 shadow-xl"
                              title="Edit Form"
                            >
                              <Settings className="w-6 h-6 sm:w-8 sm:h-8" />
                            </button>
                            {form.is_published && (
                              <button
                                onClick={() => copyFormLink(form.id)}
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] bg-canvas-elevated border border-line-strong flex items-center justify-center text-ink-tertiary hover:text-amber-500 hover:border-amber-500/30 transition-all hover:scale-110 active:scale-95 group/copy shadow-xl"
                                title="Copy Form Link"
                              >
                                {copiedId === form.id
                                  ? <ExternalLink className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
                                  : <Copy className="w-6 h-6 sm:w-8 sm:h-8 group-hover/copy:scale-110 transition-transform" />
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
          <div className="lg:w-[400px] space-y-12">
            <div className="card-premium p-10 bg-amber-500/5 backdrop-blur-3xl border-amber-500/20 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                <Zap className="w-64 h-64 text-amber-500" />
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-amber-500 mb-8 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Dashboard Insight
              </h4>
              <p className="text-xl font-light text-ink-secondary leading-relaxed mb-10 italic opacity-80">
                "AI analysis confirms your forms are performing at optimal levels. Submission rates are trending upwards across all active links."
              </p>
              <div className="space-y-4">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.3em] text-ink-muted">
                  <span>Form Performance</span>
                  <span className="text-amber-500">94.2%</span>
                </div>
                <div className="w-full h-2 bg-canvas-elevated border border-line rounded-full overflow-hidden">
                  <div className="w-[94.2%] h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
                </div>
              </div>
            </div>

            <div className="card-premium p-10 bg-canvas-secondary/60 backdrop-blur-3xl rounded-[3.5rem] border-line shadow-2xl">
              <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-ink-muted mb-10">AI System capabilities</h4>
              <div className="space-y-10">
                {[
                  { title: "Smart Analysis", desc: "Automated website deep crawling.", icon: "AI" },
                  { title: "Dynamic Generation", desc: "Tailored question sets per business.", icon: "GEN" },
                  { title: "Analytics Engine", desc: "Real-time submission tracking.", icon: "TRK" }
                ].map((p, i) => (
                  <div key={i} className="flex gap-6 group cursor-default">
                    <div className="w-12 h-12 rounded-2xl bg-canvas-elevated border border-line flex items-center justify-center text-[10px] font-black text-amber-500/60 group-hover:text-amber-500 group-hover:border-amber-500/20 transition-all shrink-0">
                      {p.icon}
                    </div>
                    <div className="space-y-1 py-1">
                      <p className="text-sm font-black text-ink-primary uppercase tracking-[0.2em] group-hover:text-amber-300 transition-colors uppercase">{p.title}</p>
                      <p className="text-[10px] font-bold text-ink-tertiary opacity-50 uppercase tracking-widest">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-10 py-8 border border-line/30 rounded-[2.5rem] bg-canvas-elevated/20 group hover:bg-canvas-elevated/40 transition-all">
              <div className="flex items-center gap-4 text-[10px] font-black text-ink-muted uppercase tracking-[0.5em]">
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> System Operational
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-20 text-center mt-40 border-t border-line/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="flex items-center justify-center gap-10 opacity-40">
            <div className="w-20 h-px bg-gradient-to-r from-transparent to-line" />
            <p className="text-[11px] font-black uppercase tracking-[0.8em] text-ink-muted">bishopAI Form Center // 1.0.0</p>
            <div className="w-20 h-px bg-gradient-to-l from-transparent to-line" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ink-muted/30">Helping businesses scale with intelligent onboarding</p>
        </div>
      </footer>
    </div>
  );
}
