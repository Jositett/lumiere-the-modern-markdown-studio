import React, { useState } from 'react';
import { SplitPanel } from '@/components/ui/split-panel';
import { MarkdownEditor } from '@/components/editor/MarkdownEditor';
import { MarkdownPreview } from '@/components/editor/MarkdownPreview';
import { useEditorStore } from '@/lib/store';
import { SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Share2, Download, CloudUpload, CheckCircle2, Globe, Link as LinkIcon, Lock, Settings as SettingsIcon } from 'lucide-react';
import { useAutoSave } from '@/hooks/use-autosave';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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
  const editorSettings = useEditorStore((s) => s.editorSettings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const documents = useEditorStore((s) => s.documents);
  const updateDocumentLocally = useEditorStore((s) => s.updateDocumentLocally);
  const token = useEditorStore(s => s.token);
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<'write' | 'preview'>('write');
  useAutoSave();
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
    } catch (e) { toast.error("Update failed"); }
  };
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-background z-20">
            <div className="flex items-center gap-3 overflow-hidden">
              <SidebarTrigger />
              <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!activeDocumentId} placeholder="Title..." className="bg-transparent border-none font-medium text-foreground focus:outline-none truncate w-32 md:w-64" />
              {activeDocumentId && (
                <div className="flex items-center gap-1.5 ml-2 text-[10px] font-medium uppercase tracking-wider">
                  {isSaving ? <span className="text-brand-500 animate-pulse"><CloudUpload className="w-3 h-3" /></span> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
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
                <PopoverTrigger asChild><Button variant="ghost" size="icon" disabled={!activeDocumentId}><Share2 className="w-4 h-4" /></Button></PopoverTrigger>
                <PopoverContent className="w-72 p-4 space-y-4" align="end">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5"><h4 className="font-medium text-sm">Public</h4><p className="text-xs text-muted-foreground">Anyone can view.</p></div>
                    <Switch checked={isPublic} onCheckedChange={togglePublic} />
                  </div>
                  {isPublic && <Button size="sm" className="w-full gap-2" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/s/${activeDocumentId}`); toast.success("Copied"); }}><LinkIcon className="w-3 h-3" /> Copy Link</Button>}
                </PopoverContent>
              </Popover>
              {!isMobile && (
                <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!isPreviewMode)} disabled={!activeDocumentId}>
                  {isPreviewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />} Preview
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => window.print()} disabled={!activeDocumentId}><Download className="w-4 h-4" /></Button>
              <ThemeToggle className="static" />
            </div>
          </header>
          <div className="flex-1 relative overflow-hidden">
            {!activeDocumentId ? <MarkdownEditor /> : isMobile ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">{mobileTab === 'write' ? <MarkdownEditor /> : <MarkdownPreview />}</div>
                <div className="h-12 border-t bg-background px-4 flex items-center">
                  <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as any)} className="w-full"><TabsList className="grid w-full grid-cols-2 h-9"><TabsTrigger value="write">Write</TabsTrigger><TabsTrigger value="preview">Preview</TabsTrigger></TabsList></Tabs>
                </div>
              </div>
            ) : isPreviewMode ? <SplitPanel left={<MarkdownEditor />} right={<MarkdownPreview />} className="h-full border-none rounded-none" /> : <MarkdownEditor />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}