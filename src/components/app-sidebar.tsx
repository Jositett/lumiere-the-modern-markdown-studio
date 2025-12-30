import React, { useEffect, useState, useCallback } from "react";
import { FileText, Plus, Search, LogOut, Trash2, ShieldCheck, Upload, User as UserIcon, CloudOff, Rocket } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarInput, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import type { Document, VersionSnapshot } from "@shared/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";
export function AppSidebar(): JSX.Element {
  const documents = useEditorStore((s) => s.documents);
  const guestDocuments = useEditorStore((s) => s.guestDocuments);
  const setDocuments = useEditorStore((s) => s.setDocuments);
  const activeDocumentId = useEditorStore((s) => s.activeDocumentId);
  const setActiveDocumentId = useEditorStore((s) => s.setActiveDocumentId);
  const setContent = useEditorStore((s) => s.setContent);
  const setTitle = useEditorStore((s) => s.setTitle);
  const token = useEditorStore((s) => s.token);
  const user = useEditorStore((s) => s.user);
  const logout = useEditorStore((s) => s.logout);
  const versions = useEditorStore((s) => s.versions);
  const isGuest = useEditorStore((s) => s.isGuest);
  const addGuestDocument = useEditorStore((s) => s.addGuestDocument);
  const deleteGuestDocument = useEditorStore((s) => s.deleteGuestDocument);
  const initializeGuestMode = useEditorStore((s) => s.initializeGuestMode);
  const [search, setSearch] = useState("");
  const currentDocs = isGuest ? guestDocuments : documents;
  useEffect(() => {
    if (isGuest) initializeGuestMode();
  }, [isGuest, initializeGuestMode]);
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
    setActiveDocumentId(doc.id); 
    setContent(doc.content); 
    setTitle(doc.title);
    if (!isGuest) {
      try {
        await useEditorStore.getState().loadVersionsForDoc(doc.id);
      } catch(e) { console.error(e); }
    }
  }, [setActiveDocumentId, setContent, setTitle, isGuest]);
  const createDocument = useCallback(async (title = 'New Document', content = '') => {
    if (isGuest) {
      if (guestDocuments.length >= 10) {
        toast.error("Guest limit reached (10 docs). Upgrade to Pro for unlimited writing!");
        return;
      }
      const newDoc: Document = {
        id: crypto.randomUUID(),
        title,
        content,
        updatedAt: Date.now(),
        userId: 'guest',
        version: 1
      };
      addGuestDocument(newDoc);
      selectDocument(newDoc);
      toast.success("Local document created");
      return;
    }
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
  }, [token, documents, setDocuments, selectDocument, isGuest, guestDocuments, addGuestDocument]);
  const deleteDoc = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure?")) return;
    if (isGuest) {
      deleteGuestDocument(id);
      if (activeDocumentId === id) setActiveDocumentId(null);
      toast.success("Local document removed");
      return;
    }
    try {
      await api(`/api/documents/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      setDocuments(documents.filter(d => d.id !== id));
      if (activeDocumentId === id) setActiveDocumentId(null);
      toast.success("Document deleted");
    } catch (e) {
      toast.error("Failed to delete document");
    }
  }, [token, activeDocumentId, documents, setDocuments, setActiveDocumentId, isGuest, deleteGuestDocument]);
  const filteredDocs = currentDocs.filter(doc => doc.title.toLowerCase().includes(search.toLowerCase()));
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
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <SidebarInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 bg-background" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex justify-between">
            <span>Library</span>
            {isGuest && <span className="text-[10px] text-brand-600 uppercase font-bold">Guest Mode</span>}
          </SidebarGroupLabel>
          <SidebarMenu>
            {filteredDocs.map((doc) => (
              <SidebarMenuItem key={doc.id}>
                <SidebarMenuButton isActive={activeDocumentId === doc.id} onClick={() => selectDocument(doc)} className={cn("group", activeDocumentId === doc.id && "bg-brand-50 text-brand-700 dark:bg-brand-900/20")}>
                  <FileText className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate flex-1">{doc.title}</span>
                  <button onClick={(e) => deleteDoc(e, doc.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        {isGuest && (
          <div className="px-4 py-2 mt-4 mx-4 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white space-y-3">
             <div className="flex items-center gap-2">
               <Rocket className="w-4 h-4" />
               <span className="text-xs font-bold uppercase tracking-wider">Upgrade to Pro</span>
             </div>
             <p className="text-[10px] text-brand-50 leading-relaxed">Unlock Cloud Sync, Unlimited Documents, and Advanced Export.</p>
             <Button variant="secondary" size="sm" asChild className="w-full text-[10px] h-7 rounded-lg">
                <Link to="/pricing">Learn More</Link>
             </Button>
          </div>
        )}
        {!isGuest && activeDocumentId && versions?.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>History ({versions.length})</SidebarGroupLabel>
            <SidebarMenu>
              {versions.map((v: VersionSnapshot) => (
                <SidebarMenuItem key={v.version}>
                  <SidebarMenuButton onClick={() => { setContent(v.content); toast.success(`Reverted to v${v.version}`); }} className='text-xs'>
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
        {isGuest ? (
          <div className="flex items-center gap-3 px-2 py-2 text-muted-foreground">
             <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><CloudOff className="w-4 h-4" /></div>
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium">Guest Mode</p>
                <p className="text-[10px]">Cloud Sync Disabled</p>
             </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600"><UserIcon className="w-4 h-4" /></div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <SidebarMenu>
          {isGuest ? (
            <SidebarMenuItem><SidebarMenuButton asChild className="gap-2 bg-brand-50 text-brand-600 hover:bg-brand-100"><Link to="/auth">Sign In for Cloud Sync</Link></SidebarMenuButton></SidebarMenuItem>
          ) : (
            <SidebarMenuItem><SidebarMenuButton className="gap-2" onClick={logout}><LogOut className="w-4 h-4" /> Logout</SidebarMenuButton></SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}