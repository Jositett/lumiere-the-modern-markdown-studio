import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEditorStore } from '@/lib/store';
import { useSession } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();
  const user = useEditorStore(s => s.user);
  const setAuth = useEditorStore(s => s.setAuth);
  const location = useLocation();
  const userId = session?.user?.id;
  useEffect(() => {
    if (userId && !user) {
      setAuth(session.user as any);
    }
  }, [userId, user, setAuth, session?.user]);
  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm font-display font-medium text-muted-foreground tracking-widest uppercase">Initializing Studio</p>
      </div>
    );
  }
  if (!session?.session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}