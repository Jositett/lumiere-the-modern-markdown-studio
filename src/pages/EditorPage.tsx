import React from 'react';
import { SplitPanel } from '@/components/ui/split-panel';
import { MarkdownEditor } from '@/components/editor/MarkdownEditor';
import { MarkdownPreview } from '@/components/editor/MarkdownPreview';
import { useEditorStore } from '@/lib/store';
import { SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Share2, Download, CloudUpload, CheckCircle2 } from 'lucide-react';
import { useAutoSave } from '@/hooks/use-autosave';
export default function EditorPage() {
  const title = useEditorStore((s) => s.title);
  const setTitle = useEditorStore((s) => s.setTitle);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const isSaving = useEditorStore((s) => s.isSaving);
  const activeDocumentId = useEditorStore((s) => s.activeDocumentId);
  // Initialize auto-save hook
  useAutoSave();
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-background/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="h-6 w-[1px] bg-border mx-1" />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!activeDocumentId}
                placeholder={activeDocumentId ? "Document Title" : "Select a document"}
                className="bg-transparent border-none font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 rounded px-2 py-1 min-w-[200px] transition-all"
              />
              {activeDocumentId && (
                <div className="flex items-center gap-1.5 ml-2 text-[10px] font-medium uppercase tracking-wider">
                  {isSaving ? (
                    <span className="flex items-center gap-1 text-brand-500 animate-pulse">
                      <CloudUpload className="w-3 h-3" /> Saving
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground/60">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Saved
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode(!isPreviewMode)}
                className="hidden sm:flex"
                disabled={!activeDocumentId}
              >
                {isPreviewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {isPreviewMode ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <Button variant="ghost" size="icon" disabled={!activeDocumentId}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => window.print()} disabled={!activeDocumentId}>
                <Download className="w-4 h-4" />
              </Button>
              <ThemeToggle className="static" />
            </div>
          </header>
          <div className="flex-1 relative overflow-hidden">
            {activeDocumentId ? (
              isPreviewMode ? (
                <SplitPanel
                  left={<MarkdownEditor />}
                  right={<MarkdownPreview />}
                  className="h-full border-none rounded-none"
                />
              ) : (
                <MarkdownEditor />
              )
            ) : (
              <MarkdownEditor /> 
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}