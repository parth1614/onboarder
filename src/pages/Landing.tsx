import { useNavigate } from '../hooks/useNavigate';
import { Building2, Users, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">OnboardAI</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            My Forms
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Create beautiful AI-generated<br />onboarding forms{' '}
            <span className="text-blue-600">in seconds</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Stop wasting time building forms from scratch. Let AI analyze your business and create
            perfect onboarding questions automatically.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/create?type=agency')}
            className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 text-left"
          >
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Business / Agency Form
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Enter your website URL and let our AI analyze your services, ICP, and offerings to
              generate perfect client onboarding questions.
            </p>
            <div className="flex items-center text-blue-600 font-semibold group-hover:gap-3 gap-2 transition-all">
              Create Form
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => navigate('/create?type=customer')}
            className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-emerald-500 text-left"
          >
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Customer Intake Form
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Tell us about your business once and get a reusable customer intake form that you can
              share with multiple clients.
            </p>
            <div className="flex items-center text-emerald-600 font-semibold group-hover:gap-3 gap-2 transition-all">
              Create Form
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm text-blue-700 font-medium">
            <Sparkles className="w-4 h-4" />
            Powered by AI
          </div>
        </div>
      </div>
    </div>
  );
}
