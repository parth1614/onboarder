import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from '../hooks/useNavigate';
import { supabase } from '../lib/supabase';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get } = useSearchParams();
  const formType = get('type') as 'agency' | 'customer' || 'agency';

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessContext, setBusinessContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      let businessInfo = '';
      let formTitle = '';
      let formDescription = '';
      let questions: any[] = [];

      // Step 1: Fetch and analyze the business website
      if (formType === 'agency' && websiteUrl) {
        try {
          // Use Edge Function to fetch website (avoids CORS issues)
          const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-website`;
          const proxyResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: websiteUrl }),
          });

          if (proxyResponse.ok) {
            const { html } = await proxyResponse.json();

            // Extract text content from HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Remove script and style tags
            const scripts = doc.querySelectorAll('script, style');
            scripts.forEach(s => s.remove());

            // Get text content
            const textContent = doc.body.textContent || '';
            const cleanText = textContent.replace(/\s+/g, ' ').trim().substring(0, 3000);

            // Analyze with AI
            const researchPrompt = `Analyze this business website content and provide:
1. What industry/niche they operate in
2. What services or products they offer
3. Who their target customers are
4. Their unique value proposition
5. Key information that would be relevant for onboarding new clients

Website: ${websiteUrl}

Content:
${cleanText}

Be specific and detailed based on the website content.`;

            const researchResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
              },
              body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [{ role: 'user', content: researchPrompt }],
                temperature: 0.5,
              }),
            });

            if (researchResponse.ok) {
              const researchData = await researchResponse.json();
              businessInfo = researchData.choices[0].message.content;
            }
          }
        } catch (error) {
          console.error('Error fetching website:', error);
        }

        // Fallback if fetching failed
        if (!businessInfo) {
          businessInfo = `Business website: ${websiteUrl}. Please create a professional client onboarding form for this business.`;
        }
      } else if (formType === 'customer' && businessContext) {
        businessInfo = businessContext;
      }

      // Step 2: Generate form questions using Gemini Flash
      const formPrompt = formType === 'agency'
        ? `You are an expert at creating client onboarding forms for businesses and agencies.

Based on this business research:
${businessInfo}

Create a comprehensive client onboarding form with 8-12 highly relevant questions. The questions should:
- Be specific to this business's industry and services
- Help understand the client's needs, goals, budget, timeline, and preferences
- Include both required basic info (name, email, company) and industry-specific questions
- Use appropriate question types (text, textarea, email, phone, select, number)

Return ONLY a valid JSON object with this structure:
{
  "title": "Clear, specific form title for this business",
  "description": "Brief description that reflects this business",
  "questions": [
    {
      "question_text": "Question text here",
      "question_type": "text|textarea|email|phone|select|number",
      "is_required": true|false,
      "options": ["option1", "option2"] (only for select type)
    }
  ]
}

Make questions highly specific to this business's services and industry. Avoid generic questions.`
        : `You are an expert at creating customer intake forms for businesses.

Based on this business description:
${businessInfo}

Create a reusable customer intake form with 8-12 questions. The questions should:
- Collect essential customer information
- Understand their needs and project details
- Be specific to this business's services
- Include budget and timeline questions

Return ONLY a valid JSON object with this structure:
{
  "title": "Clear form title",
  "description": "Brief description",
  "questions": [
    {
      "question_text": "Question text here",
      "question_type": "text|textarea|email|phone|select|number",
      "is_required": true|false,
      "options": ["option1", "option2"] (only for select type)
    }
  ]
}

Make questions relevant to the business's services.`;

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

      if (!formResponse.ok) {
        throw new Error('Failed to generate form with AI');
      }

      const formData = await formResponse.json();
      const parsedContent = JSON.parse(formData.choices[0].message.content);

      formTitle = parsedContent.title;
      formDescription = parsedContent.description;
      questions = parsedContent.questions;

      // Step 3: Save to database
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          owner_id: user.id,
          form_type: formType,
          title: formTitle,
          description: formDescription,
          website_url: websiteUrl || null,
          business_context: businessContext || null,
          is_published: false,
        })
        .select()
        .single();

      if (formError) throw formError;

      const questionsToInsert = questions.map((q: any, index: number) => ({
        form_id: form.id,
        question_text: q.question_text,
        question_type: q.question_type,
        is_required: q.is_required,
        order_index: index,
        options: q.options ? JSON.stringify(q.options) : null,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      navigate(`/form/${form.id}/edit`);
    } catch (err: any) {
      console.error('Error generating form:', err);
      setError(err.message || 'Failed to generate form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/landing')}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            {formType === 'agency' ? 'Create Agency Form' : 'Create Customer Form'}
          </h1>
          <p className="text-lg text-slate-600">
            {formType === 'agency'
              ? 'Enter your website URL and let AI generate perfect onboarding questions'
              : 'Tell us about your business and get a reusable customer intake form'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {formType === 'agency' ? (
              <div>
                <label htmlFor="website" className="block text-sm font-semibold text-slate-700 mb-2">
                  Business / Agency Website URL
                </label>
                <input
                  id="website"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  required
                  placeholder="https://agency.com"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
                <p className="mt-2 text-sm text-slate-500">
                  Our AI will analyze your website to understand your services and generate relevant questions
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="context" className="block text-sm font-semibold text-slate-700 mb-2">
                  Tell us about your business
                </label>
                <textarea
                  id="context"
                  value={businessContext}
                  onChange={(e) => setBusinessContext(e.target.value)}
                  required
                  rows={6}
                  placeholder="What does your business do? What services or products do you offer? Who are your customers?"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                />
                <p className="mt-2 text-sm text-slate-500">
                  Provide details about your business, services, and target customers
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating your form...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Form with AI
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              <span>AI analyzes {formType === 'agency' ? 'your website' : 'your business description'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              <span>Generates relevant onboarding questions automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              <span>You can review, edit, and customize the questions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              <span>Publish and share your form with clients</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
