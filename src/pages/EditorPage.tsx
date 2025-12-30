import React, { useState } from 'react';
import { SplitPanel } from '@/components/ui/split-panel';
import { MarkdownEditor } from '@/components/editor/MarkdownEditor';
import { MarkdownPreview } from '@/components/editor/MarkdownPreview';
import { useEditorStore } from '@/lib/store';
import { SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Share2, Download, CloudUpload, CheckCircle2, Globe, Link as LinkIcon, Lock } from 'lucide-react';
import { useAutoSave } from '@/hooks/use-autosave';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
export default function EditorPage() {
  const title = useEditorStore((s) => s.title);
  const setTitle = useEditorStore((s) => s.setTitle);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const isSaving = useEditorStore((s) => s.isSaving);
  const activeDocumentId = useEditorStore((s) => s.activeDocumentId);
  const documents = useEditorStore((s) => s.documents);
  const updateDocumentLocally = useEditorStore((s) => s.updateDocumentLocally);
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<'write' | 'preview'>('write');
  useAutoSave();
  const currentDoc = documents.find(d => d.id === activeDocumentId);
  const isPublic = currentDoc?.isPublic ?? false;
  const togglePublic = async () => {
    if (!activeDocumentId) return;
    try {
      const updated = await api(`/api/documents/${activeDocumentId}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublic: !isPublic })
      });
      updateDocumentLocally(activeDocumentId, { isPublic: !isPublic });
      toast.success(!isPublic ? "Document is now public" : "Document is now private");
    } catch (e) {
      toast.error("Failed to update visibility");
    }
  };
  const copyLink = () => {
    const url = `${window.location.origin}/s/${activeDocumentId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-background/80 backdrop-blur-md z-20">
            <div className="flex items-center gap-3 overflow-hidden">
              <SidebarTrigger />
              <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block" />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!activeDocumentId}
                placeholder={activeDocumentId ? "Document Title" : "Select a document"}
                className="bg-transparent border-none font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 rounded px-2 py-1 min-w-[120px] md:min-w-[200px] transition-all truncate"
              />
              {activeDocumentId && !isMobile && (
                <div className="flex items-center gap-1.5 ml-2 text-[10px] font-medium uppercase tracking-wider shrink-0">
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
            <div className="flex items-center gap-1 sm:gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!activeDocumentId} title="Share">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-medium text-sm">Public Access</h4>
                        <p className="text-xs text-muted-foreground">Allow anyone with the link to view.</p>
                      </div>
                      <Switch checked={isPublic} onCheckedChange={togglePublic} />
                    </div>
                    {isPublic ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs font-mono break-all line-clamp-1 border">
                          <Globe className="w-3 h-3 text-brand-600 shrink-0" />
                          {window.location.origin}/s/{activeDocumentId}
                        </div>
                        <Button size="sm" className="w-full gap-2" onClick={copyLink}>
                          <LinkIcon className="w-3 h-3" /> Copy Share Link
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-4 text-center space-y-2">
                        <Lock className="w-8 h-8 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground">This document is private.</p>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewMode(!isPreviewMode)}
                  disabled={!activeDocumentId}
                >
                  {isPreviewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {isPreviewMode ? 'Hide Preview' : 'Show Preview'}
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => window.print()} disabled={!activeDocumentId}>
                <Download className="w-4 h-4" />
              </Button>
              <ThemeToggle className="static" />
            </div>
          </header>
          <div className="flex-1 relative overflow-hidden">
            {!activeDocumentId ? (
              <MarkdownEditor />
            ) : isMobile ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  {mobileTab === 'write' ? <MarkdownEditor /> : <MarkdownPreview />}
                </div>
                <div className="h-12 border-t bg-background px-4 flex items-center justify-center">
                   <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-9">
                      <TabsTrigger value="write" className="text-xs">Write</TabsTrigger>
                      <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
                    </TabsList>
                   </Tabs>
                </div>
              </div>
            ) : (
              isPreviewMode ? (
                <SplitPanel
                  left={<MarkdownEditor />}
                  right={<MarkdownPreview />}
                  className="h-full border-none rounded-none"
                />
              ) : (
                <MarkdownEditor />
              )
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}