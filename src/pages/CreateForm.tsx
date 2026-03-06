import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from '../hooks/useNavigate';
import { supabase } from '../lib/supabase';
import { Zap, ArrowLeft, Loader2, Globe, CheckCircle2, MessageSquare, Sparkles, Wand2 } from 'lucide-react';

const steps = [
  { label: 'Website Analysis', icon: Globe },
  { label: 'AI Question Generation', icon: MessageSquare },
  { label: 'Saving Your Form', icon: CheckCircle2 },
];

export default function CreateForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get } = useSearchParams();
  const formType = get('type') as 'agency' | 'customer' || 'agency';

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessContext, setBusinessContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);
    setLoadingStep(0);

    try {
      let businessInfo = '';
      let formTitle = '';
      let formDescription = '';
      let questions: any[] = [];

      setLoadingStep(0);
      if (formType === 'agency' && websiteUrl) {
        try {
          const proxyResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-website`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: websiteUrl }),
          });
          if (proxyResponse.ok) {
            const { html } = await proxyResponse.json();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            doc.querySelectorAll('script, style').forEach(s => s.remove());
            const cleanText = (doc.body.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 3000);
            const researchResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
              },
              body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [{ role: 'user', content: `Analyze this business website content and provide detailed intel about their industry, services, ICP, and key onboarding info.\n\nWebsite: ${websiteUrl}\nContent: ${cleanText}` }],
                temperature: 0.5,
              }),
            });
            if (researchResponse.ok) {
              const d = await researchResponse.json();
              businessInfo = d.choices[0].message.content;
            }
          }
        } catch (e) { console.error(e); }
        if (!businessInfo) businessInfo = `Business website: ${websiteUrl}`;
      } else if (formType === 'customer' && businessContext) {
        businessInfo = businessContext;
      }

      setLoadingStep(1);
      const formPrompt = formType === 'agency'
        ? `Create a comprehensive client onboarding form with 10-15 highly relevant questions based on:\n${businessInfo}\n\nReturn ONLY JSON: {"title":"...","description":"...","questions":[{"question_text":"...","question_type":"text|textarea|email|phone|select|number","is_required":true,"options":["opt1"]}]}`
        : `Create a reusable customer intake form with 10-15 questions based on:\n${businessInfo}\n\nReturn ONLY JSON: {"title":"...","description":"...","questions":[{"question_text":"...","question_type":"text|textarea|email|phone|select|number","is_required":true}]}`;

      const formResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [{ role: 'user', content: formPrompt }],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });
      if (!formResponse.ok) throw new Error('Failed to generate form with AI');
      const formData = await formResponse.json();
      const parsed = JSON.parse(formData.choices[0].message.content);
      formTitle = parsed.title;
      formDescription = parsed.description;
      questions = parsed.questions;

      setLoadingStep(2);
      const { data: form, error: formError } = await (supabase.from('forms').insert({
        owner_id: user.id,
        form_type: formType,
        title: formTitle,
        description: formDescription,
        website_url: websiteUrl || null,
        business_context: businessContext || null,
        is_published: false,
      } as any) as any).select().single();
      if (formError) throw formError;

      const { error: qErr } = await (supabase.from('questions').insert(
        questions.map((q: any, i: number) => ({
          form_id: (form as any).id,
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          order_index: i,
          options: q.options ? JSON.stringify(q.options) : null,
        })) as any
      ) as any);
      if (qErr) throw qErr;
      navigate(`/form/${(form as any).id}/edit`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-primary">
      {/* ── Background decoration ── */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40 z-0" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />

      {/* ── Navigation (80px) ── */}
      <nav className="relative z-50 border-b border-line bg-canvas/80 backdrop-blur-3xl sticky top-0" style={{ height: '80px', minHeight: '80px' }}>
        <div className="max-w-3xl mx-auto px-6 h-full flex items-center justify-between">
          <button onClick={() => navigate('/landing')} className="btn-ghost flex items-center gap-2 -ml-2 text-sm font-semibold hover:text-ink-primary">
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back to Home</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/10">
              <Zap className="w-5 h-5 text-black" fill="black" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter uppercase italic">bishopAI</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-20 pb-12 animate-slide-up">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] sm:text-xs font-extrabold text-amber-500 mb-6 sm:mb-8 shadow-xl shadow-amber-500/5 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            Form Generation Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-primary tracking-tight mb-4 px-4">
            {formType === 'agency' ? 'Generate from Website' : 'Context-Based Portal'}
          </h1>
          <p className="text-base sm:text-lg text-ink-secondary font-medium leading-relaxed max-w-lg mx-auto px-4 opacity-80">
            {formType === 'agency'
              ? 'Our AI engine will deeply analyze your website architecture to craft the perfect intake journey.'
              : "Tell us about your target clients and we'll engineer a high-performing onboarding flow."}
          </p>
        </div>

        {/* Input Card Container */}
        <div className="card-premium p-10 mb-8 shadow-2xl animate-slide-up relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 transition-transform group-hover:scale-110">
            <Wand2 className="w-24 h-24" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
            {error && (
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-danger-muted border border-danger-border text-sm text-danger shadow-xl shadow-danger/5">
                <span className="shrink-0 mt-0.5">⚠</span> {error}
              </div>
            )}

            {formType === 'agency' ? (
              <div className="space-y-3">
                <label htmlFor="website" className="block text-xs font-bold tracking-[0.15em] uppercase text-ink-tertiary">
                  Business Website URL
                </label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-canvas-elevated border border-line flex items-center justify-center transition-colors group-hover/input:border-amber-500/30">
                    <Globe className="w-4 h-4 text-ink-tertiary" />
                  </div>
                  <input
                    id="website"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    required
                    placeholder="https://youragency.digital"
                    className="input-base pl-16 py-4 text-lg font-medium tracking-tight"
                  />
                </div>
                <p className="text-xs text-ink-muted leading-relaxed mt-2 opacity-80">
                  Our AI will analyze your website services, audience, and value propositions to generate the perfect onboarding journey.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label htmlFor="context" className="block text-xs font-bold tracking-[0.15em] uppercase text-ink-tertiary">
                  Business Description
                </label>
                <textarea
                  id="context"
                  value={businessContext}
                  onChange={(e) => setBusinessContext(e.target.value)}
                  required
                  rows={6}
                  placeholder="Describe your business model, specific services, and what data you need from new clients."
                  className="input-base px-6 py-5 text-lg font-medium leading-relaxed resize-none"
                />
                <p className="text-xs text-ink-muted leading-relaxed mt-2 opacity-80">
                  Detailed descriptions help our AI engineer forms that result in 40% higher client conversion rates.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 sm:py-5 text-lg sm:text-xl mt-6 shadow-xl shadow-amber-500/10 group/btn"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-4">
                  <Loader2 className="w-6 h-6 animate-spin text-black" />
                  {steps[loadingStep]?.label}…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <Wand2 className="w-6 h-6 transition-transform group-hover/btn:rotate-12" />
                  Generate My Form
                </span>
              )}
            </button>
          </form>

          {/* AI Progress Steps Visualizer */}
          {loading && (
            <div className="mt-12 pt-10 border-t border-line space-y-8 animate-fade-in relative z-10">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-start gap-6 group">
                  <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all duration-500 ${i < loadingStep ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' :
                    i === loadingStep ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-xl shadow-amber-500/20' :
                      'border-line bg-canvas-elevated text-ink-tertiary'
                    }`}>
                    {i < loadingStep ? (
                      <CheckCircle2 className="w-5 h-5 animate-slide-up" />
                    ) : i === loadingStep ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    ) : (
                      <step.icon className="w-4 h-4 opacity-50" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`text-base font-bold transition-colors ${i <= loadingStep ? 'text-ink-primary' : 'text-ink-muted'}`}>
                      {step.label}
                    </span>
                    <span className={`text-xs font-medium opacity-60 transition-opacity ${i === loadingStep ? 'opacity-100' : 'opacity-40'}`}>
                      {i < loadingStep ? 'Analysis complete.' : i === loadingStep ? 'Processing data...' : 'Waiting to start...'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informational Guidance */}
        {!loading && (
          <div className="card-premium p-8 animate-slide-up bg-canvas/30 backdrop-blur-md border-line/40">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-ink-muted mb-6">How it works</h4>
            <div className="grid gap-6">
              {[
                { title: `Website Reading`, desc: `Our engine identifies core services and audience details from your ${formType === 'agency' ? 'landing page' : 'description'}.` },
                { title: `Intelligent Questions`, desc: `Questions are designed to maximize client response rates using proven conversion models.` },
                { title: `Instant Dashboard`, desc: `Once generated, your form is ready in your dashboard to review and share.` },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-5">
                  <div className="w-7 h-7 rounded-lg bg-canvas-elevated border border-line flex items-center justify-center text-[10px] font-extrabold text-ink-tertiary shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-bold text-ink-secondary">{s.title}</p>
                    <p className="text-xs text-ink-tertiary leading-relaxed font-medium">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
