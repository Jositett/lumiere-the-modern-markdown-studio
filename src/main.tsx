import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import EditorPage from '@/pages/EditorPage'
import AuthPage from '@/pages/AuthPage'
import { PublicSharePage } from '@/pages/PublicSharePage'
import DocsPage from '@/pages/DocsPage'
import AdminPage from '@/pages/AdminPage'
import { PricingPage } from '@/pages/PricingPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LazyMotion, domAnimation } from 'framer-motion';
import { Toaster } from 'sonner';
const queryClient = new QueryClient();
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
    path: "/docs",
    element: <DocsPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/pricing",
    element: <PricingPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <EditorPage />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminPage />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/s/:id",
    element: <PublicSharePage />,
    errorElement: <RouteErrorBoundary />,
  }
]);
const container = document.getElementById('root')!;
const root = (window as any)._reactRoot || createRoot(container);
(window as any)._reactRoot = root;
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <LazyMotion features={domAnimation}>
        <RouterProvider router={router} />
        <Toaster position='top-right' richColors />
      </LazyMotion>
    </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)