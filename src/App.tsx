import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Zap, Sparkles, RefreshCcw } from 'lucide-react';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CreateForm from './pages/CreateForm';
import FormEditor from './pages/FormEditor';
import PublicForm from './pages/PublicForm';
import Responses from './pages/Responses';

export default function App() {
  const { user, loading } = useAuth();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Manual routing logic (simple for now)
  const isPublicForm = path.startsWith('/form/') && !path.endsWith('/edit') && !path.endsWith('/responses');

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
        <div className="fixed inset-0 bg-radial-glow pointer-events-none" />

        {/* Central Spinner Area */}
        <div className="relative z-10 flex flex-col items-center gap-10 animate-slide-up">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-xl shadow-amber-500/5 animate-pulse">
              <Zap className="w-8 h-8 text-amber-500" fill="currentColor" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-canvas-elevated border border-line flex items-center justify-center shadow-xl animate-bounce">
              <Sparkles className="w-3 h-3 text-amber-500" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tighter text-ink-primary">AI Onboarding Workspace</h2>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
              <p className="text-sm font-bold uppercase tracking-widest text-ink-tertiary">Loading Your Workspace...</p>
            </div>
          </div>
        </div>

        {/* Support Footer */}
        <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-3 opacity-40 text-xs font-bold uppercase tracking-widest text-ink-muted">
          <RefreshCcw className="w-3 h-3 animate-spin duration-[4000ms]" />
          Synchronizing Workspace
        </div>
      </div>
    );
  }

  // Handle public form routing (no auth needed)
  if (isPublicForm) {
    return <PublicForm />;
  }

  if (!user) {
    return <Login />;
  }

  // Simple Router
  if (path === '/') return <Landing />;
  if (path === '/landing') return <Landing />;
  if (path === '/dashboard') return <Dashboard />;
  if (path === '/create') return <CreateForm />;
  if (path.startsWith('/form/') && path.endsWith('/edit')) return <FormEditor />;
  if (path.startsWith('/form/') && path.endsWith('/responses')) return <Responses />;

  // Default to landing
  return <Landing />;
}
