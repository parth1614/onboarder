import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { supabase } from '../lib/supabase';
import { Zap, Plus, FileText, BarChart3, LogOut, ExternalLink, Copy, ChevronRight, LayoutDashboard, Settings } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Form = Database['public']['Tables']['forms']['Row'];

interface FormWithStats extends Form {
  response_count?: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { loadForms(); }, [user]);

  const loadForms = async () => {
    if (!user) return;
    try {
      const { data: formsData, error: formsError } = await supabase
        .from('forms').select('*').eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (formsError) throw formsError;
      const formsWithStats = await Promise.all(
        (formsData || []).map(async (form) => {
          const { count } = await supabase.from('responses')
            .select('*', { count: 'exact', head: true }).eq('form_id', form.id);
          return { ...form, response_count: count || 0 };
        })
      );
      setForms(formsWithStats);
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

  return (
    <div className="min-h-screen bg-canvas text-ink-primary">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40 z-0" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />

      {/* ── Navigation ── */}
      <nav className="relative z-50 border-b border-line bg-canvas/60 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/landing')}>
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center transition-transform group-hover:scale-110">
              <Zap className="w-5 h-5 text-black" fill="black" />
            </div>
            <span className="text-xl font-bold tracking-tight">bishopAI</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:block text-sm font-medium text-ink-tertiary">{user?.email}</span>
            <button onClick={handleSignOut} className="btn-ghost flex items-center gap-2 px-3 py-1.5 hover:text-danger">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-amber-500" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Project Overview</h1>
            </div>
            <p className="text-base text-ink-secondary">You have <span className="text-ink-primary font-semibold">{forms.length} active forms</span> in your workspace.</p>
          </div>
          <button onClick={() => navigate('/landing')} className="btn-primary gap-2">
            <Plus className="w-5 h-5" />
            New form
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Forms', value: forms.length, sub: 'All created forms' },
            { label: 'Published', value: publishedForms, sub: 'Currently live' },
            { label: 'Responses', value: totalResponses, sub: 'All form completions' },
          ].map((s) => (
            <div key={s.label} className="card-premium p-8 relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="w-12 h-12" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-ink-tertiary mb-3">{s.label}</p>
              <p className="text-5xl font-extrabold text-ink-primary mb-2 tracking-tighter">{s.value}</p>
              <p className="text-sm text-ink-muted">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Forms Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xs font-bold text-ink-tertiary uppercase tracking-widest">Workspace Forms</h2>
          <div className="flex items-center gap-2 text-xs font-medium text-ink-tertiary">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live sync enabled
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 bg-canvas-secondary border border-line rounded-3xl">
            <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-base font-medium text-ink-tertiary">Synchronizing workspace data…</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="card-premium p-20 text-center animate-fade-in flex flex-col items-center max-w-4xl mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-canvas-elevated border border-line flex items-center justify-center mb-8 shadow-2xl">
              <FileText className="w-10 h-10 text-ink-tertiary" />
            </div>
            <h3 className="text-2xl font-bold text-ink-primary mb-3 tracking-tight">No forms in workspace</h3>
            <p className="text-lg text-ink-secondary mb-10 max-w-md">
              Create your first AI-powered onboarding form to start collecting client data.
            </p>
            <button onClick={() => navigate('/landing')} className="btn-primary px-10 py-3.5 gap-2 text-base">
              <Plus className="w-5 h-5" />
              Build my first form
            </button>
          </div>
        ) : (
          <div className="grid gap-3 animate-fade-in">
            {forms.map((form) => (
              <div key={form.id} className="card-premium p-6 group hover:scale-[1.005] transition-transform">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-canvas-elevated border border-line flex items-center justify-center shrink-0 group-hover:border-amber-500/30 transition-all shadow-inner">
                    <FileText className="w-7 h-7 text-ink-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-1.5">
                      <h3 className="text-xl font-bold text-ink-primary truncate tracking-tight">{form.title}</h3>
                      <div className="flex gap-2">
                        {form.form_type === 'agency' ? (
                          <span className="badge-amber">Agency</span>
                        ) : (
                          <span className="badge-neutral">Customer</span>
                        )}
                        {form.is_published && <span className="badge-success">Live</span>}
                      </div>
                    </div>
                    {form.description ? (
                      <p className="text-base text-ink-tertiary truncate max-w-xl">{form.description}</p>
                    ) : (
                      <p className="text-base text-ink-muted italic">No description provided</p>
                    )}
                  </div>

                  <div className="hidden lg:flex items-center gap-6 px-12 border-x border-line/50 shrink-0">
                    <div className="text-center min-w-[80px]">
                      <p className="text-2xl font-bold text-ink-primary">{form.response_count}</p>
                      <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">Responses</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => navigate(`/form/${form.id}/edit`)}
                      className="btn-secondary px-5 py-2.5 shadow-sm"
                    >
                      Configure
                    </button>
                    <button
                      onClick={() => navigate(`/form/${form.id}/responses`)}
                      className="btn-secondary px-5 py-2.5 group/btn"
                    >
                      Responses
                      <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                    {form.is_published && (
                      <button
                        onClick={() => copyFormLink(form.id)}
                        className="w-11 h-11 rounded-xl bg-canvas-elevated border border-line flex items-center justify-center text-ink-tertiary hover:text-amber-500 hover:border-amber-500/30 transition-all shadow-sm"
                        title="Copy public link"
                      >
                        {copiedId === form.id
                          ? <ExternalLink className="w-5 h-5 text-amber-500" />
                          : <Copy className="w-5 h-5" />
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
