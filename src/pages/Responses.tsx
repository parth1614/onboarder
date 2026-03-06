import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, Mail, Eye, Download } from 'lucide-react';
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

  useEffect(() => {
    loadData();
  }, [formId, user]);

  const loadData = async () => {
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

      const { data: responsesData, error: responsesError } = await supabase
        .from('responses')
        .select('*')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (responsesError) throw responsesError;

      const responsesWithAnswers = await Promise.all(
        (responsesData || []).map(async (response) => {
          const { data: answersData } = await supabase
            .from('answers')
            .select('*, question:questions(*)')
            .eq('response_id', response.id);

          return {
            ...response,
            answers: answersData as any || [],
          };
        })
      );

      setResponses(responsesWithAnswers);
    } catch (error) {
      console.error('Error loading responses:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (responses.length === 0) return;

    const headers = ['Submitted At', 'Email', ...questions.map(q => q.question_text)];
    const rows = responses.map(response => {
      const row = [
        new Date(response.submitted_at).toLocaleString(),
        response.respondent_email || 'N/A',
      ];

      questions.forEach(question => {
        const answer = response.answers.find(a => a.question_id === question.id);
        row.push(answer?.answer_text || '');
      });

      return row;
    });

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form?.title || 'form'}-responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <button
            onClick={exportToCSV}
            disabled={responses.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{form.title}</h1>
          <p className="text-slate-600">
            {responses.length} {responses.length === 1 ? 'response' : 'responses'}
          </p>
        </div>

        {responses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No responses yet</h3>
            <p className="text-slate-600">
              Share your form to start collecting responses
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {responses.map((response) => (
                <button
                  key={response.id}
                  onClick={() => setSelectedResponse(response)}
                  className={`w-full bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 text-left border-2 ${
                    selectedResponse?.id === response.id
                      ? 'border-blue-500'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    {response.respondent_email && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Mail className="w-4 h-4" />
                        <span className="font-medium">{response.respondent_email}</span>
                      </div>
                    )}
                    <Eye className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    {formatDate(response.submitted_at)}
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:sticky lg:top-24 lg:h-fit">
              {selectedResponse ? (
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Response Details</h3>
                    <div className="space-y-2 text-sm text-slate-600">
                      {selectedResponse.respondent_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {selectedResponse.respondent_email}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedResponse.submitted_at)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {questions.map((question) => {
                      const answer = selectedResponse.answers.find(
                        a => a.question_id === question.id
                      );

                      return (
                        <div key={question.id}>
                          <h4 className="font-semibold text-slate-900 mb-2">
                            {question.question_text}
                          </h4>
                          <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-slate-700">
                              {answer?.answer_text || <em className="text-slate-400">No answer</em>}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Eye className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Select a response to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
