import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import type { Document } from '@shared/types';
import { MarkdownPreview } from '@/components/editor/MarkdownPreview';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
export function PublicSharePage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await api<Document>(`/api/shared/documents/${id}`);
        setDoc(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }
  if (error || !doc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2">Document Unavailable</h1>
        <p className="text-muted-foreground mb-8 max-w-md">{error || "This document might be private or doesn't exist."}</p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Lumiere
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">Lumiere</span>
          </div>
          <Button asChild size="sm" className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg">
            <Link to="/app">Create Your Own</Link>
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">{doc.title}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Last updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden min-h-[600px]">
          <MarkdownPreview content={doc.content} className="p-8 md:p-16" />
        </div>
        <footer className="mt-16 py-8 border-t text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-medium border border-brand-100">
            <Sparkles className="w-3 h-3" />
            <span>Published with Lumiere Markdown Studio</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A minimalist writing environment built for focus.
          </p>
        </footer>
      </main>
    </div>
  );
}