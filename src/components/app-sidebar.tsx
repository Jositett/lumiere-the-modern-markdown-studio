import React, { useEffect, useState, useCallback, useRef } from "react";
import { FileText, Plus, Search, Settings, LogOut, Trash2, LayoutDashboard, Sparkles, Upload, User as UserIcon } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarInput, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import type { Document, VersionSnapshot } from "@shared/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
export function AppSidebar(): JSX.Element {
  const documents = useEditorStore((s) => s.documents);
  const setDocuments = useEditorStore((s) => s.setDocuments);
  const activeDocumentId = useEditorStore((s) => s.activeDocumentId);
  const setActiveDocumentId = useEditorStore((s) => s.setActiveDocumentId);
  const setContent = useEditorStore((s) => s.setContent);
  const setTitle = useEditorStore((s) => s.setTitle);
  const token = useEditorStore((s) => s.token);
  const user = useEditorStore((s) => s.user);
  const logout = useEditorStore((s) => s.logout);
  const versions = useEditorStore((s) => s.versions);
  const [search, setSearch] = useState("");

  const fetchDocuments = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api<{ items: Document[] }>('/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDocuments(data.items);
    } catch (e) {
      toast.error('Failed to sync library');
    }
  }, [setDocuments, token]);
  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const selectDocument = useCallback(async (doc: Document) => {
    setActiveDocumentId(doc.id); setContent(doc.content); setTitle(doc.title);
    try {
      await useEditorStore.getState().loadVersionsForDoc(doc.id);
    } catch(e) {
      console.error(e);
    }
  }, [setActiveDocumentId, setContent, setTitle]);

  const createDocument = useCallback(async (title = 'New Document', content = '') => {
    try {
      const doc = await api<Document>('/api/documents', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, content })
      });
      const newDocs = [doc, ...documents];
      setDocuments(newDocs);
      selectDocument(doc);
      toast.success("Document created");
    } catch (e) {
      toast.error("Failed to create document");
    }
  }, [token, documents, setDocuments, selectDocument]);

  const deleteDocument = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure?")) return;
    try {
      await api(`/api/documents/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const newDocs = documents.filter(d => d.id !== id);
      setDocuments(newDocs);
      if (activeDocumentId === id) { setActiveDocumentId(null); setContent(""); setTitle("Untitled Document"); }
      toast.success("Document deleted");
    } catch (e) {
      toast.error("Failed to delete document");
    }
  }, [token, activeDocumentId, documents, setDocuments, setActiveDocumentId, setContent, setTitle]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      createDocument(file.name.replace(/\.[^.]+$/, ''), content);
    } catch (e) {
      toast.error('Failed to read file');
    }
    if (e.target) e.target.value = '';
  };
  const filteredDocs = documents.filter(doc => doc.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <Sidebar className="border-r bg-muted/20">
      <SidebarHeader className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          <span className="text-xl font-display font-bold">Lumiere</span>
        </div>
        <div className="flex gap-2 border-2 border-dashed border-muted hover:border-brand-400 rounded-xl p-3 transition-all bg-background/50 hover:bg-brand-50/50 dark:hover:bg-brand-950/20"
             onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; e.currentTarget.classList.add('border-brand-400', 'bg-brand-50/50', 'dark:bg-brand-900/20'); }}
             onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-brand-400', 'bg-brand-50/50', 'dark:bg-brand-900/20'); }}
             onDrop={async (e) => { e.preventDefault(); const el = e.currentTarget as HTMLElement; el.classList.remove('border-brand-400', 'bg-brand-50/50', 'dark:bg-brand-900/20'); const files: File[] = Array.from(e.dataTransfer.files); const file = files.find(f => f.name.match(/\.(md|txt)$/i)); if (file) { try { const content = await file.text(); createDocument(file.name.replace(/\.[^.]+$/, ''), content); toast.success('Document imported'); } catch { toast.error('Failed to read file'); } } }}>
          <Button onClick={() => createDocument()} className="flex-1 justify-start gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg"><Plus className="w-4 h-4" /> New</Button>
          <Button variant="outline" size="icon" className="shrink-0">
            <input id="file-upload" type="file" onChange={handleImport} accept=".md,.txt" className="hidden" />
            <label htmlFor="file-upload" className="cursor-pointer block p-2"><Upload className="w-4 h-4" /></label>
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <SidebarInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 bg-background" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarMenu>
            {filteredDocs.map((doc) => (
              <SidebarMenuItem key={doc.id}>
                <SidebarMenuButton isActive={activeDocumentId === doc.id} onClick={() => selectDocument(doc)} className={cn("group pr-2", activeDocumentId === doc.id && "bg-brand-50 text-brand-700 dark:bg-brand-900/20")}>
                  <FileText className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate flex-1">{doc.title}</span>
                  <button onClick={(e) => deleteDocument(e, doc.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive rounded transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        {activeDocumentId && versions?.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>History ({versions.length})</SidebarGroupLabel>
            <SidebarMenu>
              {versions.map((v: VersionSnapshot) => (
                <SidebarMenuItem key={v.version}>
                  <SidebarMenuButton onClick={() => { setContent(v.content); toast.success(`Reverted to v${v.version} - ${new Date(v.updatedAt).toLocaleDateString()}`); }} className='justify-start text-xs px-3 py-1.5 hover:bg-muted/50'>
                    v{v.version}
                    <span className='text-muted-foreground ml-auto text-[10px]'>{new Date(v.updatedAt).toLocaleDateString()}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t space-y-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600"><UserIcon className="w-4 h-4" /></div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem><SidebarMenuButton className="gap-2" onClick={logout}><LogOut className="w-4 h-4" /> Logout</SidebarMenuButton></SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}