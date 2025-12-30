import React, { useEffect, useState, useCallback, useRef } from "react";
import { FileText, Plus, Search, LogOut, Trash2, Upload, User as UserIcon, CloudOff, Rocket } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarInput, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction,
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
  const activeDocumentId = useEditorStore((s) => s.activeDocumentId);
  const setActiveDocumentId = useEditorStore((s) => s.setActiveDocumentId);
  const setContent = useEditorStore((s) => s.setContent);
  const setTitle = useEditorStore((s) => s.setTitle);
  const user = useEditorStore((s) => s.user);
  const logout = useEditorStore((s) => s.logout);
  const versions = useEditorStore((s) => s.versions);
  const isGuest = useEditorStore((s) => s.isGuest);
  const addGuestDocument = useEditorStore((s) => s.addGuestDocument);
  const deleteGuestDocument = useEditorStore((s) => s.deleteGuestDocument);
  const initializeGuestMode = useEditorStore((s) => s.initializeGuestMode);
  const loadDocuments = useEditorStore((s) => s.loadDocuments);
  const loadVersionsForDoc = useEditorStore((s) => s.loadVersionsForDoc);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectDocument = useCallback(async (doc: Document) => {
    setContent(doc.content);
    setTitle(doc.title);
    if (!isGuest) {
      try {
        await loadVersionsForDoc(doc.id);
      } catch(e) { console.error(e); }
    }
    setActiveDocumentId(doc.id);
  }, [setActiveDocumentId, setContent, setTitle, isGuest, loadVersionsForDoc]);
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
      toast.success("Document created locally.");
      return;
    }
    try {
      const doc = await api<Document>('/api/documents', {
        method: 'POST',
        body: JSON.stringify({ title, content })
      });
      await loadDocuments();
      selectDocument(doc);
      toast.success("Document created");
    } catch (e: any) {
      toast.error(`Document creation failed: ${e.message || 'Unknown error'}`);
    }
  }, [isGuest, guestDocuments, addGuestDocument, selectDocument, loadDocuments]);
  const deleteDoc = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure?")) return;
    if (isGuest) {
      deleteGuestDocument(id);
      if (activeDocumentId === id) {
        setActiveDocumentId(null);
      }
      toast.success("Local document removed");
      return;
    }
    try {
      await api(`/api/documents/${id}`, { method: 'DELETE' });
      await loadDocuments();
      if (activeDocumentId === id) setActiveDocumentId(null);
      toast.success("Document deleted");
    } catch (e: any) {
      toast.error(`Delete failed: ${e.message || 'Unknown error'}`);
    }
  }, [isGuest, activeDocumentId, deleteGuestDocument, setActiveDocumentId, loadDocuments]);
  const handleFileImport = useCallback(async(e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      if (!file.name.match(/\.md|txt$/i)) continue;
      const content = await file.text();
      const title = file.name.replace(/\.md|txt$/i, "").trim() || "Imported";
      await createDocument(title, content);
      toast.success(`Imported ${title}`);
    }
  }, [createDocument]);
  const currentDocs = isGuest ? guestDocuments : documents;
  useEffect(() => {
    if (isGuest) {
      initializeGuestMode();
    } else if (user) {
      loadDocuments();
    }
  }, [isGuest, user, initializeGuestMode, loadDocuments]);
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
          <div className="relative flex-1">
            <Button variant="outline" size="sm" className="w-full h-9 justify-start" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import MD
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt"
              multiple
              className="sr-only absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              onChange={(e) => {
                handleFileImport(e);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <SidebarInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 bg-background" />
        </div>
      </SidebarHeader>
      <SidebarContent className={cn(
        dragOver ? "ring-2 ring-brand-400/50 bg-brand-50/50 dark:bg-brand-900/30 border-brand-400/20" : "",
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
      onDrop={async (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        for(const file of files.filter(f => f.name.match(/\.md|txt$/i))) {
          const content = await file.text();
          const title = file.name.replace(/\.md|txt$/i, '').trim() || 'Dropped';
          await createDocument(title, content);
          toast.success(`Dropped ${title}`);
        }
      }}>
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
                </SidebarMenuButton>
                <SidebarMenuAction showOnHover={true} className='hover:text-destructive [&>svg]:text-destructive group-data-[active=true]:opacity-100 z-10' onClick={(e) => deleteDoc(e, doc.id)}>
                  <Trash2 className='w-3 h-3'/>
                </SidebarMenuAction>
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
        {!isGuest && activeDocumentId && versions && versions.length > 0 && (
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