import { useCallback } from 'react';

export function useNavigate() {
  return useCallback((path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);
}

export function useLocation() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

export function useSearchParams() {
  const search = window.location.search;
  const params = new URLSearchParams(search);

  return {
    get: (key: string) => params.get(key),
    has: (key: string) => params.has(key),
  };
}
