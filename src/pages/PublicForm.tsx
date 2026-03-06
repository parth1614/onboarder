import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Form = Database['public']['Tables']['forms']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

export default function PublicForm() {
  const formId = window.location.pathname.split('/')[2];

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    if (!formId) return;

    try {
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('is_published', true)
        .maybeSingle();

      if (formError) throw formError;
      if (!formData) {
        setError('Form not found or not published');
        return;
      }

      setForm(formData);

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error loading form:', error);
      setError('Error loading form');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleNext = () => {
    if (!currentQuestion) return;

    if (currentQuestion.is_required && !answers[currentQuestion.id]) {
      alert('This question is required');
      return;
    }

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .insert({
          form_id: formId,
          respondent_email: answers[questions.find(q => q.question_type === 'email')?.id || ''] || null,
        })
        .select()
        .single();

      if (responseError) throw responseError;

      const answersToInsert = questions
        .filter(q => answers[q.id])
        .map(q => ({
          response_id: response.id,
          question_id: q.id,
          answer_text: answers[q.id],
        }));

      const { error: answersError } = await supabase
        .from('answers')
        .insert(answersToInsert);

      if (answersError) throw answersError;

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😔</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Form Not Found</h2>
          <p className="text-slate-600">
            {error || 'This form does not exist or has not been published yet.'}
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md animate-[fadeIn_0.5s_ease-out]">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Thank You!</h2>
          <p className="text-lg text-slate-600">
            Your response has been submitted successfully. We'll get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">
              Question {currentStep + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {currentStep === 0 && (
          <div className="mb-8 animate-[slideIn_0.3s_ease-out]">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">{form.title}</h1>
            {form.description && (
              <p className="text-lg text-slate-600">{form.description}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 animate-[slideIn_0.3s_ease-out]">
          {currentQuestion && (
            <div className="mb-8">
              <label className="block text-2xl font-semibold text-slate-900 mb-6">
                {currentQuestion.question_text}
                {currentQuestion.is_required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>

              {currentQuestion.question_type === 'textarea' ? (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) =>
                    setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                  }
                  className="w-full px-6 py-4 text-lg rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 outline-none transition resize-none"
                  rows={5}
                  placeholder="Type your answer here..."
                  autoFocus
                />
              ) : currentQuestion.question_type === 'select' ? (
                <div className="space-y-3">
                  {currentQuestion.options &&
                    JSON.parse(currentQuestion.options as string).map((option: string) => (
                      <button
                        key={option}
                        onClick={() =>
                          setAnswers({ ...answers, [currentQuestion.id]: option })
                        }
                        className={`w-full px-6 py-4 text-lg text-left rounded-xl border-2 transition ${
                          answers[currentQuestion.id] === option
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                </div>
              ) : (
                <input
                  type={
                    currentQuestion.question_type === 'email'
                      ? 'email'
                      : currentQuestion.question_type === 'phone'
                      ? 'tel'
                      : currentQuestion.question_type === 'number'
                      ? 'number'
                      : 'text'
                  }
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) =>
                    setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                  }
                  className="w-full px-6 py-4 text-lg rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 outline-none transition"
                  placeholder="Type your answer here..."
                  autoFocus
                />
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
            >
              {submitting ? (
                'Submitting...'
              ) : isLastQuestion ? (
                <>
                  <Check className="w-5 h-5" />
                  Submit
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Press <kbd className="px-2 py-1 bg-slate-200 rounded text-xs">Enter</kbd> to continue
          </p>
        </div>
      </div>
    </div>
  );
}
