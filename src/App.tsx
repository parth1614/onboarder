import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Router } from './components/Router';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CreateForm from './pages/CreateForm';
import FormEditor from './pages/FormEditor';
import PublicForm from './pages/PublicForm';
import Responses from './pages/Responses';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user && !window.location.pathname.startsWith('/form/')) {
    return <Login />;
  }

  return (
    <Router
      routes={[
        { path: '/', element: user ? <Landing /> : <Login /> },
        { path: '/login', element: <Login /> },
        { path: '/landing', element: <Landing /> },
        { path: '/dashboard', element: <Dashboard /> },
        { path: '/create', element: <CreateForm /> },
        { path: '/form/:id/edit', element: <FormEditor /> },
        { path: '/form/:id/responses', element: <Responses /> },
        { path: '/form/:id', element: <PublicForm /> },
        { path: '*', element: user ? <Landing /> : <Login /> },
      ]}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
