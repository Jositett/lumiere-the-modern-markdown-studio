import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import React, { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import EditorPage from '@/pages/EditorPage'
import AuthPage from '@/pages/AuthPage'
import { PublicSharePage } from '@/pages/PublicSharePage'
import { useEditorStore } from '@/lib/store';
const queryClient = new QueryClient();
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useEditorStore(s => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/auth" state={{ from: location }} replace />;
  return <>{children}</>;
}
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/app",
    element: <ProtectedRoute><EditorPage /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/s/:id",
    element: <PublicSharePage />,
    errorElement: <RouteErrorBoundary />,
  }
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)