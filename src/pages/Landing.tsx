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
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-text-primary">bishopAI</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-20 py-12 bg-background-secondary hover:bg-border text-text-primary text-sm font-medium rounded-button transition"
          >
            My Forms
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-64">
        <div className="text-center mb-64">
          <h1 className="text-hero md:text-hero-lg text-text-primary mb-24 leading-tight">
            Create AI-powered onboarding forms<br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">in seconds</span>
          </h1>
          <p className="text-subheading text-text-secondary max-w-2xl mx-auto mb-32">
            Turn boring forms into interactive onboarding experiences.
          </p>
          <div className="flex items-center justify-center gap-16">
            <button
              onClick={() => navigate('/create?type=agency')}
              className="px-20 py-14 bg-primary hover:bg-primary-hover text-white font-semibold rounded-button transition"
            >
              Create Form
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-20 py-14 bg-background-secondary hover:bg-border text-text-primary font-medium rounded-button transition"
            >
              View Dashboard
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-24 max-w-5xl mx-auto mb-64">
          <button
            onClick={() => navigate('/create?type=agency')}
            className="group bg-white rounded-card p-24 shadow-card hover:shadow-xl transition-all text-left border border-transparent hover:border-primary"
          >
            <div className="w-48 h-48 bg-primary-soft rounded-card flex items-center justify-center mb-24 group-hover:scale-105 transition-transform">
              <Building2 className="w-24 h-24 text-primary" />
            </div>
            <h3 className="text-section text-text-primary mb-12">
              Business / Agency Form
            </h3>
            <p className="text-base text-text-secondary mb-24 leading-relaxed">
              Enter your website URL and let our AI analyze your services, ICP, and offerings to
              generate perfect client onboarding questions.
            </p>
            <div className="flex items-center text-primary font-semibold group-hover:gap-12 gap-8 transition-all">
              Create Form
              <ArrowRight className="w-20 h-20 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => navigate('/create?type=customer')}
            className="group bg-white rounded-card p-24 shadow-card hover:shadow-xl transition-all text-left border border-transparent hover:border-primary"
          >
            <div className="w-48 h-48 bg-primary-soft rounded-card flex items-center justify-center mb-24 group-hover:scale-105 transition-transform">
              <Users className="w-24 h-24 text-primary" />
            </div>
            <h3 className="text-section text-text-primary mb-12">
              Customer Intake Form
            </h3>
            <p className="text-base text-text-secondary mb-24 leading-relaxed">
              Tell us about your business once and get a reusable customer intake form that you can
              share with multiple clients.
            </p>
            <div className="flex items-center text-primary font-semibold group-hover:gap-12 gap-8 transition-all">
              Create Form
              <ArrowRight className="w-20 h-20 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        <div className="text-center">
          <h2 className="text-section-lg text-text-primary mb-24">Features</h2>
          <div className="grid md:grid-cols-3 gap-32 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-48 h-48 bg-primary-soft rounded-full flex items-center justify-center mx-auto mb-16">
                <Sparkles className="w-24 h-24 text-primary" />
              </div>
              <h3 className="text-subheading text-text-primary mb-8">AI Form Generation</h3>
              <p className="text-text-secondary">Intelligent questions powered by AI</p>
            </div>
            <div className="text-center">
              <div className="w-48 h-48 bg-primary-soft rounded-full flex items-center justify-center mx-auto mb-16">
                <Building2 className="w-24 h-24 text-primary" />
              </div>
              <h3 className="text-subheading text-text-primary mb-8">Smart Questions</h3>
              <p className="text-text-secondary">Tailored to your business needs</p>
            </div>
            <div className="text-center">
              <div className="w-48 h-48 bg-primary-soft rounded-full flex items-center justify-center mx-auto mb-16">
                <Users className="w-24 h-24 text-primary" />
              </div>
              <h3 className="text-subheading text-text-primary mb-8">Response Dashboard</h3>
              <p className="text-text-secondary">Track and manage client responses</p>
            </div>
          </div>
        </div>

        <div className="mt-64 text-center">
          <p className="text-sm text-text-muted font-medium">
            Trusted by agencies and consultants worldwide
          </p>
        </div>
      </div>
    </div>
  );
}
