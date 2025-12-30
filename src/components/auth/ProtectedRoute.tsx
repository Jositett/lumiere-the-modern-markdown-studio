import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEditorStore } from '@/lib/store';
import { useSession } from '@/lib/auth-client';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();
  const user = useEditorStore(s => s.user);
  const setAuth = useEditorStore(s => s.setAuth);
  const location = useLocation();
  const userId = session?.user?.id ?? '';

  useEffect(() => {
    if (userId && !user) {
      setAuth(session.user as any);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user, setAuth]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!session?.session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}