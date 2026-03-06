import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { supabase } from '../lib/supabase';
import { Sparkles, Plus, FileText, BarChart3, LogOut, ExternalLink } from 'lucide-react';
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

  useEffect(() => {
    loadForms();
  }, [user]);

  const loadForms = async () => {
    if (!user) return;

    try {
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (formsError) throw formsError;

      const formsWithStats = await Promise.all(
        (formsData || []).map(async (form) => {
          const { count } = await supabase
            .from('responses')
            .select('*', { count: 'exact', head: true })
            .eq('form_id', form.id);

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">OnboardAI</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Forms</h1>
            <p className="text-slate-600">Manage your onboarding forms and view responses</p>
          </div>
          <button
            onClick={() => navigate('/landing')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Create New Form
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : forms.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No forms yet</h3>
            <p className="text-slate-600 mb-6">Create your first AI-powered onboarding form</p>
            <button
              onClick={() => navigate('/landing')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Create Form
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {forms.map((form) => (
              <div
                key={form.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-slate-900">{form.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          form.form_type === 'agency'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {form.form_type === 'agency' ? 'Agency' : 'Customer'}
                      </span>
                      {form.is_published && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Published
                        </span>
                      )}
                    </div>
                    {form.description && (
                      <p className="text-slate-600 text-sm">{form.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-semibold">{form.response_count}</span>
                    <span className="text-sm">responses</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/form/${form.id}/edit`)}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
                  >
                    Edit Form
                  </button>
                  <button
                    onClick={() => navigate(`/form/${form.id}/responses`)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                  >
                    View Responses
                  </button>
                  {form.is_published && (
                    <button
                      onClick={() => copyFormLink(form.id)}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition flex items-center gap-2"
                      title="Copy form link"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Copy Link
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
