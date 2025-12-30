import React, { useState, useEffect, useCallback } from 'react';
import { SplitPanel } from '@/components/ui/split-panel';
import { MarkdownEditor } from '@/components/editor/MarkdownEditor';
import { MarkdownPreview } from '@/components/editor/MarkdownPreview';
import { useEditorStore } from '@/lib/store';
import { SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Share2, CloudUpload, CheckCircle2, Link as LinkIcon, Settings as SettingsIcon, Maximize2, Minimize2, ShieldCheck } from 'lucide-react';
import { useAutoSave } from '@/hooks/use-autosave';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ExportMenu } from '@/components/editor/ExportMenu';
import { HelpDialog } from '@/components/editor/HelpDialog';
import { StatusBar } from '@/components/editor/StatusBar';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
export default function EditorPage() {
  const content = useEditorStore((s) => s.content);
  const scrollPercentage = useEditorStore((s) => s.scrollPercentage);
  const title = useEditorStore((s) => s.title);
  const setTitle = useEditorStore((s) => s.setTitle);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const isSaving = useEditorStore((s) => s.isSaving);
  const activeDocumentId = useEditorStore((s) => s.activeDocumentId);
  const editorSettings = useEditorStore((s) => s.editorSettings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const documents = useEditorStore((s) => s.documents);
  const updateDocumentLocally = useEditorStore((s) => s.updateDocumentLocally);
  const isFocusMode = useEditorStore((s) => s.isFocusMode);
  const setFocusMode = useEditorStore((s) => s.setFocusMode);
  const token = useEditorStore(s => s.token);
  const user = useEditorStore(s => s.user);
  const isGuest = useEditorStore(s => s.isGuest);
  const tourComplete = useEditorStore(s => s.tourComplete);
  const setTourComplete = useEditorStore(s => s.setTourComplete);
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<'write' | 'preview'>('write');
  const [showTour, setShowTour] = useState(false);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if (e.key === '?' && (e.target as Element).tagName !== 'INPUT' && (e.target as Element).tagName !== 'TEXTAREA') {
      e.preventDefault();
      toast.message('Shortcuts', {
        description: '• Cmd/Ctrl + S: Save\n• Cmd/Ctrl + /: Preview Toggle\n• ? : Shortcuts\n• Cmd/Ctrl + \\ : Focus Mode'
      });
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);
  useAutoSave();
  useEffect(() => {
    if (!tourComplete) {
      const timer = setTimeout(() => setShowTour(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [tourComplete]);
  const currentDoc = documents.find(d => d.id === activeDocumentId);
  const isPublic = currentDoc?.isPublic ?? false;
  const togglePublic = async () => {
    if (!activeDocumentId || !token) return;
    try {
      await api(`/api/documents/${activeDocumentId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isPublic: !isPublic })
      });
      updateDocumentLocally(activeDocumentId, { isPublic: !isPublic });
      toast.success(isPublic ? "Made Private" : "Made Public");
    } catch (e) {
      toast.error("Update failed");
    }
  };
  const preview = <MarkdownPreview content={content} scrollPercentage={scrollPercentage} />;
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {isGuest && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-600 z-50 animate-pulse" />
        )}
        {!isFocusMode && <AppSidebar />}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-background z-20 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              {!isFocusMode && <SidebarTrigger />}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!activeDocumentId}
                placeholder="Title..."
                className="bg-transparent border-none font-medium text-foreground focus:outline-none truncate w-32 md:w-64"
              />
              {activeDocumentId && (
                <div className="flex items-center gap-1.5 ml-2 text-[10px] font-medium uppercase tracking-wider">
                  {isSaving ? (
                    <span className="text-brand-500 animate-pulse"><CloudUpload className="w-3 h-3" /></span>
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isGuest && (
                <Button variant="ghost" size="sm" asChild className="text-brand-600 hidden md:flex font-bold">
                   <Link to="/pricing">Unlock Pro</Link>
                </Button>
              )}
              {user?.role === 'admin' && (
                <Button variant="ghost" size="icon" asChild title="Admin Panel">
                  <Link to="/admin"><ShieldCheck className="w-4 h-4 text-brand-600" /></Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFocusMode(!isFocusMode)}
                className={cn(isFocusMode && "text-brand-600 bg-brand-50 dark:bg-brand-900/20")}
                title={isFocusMode ? "Exit Zen Mode" : "Enter Zen Mode"}
              >
                {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="icon"><SettingsIcon className="w-4 h-4" /></Button></PopoverTrigger>
                <PopoverContent className="w-64 p-4 space-y-4" align="end">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Editor Theme</label>
                    <Select value={editorSettings.theme} onValueChange={(v) => updateSettings({ theme: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vscodeDark">VS Code Dark</SelectItem>
                        <SelectItem value="monokai">Monokai</SelectItem>
                        <SelectItem value="githubLight">GitHub Light</SelectItem>
                        <SelectItem value="dracula">Dracula</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Font Size: {editorSettings.fontSize}px</label>
                    <Slider value={[editorSettings.fontSize]} min={12} max={24} step={1} onValueChange={([v]) => updateSettings({ fontSize: v })} />
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                   <Button variant="ghost" size="icon" disabled={!activeDocumentId || isGuest}>
                     <Share2 className="w-4 h-4" />
                   </Button>
                </PopoverTrigger>
                {isGuest && (
                   <PopoverContent className="p-3 text-xs text-center">Cloud sharing is a Pro feature.</PopoverContent>
                )}
                <PopoverContent className="w-72 p-4 space-y-4" align="end">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5"><h4 className="font-medium text-sm">Public</h4><p className="text-xs text-muted-foreground">Anyone can view.</p></div>
                    <Switch checked={isPublic} onCheckedChange={togglePublic} />
                  </div>
                  {isPublic && (
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/s/${activeDocumentId}`);
                        toast.success("Copied to clipboard");
                      }}
                    >
                      <LinkIcon className="w-3 h-3" /> Copy Link
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
              {!isMobile && !isFocusMode && (
                <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!isPreviewMode)} disabled={!activeDocumentId}>
                  {isPreviewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />} Preview
                </Button>
              )}
              <ExportMenu />
              <HelpDialog />
              <ThemeToggle className="static" />
            </div>
          </header>
          <div className="flex-1 relative overflow-hidden flex flex-col">
            <div className="flex-1 relative overflow-hidden">
              {!activeDocumentId ? (
                <MarkdownEditor />
              ) : isMobile ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-hidden">{mobileTab === 'write' ? <MarkdownEditor /> : preview}</div>
                  <div className="h-12 border-t bg-background px-4 flex items-center">
                    <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-9">
                        <TabsTrigger value="write">Write</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              ) : isFocusMode ? (
                <div className="h-full w-full max-w-4xl mx-auto border-x bg-background shadow-2xl z-10">
                  <MarkdownEditor />
                </div>
              ) : isPreviewMode ? (
                <SplitPanel left={<MarkdownEditor />} right={preview} className="h-full border-none rounded-none" />
              ) : (
                <MarkdownEditor />
              )}
            </div>
            <StatusBar />
            <AnimatePresence>
              {showTour && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-12 left-8 z-50 max-w-xs p-6 bg-brand-600 text-white rounded-3xl shadow-2xl"
                >
                  <h3 className="text-lg font-bold mb-2">Welcome to your Studio!</h3>
                  <p className="text-sm text-brand-100 mb-6">Need a hand? Explore the documentation or use the help menu for quick shortcuts.</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => setTourComplete(true)}>Got it</Button>
                    <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/10">
                      <Link to="/docs" onClick={() => setTourComplete(true)}>Open Docs</Link>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}