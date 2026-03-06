import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, Mail, Eye, Download, Users, Zap, ExternalLink, BarChart3, Database as DatabaseIcon, ChevronRight, Search, Activity, RefreshCcw } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Form = Database['public']['Tables']['forms']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];
type Response = Database['public']['Tables']['responses']['Row'];
type Answer = Database['public']['Tables']['answers']['Row'];

interface ResponseWithAnswers extends Response {
  answers: (Answer & { question: Question })[];
}

export default function Responses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const formId = window.location.pathname.split('/')[2];

  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<ResponseWithAnswers[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<ResponseWithAnswers | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadData(); }, [formId, user]);

  const loadData = async () => {
    if (!user || !formId) return;
    try {
      const { data: formData, error: fErr } = await supabase
        .from('forms').select('*').eq('id', formId).eq('owner_id', user.id).single();
      if (fErr) throw fErr;
      setForm(formData);
      const { data: qData } = await supabase.from('questions').select('*').eq('form_id', formId)
        .order('order_index', { ascending: true });
      setQuestions(qData || []);
      const { data: rData } = await supabase.from('responses').select('*').eq('form_id', formId)
        .order('submitted_at', { ascending: false });
      const rWithAnswers = await Promise.all(
        (rData || []).map(async (r) => {
          const { data: aData } = await supabase.from('answers')
            .select('*, question:questions(*)').eq('response_id', r.id);
          return { ...r, answers: aData as any || [] };
        })
      );
      setResponses(rWithAnswers);
    } catch { navigate('/dashboard'); }
    finally { setLoading(false); }
  };

  const exportToCSV = () => {
    if (!responses.length) return;
    const headers = ['Submitted At', 'Email', ...questions.map(q => q.question_text)];
    const rows = responses.map(r => {
      const row = [new Date(r.submitted_at).toLocaleString(), r.respondent_email || 'N/A'];
      questions.forEach(q => row.push(r.answers.find(a => a.question_id === q.id)?.answer_text || ''));
      return row;
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${form?.title || 'form'}-intelligence-report.csv`;
    a.click();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const getInitials = (email: string | null) =>
    email ? email.split('@')[0].slice(0, 2).toUpperCase() : 'IQ';

  const filteredResponses = responses.filter(r =>
    (r.respondent_email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-8 gap-8 animate-fade-in relative overflow-hidden">
        <div className="fixed inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-ink-tertiary">Accessing Intelligence Datashards…</p>
      </div>
    );
  }
  if (!form) return null;

  return (
    <div className="min-h-screen bg-canvas text-ink-primary flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />

      {/* ── Navigation ── */}
      <nav className="relative z-50 border-b border-line bg-canvas/60 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost flex items-center gap-2 -ml-2 text-sm font-semibold hover:text-ink-primary">
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Workspace
            </button>
            <div className="hidden sm:flex items-center gap-4">
              <div className="w-px h-6 bg-line" />
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold tracking-tight text-ink-secondary truncate max-w-[300px]">{form.title}</span>
                <span className="badge-amber px-2 py-0.5 scale-75 uppercase text-[10px] font-black">Datashards</span>
              </div>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!responses.length}
            className="btn-primary px-5 py-2 gap-2 text-xs font-extrabold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-amber-500/10"
          >
            <Download className="w-4 h-4" />
            Export Intel
          </button>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-12">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 animate-slide-up">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber-500" />
              </div>
              <h1 className="text-4xl font-extrabold text-ink-primary tracking-tighter">Portal Intelligence Feed</h1>
            </div>
            <p className="text-base text-ink-secondary font-medium">Monitoring <span className="text-ink-primary font-bold">{responses.length} client submissions</span> for this identity.</p>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted group-focus-within:text-amber-500 transition-colors" />
            <input
              type="text"
              placeholder="Filter by respondent ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base pl-12 py-3 text-sm font-bold bg-canvas-secondary/50 focus:bg-canvas-secondary"
            />
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 animate-fade-in relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
              <BarChart3 className="w-64 h-64" />
            </div>
            <div className="w-20 h-20 rounded-3xl bg-canvas-elevated border border-line flex items-center justify-center mx-auto mb-10 shadow-3xl">
              <Mail className="w-10 h-10 text-ink-tertiary" />
            </div>
            <h3 className="text-2xl font-bold text-ink-primary mb-3 tracking-tight">No feed activity detected</h3>
            <p className="text-base text-ink-secondary mb-12 max-w-sm mx-auto">
              The public intelligence tunnel is live, but no datashards have been committed yet.
            </p>
            {form.is_published && (
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/form/${formId}`)}
                className="btn-secondary px-8 py-3.5 gap-3 text-base shadow-2xl"
              >
                <Zap className="w-5 h-5 text-amber-500" fill="currentColor" /> Copy Tunnel Access Link
              </button>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 flex-1 animate-fade-in min-h-0">
            {/* Shard list */}
            <div className="lg:col-span-12 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted mb-4 flex items-center gap-2">
                <DatabaseIcon className="w-3 h-3" />
                Commit History
              </h4>
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pb-10">
                  {filteredResponses.map((response, idx) => (
                    <button
                      key={response.id}
                      onClick={() => setSelectedResponse(response)}
                      className={`group w-full text-left rounded-[1.25rem] border-2 p-6 transition-all duration-300 relative overflow-hidden ${selectedResponse?.id === response.id
                        ? 'border-amber-500/40 bg-amber-500/10 shadow-xl shadow-amber-500/5'
                        : 'border-line bg-canvas-secondary/50 hover:bg-canvas-secondary hover:border-line-strong'
                        } animate-slide-up`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="flex items-center gap-6 relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 transition-transform ${selectedResponse?.id === response.id
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                          : 'bg-canvas-elevated border border-line text-ink-tertiary group-hover:scale-105'
                          }`}>
                          {getInitials(response.respondent_email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xl font-extrabold text-ink-primary truncate tracking-tight mb-1">
                            {response.respondent_email || `Shard ID #${response.id.slice(0, 8)}`}
                          </p>
                          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">
                            <div className="flex items-center gap-1.5">
                              <Calendar className={`w-3 h-3 ${selectedResponse?.id === response.id ? 'text-amber-500' : ''}`} />
                              <span>{formatDate(response.submitted_at)}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-line" />
                            <span className={selectedResponse?.id === response.id ? 'text-amber-500' : 'text-ink-muted'}>Commit Verified</span>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 shrink-0 transition-transform ${selectedResponse?.id === response.id ? 'text-amber-500 translate-x-1' : 'text-ink-muted group-hover:translate-x-1'
                          }`} />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="h-full flex flex-col">
                  {selectedResponse ? (
                    <div className="card-premium h-full flex flex-col overflow-hidden animate-slide-up bg-canvas-secondary/40 backdrop-blur-3xl shadow-3xl">
                      <div className="p-10 border-b border-line/40 bg-canvas-elevated/20">
                        <div className="flex items-center gap-8">
                          <div className="w-20 h-20 rounded-[2rem] bg-amber-500 flex items-center justify-center text-2xl font-black text-black shadow-2xl">
                            {getInitials(selectedResponse.respondent_email)}
                          </div>
                          <div className="flex-1">
                            <div className="badge-premium badge-amber text-[10px] py-0.5 scale-75 uppercase tracking-widest mb-3">Validated Intelligence</div>
                            <h3 className="text-3xl font-extrabold text-ink-primary tracking-tighter mb-2">
                              {selectedResponse.respondent_email || 'Anonymous Respondent'}
                            </h3>
                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-ink-tertiary">
                              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Commit: {formatDate(selectedResponse.submitted_at)}</span>
                              <span className="opacity-30">|</span>
                              <span className="flex items-center gap-1.5 text-emerald-500"><Zap className="w-3.5 h-3.5" fill="currentColor" /> Priority Sync Active</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar pb-32">
                        {questions.map((question, i) => {
                          const answer = selectedResponse.answers.find(a => a.question_id === question.id);
                          return (
                            <div key={question.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                              <div className="flex items-start gap-4 mb-3">
                                <div className="w-6 h-6 rounded-lg bg-canvas-elevated border border-line flex items-center justify-center text-[10px] font-black font-mono text-ink-tertiary">Q{i + 1}</div>
                                <p className="text-xs font-black text-ink-muted uppercase tracking-[0.15em] pt-1">
                                  {question.question_text}
                                </p>
                              </div>
                              <div className="bg-canvas-elevated/30 rounded-2xl px-8 py-6 border border-line/40 group hover:border-amber-500/20 transition-all">
                                <p className="text-lg font-medium text-ink-primary leading-relaxed whitespace-pre-wrap">
                                  {answer?.answer_text || <span className="text-ink-muted italic opacity-30">Intelligence void: no data committed for this probe protocol.</span>}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-8 border-t border-line/40 bg-canvas-secondary flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary flex items-center gap-2">
                          <RefreshCcw className="w-3 h-3 text-emerald-500" />
                          Synced with central database
                        </span>
                        <button
                          className="btn-ghost px-4 py-2 scale-90 gap-2 text-[10px] font-black uppercase tracking-widest"
                          onClick={() => setSelectedResponse(null)}
                        >
                          Close Portal Shard
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="card-premium h-full min-h-[500px] flex flex-col items-center justify-center p-20 text-center border-dashed border-2 opacity-60">
                      <div className="w-24 h-24 rounded-[2.5rem] bg-canvas-elevated border-2 border-line/40 flex items-center justify-center mb-10 shadow-2xl">
                        <Activity className="w-10 h-10 text-ink-tertiary opacity-30" />
                      </div>
                      <h4 className="text-xl font-bold text-ink-primary mb-3">Awaiting Shard Selection</h4>
                      <p className="text-base text-ink-tertiary max-w-xs leading-relaxed">
                        Access the portal commit history on the left to inspect detailed intelligence datashards.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
