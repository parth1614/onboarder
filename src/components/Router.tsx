import { useState, useEffect, ReactNode } from 'react';

interface Route {
  path: string;
  element: ReactNode;
}

interface RouterProps {
  routes: Route[];
}

export function Router({ routes }: RouterProps) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const matchedRoute = routes.find(route => {
    if (route.path === currentPath) return true;

    const routeParts = route.path.split('/').filter(Boolean);
    const pathParts = currentPath.split('/').filter(Boolean);

    if (routeParts.length !== pathParts.length) return false;

    return routeParts.every((part, i) => {
      if (part.startsWith(':')) return true;
      return part === pathParts[i];
    });
  });

  return <>{matchedRoute?.element || routes.find(r => r.path === '*')?.element}</>;
}
