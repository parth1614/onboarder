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
    <div className="min-h-screen bg-background-secondary">
      <nav className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Sparkles className="w-24 h-24 text-primary" />
            <span className="text-xl font-bold text-text-primary">bishopAI</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-8 px-16 py-12 bg-background-secondary hover:bg-border text-text-secondary hover:text-text-primary text-sm font-medium rounded-button transition"
          >
            <LogOut className="w-16 h-16" />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-48">
        <div className="flex items-center justify-between mb-32">
          <div>
            <h1 className="text-section-lg text-text-primary mb-8">Dashboard</h1>
            <p className="text-text-secondary">Manage your onboarding forms and view responses</p>
          </div>
          <button
            onClick={() => navigate('/landing')}
            className="flex items-center gap-8 bg-primary hover:bg-primary-hover text-white font-semibold px-20 py-14 rounded-button transition"
          >
            <Plus className="w-20 h-20" />
            Create Form
          </button>
        </div>

        {loading ? (
          <div className="text-center py-48">
            <div className="inline-block w-32 h-32 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : forms.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-48 text-center">
            <FileText className="w-64 h-64 text-text-muted mx-auto mb-24" />
            <h3 className="text-section text-text-primary mb-12">No forms yet</h3>
            <p className="text-text-secondary mb-32">Create your first AI-powered onboarding form</p>
            <button
              onClick={() => navigate('/landing')}
              className="inline-flex items-center gap-8 bg-primary hover:bg-primary-hover text-white font-semibold px-20 py-14 rounded-button transition"
            >
              <Plus className="w-20 h-20" />
              Create Form
            </button>
          </div>
        ) : (
          <div className="grid gap-24">
            {forms.map((form) => (
              <div
                key={form.id}
                className="bg-white rounded-card shadow-card hover:shadow-xl transition p-24"
              >
                <div className="flex items-start justify-between mb-24">
                  <div className="flex-1">
                    <div className="flex items-center gap-12 mb-8">
                      <h3 className="text-subheading text-text-primary">{form.title}</h3>
                      <span
                        className={`px-12 py-4 rounded-button text-sm font-medium ${
                          form.form_type === 'agency'
                            ? 'bg-primary-soft text-primary'
                            : 'bg-primary-soft text-primary'
                        }`}
                      >
                        {form.form_type === 'agency' ? 'Agency' : 'Customer'}
                      </span>
                      {form.is_published && (
                        <span className="px-12 py-4 rounded-button text-sm font-medium bg-green-100 text-green-700">
                          Published
                        </span>
                      )}
                    </div>
                    {form.description && (
                      <p className="text-text-secondary text-sm">{form.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-8 text-text-secondary">
                    <BarChart3 className="w-20 h-20" />
                    <span className="font-semibold">{form.response_count}</span>
                    <span className="text-sm">responses</span>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  <button
                    onClick={() => navigate(`/form/${form.id}/edit`)}
                    className="flex-1 px-16 py-14 bg-background-secondary hover:bg-border text-text-primary font-medium rounded-button transition"
                  >
                    Edit Form
                  </button>
                  <button
                    onClick={() => navigate(`/form/${form.id}/responses`)}
                    className="flex-1 px-16 py-14 bg-primary hover:bg-primary-hover text-white font-medium rounded-button transition"
                  >
                    View Responses
                  </button>
                  {form.is_published && (
                    <button
                      onClick={() => copyFormLink(form.id)}
                      className="px-16 py-14 border border-border hover:bg-background-secondary text-text-primary font-medium rounded-button transition flex items-center gap-8"
                      title="Copy form link"
                    >
                      <ExternalLink className="w-16 h-16" />
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
