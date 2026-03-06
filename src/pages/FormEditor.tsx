import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Eye, GripVertical, Plus, Trash2, Check, ExternalLink } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Form = Database['public']['Tables']['forms']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Multiple Choice' },
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

  useEffect(() => {
    loadForm();
  }, [formId, user]);

  const loadForm = async () => {
    if (!user || !formId) return;

    try {
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('owner_id', user.id)
        .single();

      if (formError) throw formError;
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
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      form_id: formId,
      question_text: 'New Question',
      question_type: 'text',
      is_required: true,
      order_index: questions.length,
      options: null,
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newQuestion]);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;

    [newQuestions[index], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[index],
    ];

    newQuestions.forEach((q, i) => {
      q.order_index = i;
    });

    setQuestions(newQuestions);
  };

  const saveForm = async () => {
    if (!form) return;

    setSaving(true);
    setSaveMessage('');

    try {
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('form_id', formId);

      if (deleteError) throw deleteError;

      const questionsToInsert = questions.map((q, index) => ({
        form_id: formId,
        question_text: q.question_text,
        question_type: q.question_type,
        is_required: q.is_required,
        order_index: index,
        options: q.options,
      }));

      const { error: insertError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (insertError) throw insertError;

      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      await loadForm();
    } catch (error) {
      console.error('Error saving form:', error);
      setSaveMessage('Error saving form');
    } finally {
      setSaving(false);
    }
  };

  const publishForm = async () => {
    if (!form) return;

    try {
      const { error } = await supabase
        .from('forms')
        .update({ is_published: true })
        .eq('id', formId);

      if (error) throw error;

      setForm({ ...form, is_published: true });
      alert('Form published successfully!');
    } catch (error) {
      console.error('Error publishing form:', error);
    }
  };

  const copyFormLink = () => {
    const link = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(link);
    alert('Form link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className="text-sm font-medium text-green-600 flex items-center gap-2">
                <Check className="w-4 h-4" />
                {saveMessage}
              </span>
            )}
            <button
              onClick={saveForm}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            {form.is_published ? (
              <button
                onClick={copyFormLink}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
              >
                <ExternalLink className="w-4 h-4" />
                Copy Link
              </button>
            ) : (
              <button
                onClick={publishForm}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                <Eye className="w-4 h-4" />
                Publish Form
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="text-3xl font-bold text-slate-900 bg-transparent border-none outline-none w-full mb-3 focus:ring-0"
            placeholder="Form Title"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="text-lg text-slate-600 bg-transparent border-none outline-none w-full resize-none focus:ring-0"
            placeholder="Form description (optional)"
            rows={2}
          />
        </div>

        <div className="space-y-4 mb-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-2 pt-3">
                  <button
                    onClick={() => moveQuestion(index, 'up')}
                    disabled={index === 0}
                    className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <GripVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <input
                      type="text"
                      value={question.question_text}
                      onChange={(e) =>
                        updateQuestion(question.id, { question_text: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Question text"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <select
                      value={question.question_type}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          question_type: e.target.value as Question['question_type'],
                        })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      {QUESTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={question.is_required}
                        onChange={(e) =>
                          updateQuestion(question.id, { is_required: e.target.checked })
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Required
                    </label>
                  </div>

                  {question.question_type === 'select' && (
                    <div>
                      <textarea
                        value={
                          question.options
                            ? JSON.parse(question.options as string).join('\n')
                            : ''
                        }
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            options: JSON.stringify(
                              e.target.value.split('\n').filter((o) => o.trim())
                            ) as any,
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        placeholder="Enter options (one per line)"
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => deleteQuestion(question.id)}
                  className="text-red-400 hover:text-red-600 pt-3"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-500 hover:text-blue-600 font-medium transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>
    </div>
  );
}
