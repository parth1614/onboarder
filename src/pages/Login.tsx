import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../hooks/useNavigate';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-32">
          <div className="inline-flex items-center justify-center gap-8 mb-16">
            <Sparkles className="w-32 h-32 text-primary" />
            <h1 className="text-hero font-bold text-text-primary">bishopAI</h1>
          </div>
          <p className="text-subheading text-text-secondary">
            Create AI-powered onboarding forms in seconds
          </p>
        </div>

        <div className="bg-white rounded-card shadow-card p-32">
          <h2 className="text-section text-text-primary text-center mb-8">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-text-secondary text-center mb-32">
            {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-16">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-16 py-12 rounded-input text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-8">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-14 py-14 border-2 border-border rounded-input focus:border-primary focus:outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-8">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-14 py-14 border-2 border-border rounded-input focus:border-primary focus:outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-14 rounded-button transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-24 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-primary hover:text-primary-hover font-medium text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <div className="mt-32 text-center">
          <p className="text-sm text-text-muted">
            Powered by AI
          </p>
        </div>
      </div>
    </div>
  );
}
