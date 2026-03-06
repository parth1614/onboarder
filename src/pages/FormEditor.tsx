import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Eye, Plus, Trash2, Check, ExternalLink, Zap, ChevronUp, ChevronDown, Wand2, Settings, Sparkles, LayoutDashboard, Database as DatabaseIcon } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Form = Database['public']['Tables']['forms']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

const QUESTION_TYPES = [
  { value: 'text', label: 'Short text input' },
  { value: 'textarea', label: 'Long textarea input' },
  { value: 'email', label: 'Email validation' },
  { value: 'phone', label: 'Phone validation' },
  { value: 'number', label: 'Numerical input' },
  { value: 'select', label: 'Multiple choice dropdown' },
];

export default function FormEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const formId = window.location.pathname.split('/')[2];

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadForm(); }, [formId, user]);

  const loadForm = async () => {
    if (!user || !formId) return;
    try {
      const { data: formData, error: formError } = await supabase
        .from('forms').select('*').eq('id', formId).eq('owner_id', user.id).single();
      if (formError) throw formError;
      setForm(formData);
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions').select('*').eq('form_id', formId)
        .order('order_index', { ascending: true });
      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error loading form:', error);
      navigate('/dashboard');
    } finally { setLoading(false); }
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      id: `temp-${Date.now()}`,
      form_id: formId,
      question_text: 'New Question',
      question_type: 'text',
      is_required: true,
      order_index: questions.length,
      options: null,
      created_at: new Date().toISOString(),
    }]);
  };

  const deleteQuestion = (id: string) => setQuestions(prev => prev.filter(q => q.id !== id));

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQs = [...questions];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newQs.length) return;
    [newQs[index], newQs[target]] = [newQs[target], newQs[index]];
    newQs.forEach((q, i) => { q.order_index = i; });
    setQuestions(newQs);
  };

  const saveForm = async () => {
    if (!form) return;
    setSaving(true);
    setSaveMessage('');
    try {
      await supabase.from('questions').delete().eq('form_id', formId);
      await (supabase.from('questions').insert(questions.map((q, i) => ({
        form_id: formId,
        question_text: q.question_text,
        question_type: q.question_type,
        is_required: q.is_required,
        order_index: i,
        options: q.options,
      }))) as any);
      setSaveMessage('Form Saved Successfully');
      setTimeout(() => setSaveMessage(''), 3000);
      await loadForm();
    } catch (error) {
      setSaveMessage('Save Error');
    } finally { setSaving(false); }
  };

  const publishForm = async () => {
    if (!form) return;
    const { error } = await (supabase.from('forms').update({ is_published: true }).eq('id', formId) as any);
    if (!error) setForm({ ...form, is_published: true });
  };

  const copyFormLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/form/${formId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-6">
        <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-bold uppercase tracking-widest text-ink-tertiary">Loading Form Editor…</p>
      </div>
    );
  }
  if (!form) return null;

  return (
    <div className="min-h-screen bg-canvas text-ink-primary">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-20 z-0" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0 opacity-40" />

      {/* ── Navigation (80px) ── */}
      <nav className="relative z-50 border-b border-line bg-canvas/80 backdrop-blur-3xl sticky top-0" style={{ height: '80px', minHeight: '80px' }}>
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost flex items-center gap-2 -ml-2 text-sm font-semibold hover:text-ink-primary">
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
            <div className="hidden md:flex items-center gap-4">
              <div className="w-px h-6 bg-line" />
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold tracking-tight text-ink-secondary truncate max-w-[200px]">{form.title}</span>
                {form.is_published && <span className="badge-success scale-75">Live</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {saveMessage && (
              <span className={`hidden sm:flex text-[10px] items-center gap-2 font-black uppercase tracking-widest ${saveMessage.includes('Saved') ? 'text-emerald-500' : 'text-danger'} animate-fade-in`}>
                <Check className="w-4 h-4" /> {saveMessage}
              </span>
            )}
            <button onClick={saveForm} disabled={saving} className="btn-secondary px-4 sm:px-5 py-2 group text-xs sm:text-sm">
              <Save className="w-4 h-4 text-ink-tertiary group-hover:text-amber-500" />
              <span className="hidden xs:inline">{saving ? 'Syncing…' : 'Sync'}</span>
            </button>
            {form.is_published ? (
              <button onClick={copyFormLink} className="btn-primary px-4 sm:px-5 py-2 shadow-lg shadow-amber-500/20 text-xs sm:text-sm">
                <ExternalLink className="w-4 h-4" />
                <span className="hidden xs:inline">{copied ? 'Copied!' : 'Share Link'}</span>
              </button>
            ) : (
              <button onClick={publishForm} className="btn-primary px-4 sm:px-5 py-2 shadow-lg shadow-amber-500/20 text-xs sm:text-sm">
                <Eye className="w-4 h-4" />
                <span className="hidden xs:inline">Publish</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Editor Form Header */}
        <div className="mb-16 animate-slide-up bg-canvas-secondary/30 backdrop-blur-md rounded-3xl p-10 border border-line/40">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink-tertiary">Form Branding</h2>
            </div>
            <div className={`badge-premium px-2 py-0.5 scale-75 ${form.is_published ? 'badge-success' : 'badge-neutral'}`}>
              {form.is_published ? 'Live Form' : 'Draft'}
            </div>
          </div>

          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="text-5xl font-extrabold text-ink-primary bg-transparent border-none outline-none w-full mb-6 focus:ring-0 tracking-tighter placeholder:text-ink-muted/30"
            placeholder="Enter Form Title…"
          />
          <textarea
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="text-xl text-ink-secondary bg-transparent border-none outline-none w-full resize-none focus:ring-0 leading-relaxed font-light placeholder:text-ink-muted/30"
            placeholder="Add a friendly description for your clients…"
            rows={2}
          />
        </div>

        {/* Intelligence Probes Section */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-tertiary">Form Questions</h3>
            <div className="w-px h-4 bg-line" />
            <span className="text-xs font-bold text-ink-muted opacity-80">{questions.length} Questions</span>
          </div>
          <button onClick={addQuestion} className="btn-secondary px-4 py-2 scale-90 gap-2">
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        {/* Probes List */}
        <div className="space-y-4 mb-20">
          {questions.map((question, index) => (
            <div key={question.id} className="card-premium p-8 group animate-slide-up relative overflow-hidden" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <DatabaseIcon className="w-16 h-16" />
              </div>

              <div className="flex items-start gap-8 relative z-10">
                {/* Visual probe indexer */}
                <div className="flex flex-col gap-2 pt-1.5 items-center shrink-0">
                  <button
                    onClick={() => moveQuestion(index, 'up')}
                    disabled={index === 0}
                    className="text-ink-tertiary hover:text-amber-500 disabled:opacity-10 transition-colors p-1"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-canvas-elevated border border-line flex items-center justify-center text-xs font-bold font-mono text-ink-primary group-hover:border-amber-500/30">
                    {index + 1}
                  </div>
                  <button
                    onClick={() => moveQuestion(index, 'down')}
                    disabled={index === questions.length - 1}
                    className="text-ink-tertiary hover:text-amber-500 disabled:opacity-10 transition-colors p-1"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Probe Configuration */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Question Text</label>
                    <input
                      type="text"
                      value={question.question_text}
                      onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                      className="input-base px-5 py-3.5 text-lg font-bold tracking-tight bg-canvas-elevated/20 group-hover:bg-canvas-elevated/40"
                      placeholder="Enter the question for your client..."
                    />
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Input Type</label>
                      <select
                        value={question.question_type}
                        onChange={(e) => updateQuestion(question.id, { question_type: e.target.value as Question['question_type'] })}
                        className="input-base py-2.5 px-4 w-[240px] text-sm font-bold bg-canvas-elevated/20"
                      >
                        {QUESTION_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-5">
                      <label className="flex items-center gap-4 cursor-pointer select-none group/toggle">
                        <div
                          className={`relative w-12 h-7 rounded-full transition-all duration-300 border-2 ${question.is_required ? 'bg-amber-500 border-amber-400' : 'bg-canvas-elevated border-line'
                            }`}
                          onClick={() => updateQuestion(question.id, { is_required: !question.is_required })}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 shadow-xl ${question.is_required ? 'translate-x-6 bg-white' : 'translate-x-1 bg-ink-tertiary'
                            }`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-widest text-ink-secondary group-hover/toggle:text-ink-primary">Required Question</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {question.question_type === 'select' && (
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Dropdown Options</label>
                      <textarea
                        value={question.options ? JSON.parse(question.options as string).join('\n') : ''}
                        onChange={(e) => updateQuestion(question.id, {
                          options: JSON.stringify(e.target.value.split('\n').filter(o => o.trim())) as any,
                        })}
                        className="input-base resize-none py-4 px-5 text-sm font-medium leading-relaxed bg-canvas-elevated/20"
                        placeholder="Enter options (one per line)…"
                        rows={4}
                      />
                    </div>
                  )}
                </div>

                {/* Probe Termination */}
                <button
                  onClick={() => deleteQuestion(question.id)}
                  className="text-ink-tertiary hover:text-danger hover:bg-danger/10 p-2.5 rounded-xl transition-all shrink-0 opacity-0 group-hover:opacity-100"
                  title="Terminate Probe"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Append Intelligence Trigger */}
        <button
          onClick={addQuestion}
          className="w-full py-8 border-2 border-dashed border-line/40 rounded-[2.5rem] bg-canvas-secondary/10 text-ink-tertiary hover:border-amber-500/20 hover:text-amber-500 hover:bg-amber-500/5 font-extrabold transition-all duration-300 flex items-center justify-center gap-4 text-lg tracking-widest uppercase mb-12"
        >
          <div className="w-8 h-8 rounded-full bg-canvas-elevated border border-line flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          Add New Question
        </button>

        {/* Finalization Section */}
        <div className="flex flex-col items-center gap-4 py-12 border-t border-line/40">
          <div className="flex items-center gap-3 text-ink-tertiary opacity-40 uppercase tracking-[0.2em] font-bold text-[10px]">
            <Settings className="w-3 h-3 animate-spin duration-[6000ms]" />
            Your form is ready to share
          </div>
          <p className="text-sm text-ink-muted max-w-sm text-center italic opacity-60">
            Publish your form to create a public link that can be shared with your clients.
          </p>
        </div>
      </div>
    </div>
  );
}
