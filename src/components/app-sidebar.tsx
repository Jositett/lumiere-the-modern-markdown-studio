import React, { useEffect, useState, useCallback, useRef } from "react";
import { FileText, Plus, Search, Settings, LogOut, Trash2, LayoutDashboard, Sparkles, Upload, User as UserIcon } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarInput, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import type { Document } from "@shared/types";
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
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const createDocument = async (title = 'New Document', content = '') => {
    try {
      const doc = await api<Document>('/api/documents', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, content })
      });
      setDocuments([doc, ...documents]);
      selectDocument(doc);
      toast.success("Document created");
    } catch (e) {
      toast.error("Failed to create document");
    }
  };
  const deleteDocument = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure?")) return;
    try {
      await api(`/api/documents/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      setDocuments(documents.filter(d => d.id !== id));
      if (activeDocumentId === id) { setActiveDocumentId(null); setContent(""); setTitle("Untitled Document"); }
      toast.success("Document deleted");
    } catch (e) {
      toast.error("Failed to delete document");
    }
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      createDocument(file.name.replace(/\.[^/.]+$/, ""), content);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const selectDocument = (doc: Document) => {
    setActiveDocumentId(doc.id); setContent(doc.content); setTitle(doc.title);
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
        <div className="flex gap-2">
          <Button onClick={() => createDocument()} className="flex-1 justify-start gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg"><Plus className="w-4 h-4" /> New</Button>
          <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0"><Upload className="w-4 h-4" /></Button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".md,.txt" className="hidden" />
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