import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEditorStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useEditorStore(s => s.user);
  const setAuthRef = useRef(useEditorStore(s => s.setAuth));
  const [initializing, setInitializing] = useState(true);
  const location = useLocation();
  useEffect(() => {
    let cancelled = false;
    const setAuth = setAuthRef.current;
    const currentUser = useEditorStore.getState().user;
    async function init() {
      const token = localStorage.getItem('lumiere_token');
      if (token && !currentUser) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok && !cancelled) {
            const u = await res.json();
            setAuth(u);
          } else if (!res.ok) {
            localStorage.removeItem('lumiere_token');
          }
        } catch {}
      }
      setInitializing(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);
  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm font-display font-medium text-muted-foreground tracking-widest uppercase">Initializing Studio</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}