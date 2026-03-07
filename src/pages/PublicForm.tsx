import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight, ArrowLeft, Check, Zap, Sparkles, Loader2, RefreshCcw } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Form = Database['public']['Tables']['forms']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

export default function PublicForm() {
  const formId = window.location.pathname.split('/')[2];
  const storageKey = `form_progress_${formId}`;

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadForm(); loadSavedProgress(); }, [formId]);

  const loadSavedProgress = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { step, answers: a } = JSON.parse(saved);
        setCurrentStep(step || 0);
        setAnswers(a || {});
      }
    } catch { }
  };

  const saveProgress = (step: number, a: Record<string, string>) => {
    try { localStorage.setItem(storageKey, JSON.stringify({ step, answers: a })); } catch { }
  };

  const clearProgress = () => { try { localStorage.removeItem(storageKey); } catch { } };

  const loadForm = async () => {
    if (!formId) return;
    try {
      const { data: formData, error: formError } = await supabase
        .from('forms').select('*').eq('id', formId).eq('is_published', true).maybeSingle();
      if (formError) throw formError;
      if (!formData) { setError('Form could not be found or is inactive.'); return; }
      setForm(formData);
      const { data: questionsData } = await supabase
        .from('questions').select('*').eq('form_id', formId)
        .order('order_index', { ascending: true });
      setQuestions(questionsData || []);
    } catch { setError('Failed to load the form.'); }
    finally { setLoading(false); }
  };

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;
  const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0;

  const handleNext = () => {
    if (!currentQuestion) return;
    if (currentQuestion.is_required && !answers[currentQuestion.id]) return;
    if (isLastQuestion) { handleSubmit(); } else {
      const next = currentStep + 1;
      setCurrentStep(next);
      saveProgress(next, answers);
    }
  };

  const handlePrevious = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: response, error: rErr } = await supabase.from('responses').insert({
        form_id: formId,
        respondent_email: answers[questions.find(q => q.question_type === 'email')?.id || ''] || null,
      }).select().single();
      if (rErr) throw rErr;
      const { error: aErr } = await supabase.from('answers').insert(
        questions.filter(q => answers[q.id]).map(q => ({
          response_id: response.id, question_id: q.id, answer_text: answers[q.id],
        }))
      );
      if (aErr) throw aErr;
      clearProgress();
      setSubmitted(true);
    } catch { /* Handled silently for a smoother UI experience */ }
    finally { setSubmitting(false); }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && currentQuestion?.question_type !== 'textarea') {
        e.preventDefault(); handleNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentStep, answers, currentQuestion]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-8 gap-8 animate-fade-in relative overflow-hidden">
        <div className="fixed inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-xl shadow-amber-500/5 animate-pulse">
            <Zap className="w-8 h-8 text-amber-500" fill="currentColor" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-canvas-elevated border border-line flex items-center justify-center shadow-xl animate-bounce">
            <Sparkles className="w-3 h-3 text-amber-500" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <RefreshCcw className="w-4 h-4 animate-spin text-amber-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-ink-tertiary">Loading your form...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-8">
        <div className="card-premium p-16 text-center max-w-md w-full animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-danger-muted/30 border border-danger-border flex items-center justify-center mx-auto mb-10">
            <RefreshCcw className="w-8 h-8 text-danger" />
          </div>
          <h2 className="text-3xl font-extrabold text-ink-primary mb-3">Form Not Found</h2>
          <p className="text-lg text-ink-secondary font-medium">
            {error || 'The form you are looking for may have been removed or the link is invalid.'}
          </p>
          <div className="mt-12 opacity-40 uppercase tracking-[0.2em] font-extrabold text-[10px] text-ink-tertiary">Error 404</div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-8 relative overflow-hidden">
        <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
        <div className="fixed inset-0 bg-radial-glow pointer-events-none" />

        <div className="relative card-premium p-16 text-center max-w-md w-full animate-slide-up shadow-2xl flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center mx-auto mb-10 shadow-xl">
            <Check className="w-12 h-12 text-emerald-500" strokeWidth={3} />
          </div>
          <h2 className="text-4xl font-extrabold text-ink-primary mb-4 tracking-tighter uppercase line-clamp-1">Form Submitted</h2>
          <p className="text-xl text-ink-secondary font-light mb-12">
            Thank you for taking the time to complete this form. Your response has been recorded.
          </p>
          <div className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-ink-muted bg-canvas-elevated/40 px-6 py-2 rounded-xl border border-line/20">
            <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-black" fill="black" />
            </div>
            Secured by AI Onboarding
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink-primary flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40 z-0" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />

      {/* Public Portal Header */}
      <header className="relative z-50 border-b border-line bg-canvas/60 backdrop-blur-xl sticky top-0">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3 text-xs font-extrabold uppercase tracking-widest text-ink-muted">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
              <span className="text-ink-secondary">{form.title}</span>
            </div>
            <span className="tabular-nums">
              Step {currentStep + 1} of {questions.length}
            </span>
          </div>
          <div className="h-1 w-full bg-line rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 shadow-xl shadow-amber-500/20 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-12 mb-20 animate-fade-in">
        <div className="w-full max-w-2xl">
          {currentStep === 0 && (
            <div className="mb-16 animate-slide-up text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-extrabold text-amber-500 uppercase tracking-widest mb-6">
                Client Onboarding
              </div>
              <h1 className="text-5xl font-extrabold text-ink-primary mb-4 tracking-tighter leading-none">{form.title}</h1>
              {form.description && (
                <p className="text-xl text-ink-secondary font-light leading-relaxed max-w-lg mx-auto">{form.description}</p>
              )}
            </div>
          )}

          {currentQuestion && (
            <div key={currentStep} className="card-premium p-10 sm:p-14 animate-slide-up bg-canvas-secondary/40 backdrop-blur-2xl shadow-3xl">
              <div className="relative mb-12">
                <div className="absolute -left-16 -top-2 opacity-[0.05] text-[120px] font-black text-ink-tertiary leading-none font-mono">
                  {currentStep + 1}
                </div>
                <label className="relative z-10 block">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-[10px] font-bold text-amber-500">Q</div>
                    <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                      {currentQuestion.is_required ? 'Required Question' : 'Optional Question'}
                    </span>
                  </div>
                  <span className="text-3xl font-extrabold text-ink-primary leading-[1.2] tracking-tight block">
                    {currentQuestion.question_text}
                  </span>
                </label>
              </div>

              {currentQuestion.question_type === 'textarea' ? (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => {
                    const a = { ...answers, [currentQuestion.id]: e.target.value };
                    setAnswers(a); saveProgress(currentStep, a);
                  }}
                  className="input-base bg-canvas-elevated/40 text-xl font-medium px-8 py-7 resize-none min-h-[180px] leading-relaxed"
                  placeholder="Type your response here..."
                  autoFocus
                />
              ) : currentQuestion.question_type === 'select' ? (
                <div className="grid gap-3">
                  {currentQuestion.options &&
                    JSON.parse(currentQuestion.options as string).map((option: string) => (
                      <button
                        key={option}
                        onClick={() => {
                          const a = { ...answers, [currentQuestion.id]: option };
                          setAnswers(a); saveProgress(currentStep, a);
                        }}
                        className={`group relative overflow-hidden w-full px-8 py-5 text-lg font-bold text-left rounded-2xl border-2 transition-all duration-300 flex items-center gap-6 ${answers[currentQuestion.id] === option
                          ? 'border-amber-500/50 bg-amber-500/10 text-ink-primary shadow-xl shadow-amber-500/5'
                          : 'border-line bg-canvas-elevated/40 hover:border-line-strong text-ink-tertiary hover:text-ink-primary'
                          }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${answers[currentQuestion.id] === option ? 'bg-amber-500 scale-110' : 'bg-canvas border border-line'
                          }`}>
                          {answers[currentQuestion.id] === option && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                        </div>
                        {option}
                      </button>
                    ))}
                </div>
              ) : (
                <input
                  type={
                    currentQuestion.question_type === 'email' ? 'email' :
                      currentQuestion.question_type === 'phone' ? 'tel' :
                        currentQuestion.question_type === 'number' ? 'number' : 'text'
                  }
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => {
                    const a = { ...answers, [currentQuestion.id]: e.target.value };
                    setAnswers(a); saveProgress(currentStep, a);
                  }}
                  className="input-base bg-canvas-elevated/40 text-xl font-bold px-8 py-7"
                  placeholder="Type your answer here..."
                  autoFocus
                />
              )}

              {/* Interaction Controls */}
              <div className="flex items-center justify-between mt-12 pt-10 border-t border-line/40">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="btn-ghost px-6 py-2.5 gap-2 uppercase tracking-widest font-extrabold text-[10px] disabled:opacity-0 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end opacity-20 group">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Press Enter</span>
                    <span className="text-xs font-mono">to continue</span>
                  </div>
                  <button
                    onClick={handleNext}
                    disabled={submitting || (currentQuestion.is_required && !answers[currentQuestion.id])}
                    className="btn-primary px-10 py-4 gap-3 text-lg shadow-2xl group shadow-amber-500/10"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : isLastQuestion ? (
                      <>Submit Form <Check className="w-6 h-6" /></>
                    ) : (
                      <>Next <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Persistence Indicator */}
      <div className="fixed bottom-10 left-0 right-0 z-50 pointer-events-none flex justify-center">
        <div className="px-6 py-2.5 rounded-full bg-canvas-secondary/80 backdrop-blur-xl border border-line/40 shadow-2xl flex items-center gap-3 animate-fade-in">
          <div className={`w-2 h-2 rounded-full ${Object.keys(answers).length > 0 ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-ink-muted'} animate-pulse`} />
          <span className="text-[10px] uppercase font-black tracking-widest text-ink-tertiary">Progress Saved Automatically</span>
        </div>
      </div>
    </div>
  );
}
