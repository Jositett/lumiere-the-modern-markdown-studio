import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEditorStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isGuest = useEditorStore(s => s.isGuest);
  const user = useEditorStore(s => s.user);
  const location = useLocation();
  if (isGuest && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}