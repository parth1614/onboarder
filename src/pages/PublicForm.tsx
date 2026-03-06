import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    loadForm();
    loadSavedProgress();
  }, [formId]);

  const loadSavedProgress = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { step, answers: savedAnswers } = JSON.parse(saved);
        setCurrentStep(step || 0);
        setAnswers(savedAnswers || {});
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
    }
  };

  const saveProgress = (step: number, currentAnswers: Record<string, string>) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ step, answers: currentAnswers }));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const clearProgress = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing progress:', error);
    }
  };

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
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveProgress(nextStep, answers);
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

      clearProgress();
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-32 h-32 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-16">
        <div className="bg-white rounded-card shadow-card p-48 text-center max-w-md">
          <div className="w-64 h-64 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-24">
            <span className="text-6xl">😔</span>
          </div>
          <h2 className="text-section text-text-primary mb-12">Form Not Found</h2>
          <p className="text-text-secondary">
            {error || 'This form does not exist or has not been published yet.'}
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-16">
        <div className="bg-white rounded-card shadow-card p-48 text-center max-w-md animate-[fadeIn_0.5s_ease-out]">
          <div className="w-80 h-80 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-24">
            <Check className="w-40 h-40 text-green-600" />
          </div>
          <h2 className="text-section text-text-primary mb-12">Thank You!</h2>
          <p className="text-subheading text-text-secondary">
            Your response has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-16">
      <div className="w-full max-w-2xl">
        <div className="mb-32">
          <div className="flex items-center gap-8 mb-16">
            <Sparkles className="w-24 h-24 text-primary" />
            <span className="text-sm font-medium text-text-secondary">
              Question {currentStep + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full h-8 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {currentStep === 0 && (
          <div className="mb-32 animate-[slideIn_0.3s_ease-out]">
            <h1 className="text-hero text-text-primary mb-12">{form.title}</h1>
            {form.description && (
              <p className="text-subheading text-text-secondary">{form.description}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-card shadow-card p-32 md:p-48 animate-[slideIn_0.3s_ease-out]">
          {currentQuestion && (
            <div className="mb-32">
              <label className="block text-section text-text-primary mb-24">
                {currentQuestion.question_text}
                {currentQuestion.is_required && (
                  <span className="text-red-500 ml-4">*</span>
                )}
              </label>

              {currentQuestion.question_type === 'textarea' ? (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => {
                    const newAnswers = { ...answers, [currentQuestion.id]: e.target.value };
                    setAnswers(newAnswers);
                    saveProgress(currentStep, newAnswers);
                  }}
                  className="w-full px-24 py-16 text-lg rounded-input border-2 border-border focus:border-primary focus:ring-0 outline-none transition resize-none"
                  rows={5}
                  placeholder="Type your answer here..."
                  autoFocus
                />
              ) : currentQuestion.question_type === 'select' ? (
                <div className="space-y-12">
                  {currentQuestion.options &&
                    JSON.parse(currentQuestion.options as string).map((option: string) => (
                      <button
                        key={option}
                        onClick={() => {
                          const newAnswers = { ...answers, [currentQuestion.id]: option };
                          setAnswers(newAnswers);
                          saveProgress(currentStep, newAnswers);
                        }}
                        className={`w-full px-24 py-16 text-lg text-left rounded-input border-2 transition ${
                          answers[currentQuestion.id] === option
                            ? 'border-primary bg-primary-soft text-text-primary'
                            : 'border-border hover:border-primary'
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
                  onChange={(e) => {
                    const newAnswers = { ...answers, [currentQuestion.id]: e.target.value };
                    setAnswers(newAnswers);
                    saveProgress(currentStep, newAnswers);
                  }}
                  className="w-full px-24 py-16 text-lg rounded-input border-2 border-border focus:border-primary focus:ring-0 outline-none transition"
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
              className="flex items-center gap-8 px-20 py-12 text-text-secondary hover:text-text-primary font-medium disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ArrowLeft className="w-20 h-20" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={submitting}
              className="flex items-center gap-8 px-32 py-14 bg-primary hover:bg-primary-hover text-white font-semibold rounded-button transition disabled:opacity-50"
            >
              {submitting ? (
                'Submitting...'
              ) : isLastQuestion ? (
                <>
                  <Check className="w-20 h-20" />
                  Submit
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-20 h-20" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-24 text-center">
          <p className="text-sm text-text-muted">
            Press <kbd className="px-8 py-4 bg-border rounded text-xs">Enter</kbd> to continue
          </p>
        </div>
      </div>
    </div>
  );
}
