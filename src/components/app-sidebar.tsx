import React, { useEffect, useState, useCallback } from "react";
import { FileText, Plus, Search, Settings, ExternalLink, Trash2, LayoutDashboard, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInput,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
  const [search, setSearch] = useState("");
  const fetchDocuments = useCallback(async () => {
    try {
      const data = await api<{ items: Document[] }>('/api/documents');
      setDocuments(data.items);
    } catch (e) {
      console.error('Failed to fetch docs', e);
    }
  }, [setDocuments]);
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  const createDocument = async () => {
    try {
      const doc = await api<Document>('/api/documents', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Document', content: '' })
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
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await api(`/api/documents/${id}`, { method: 'DELETE' });
      setDocuments(documents.filter(d => d.id !== id));
      if (activeDocumentId === id) {
        setActiveDocumentId(null);
        setContent("");
        setTitle("Untitled Document");
      }
      toast.success("Document deleted");
    } catch (e) {
      toast.error("Failed to delete document");
    }
  };
  const selectDocument = (doc: Document) => {
    setActiveDocumentId(doc.id);
    setContent(doc.content);
    setTitle(doc.title);
  };
  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <Sidebar className="border-r bg-muted/20">
      <SidebarHeader className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight">Lumiere</span>
        </div>
        <Button
          onClick={createDocument}
          className="w-full justify-start gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Document</span>
        </Button>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <SidebarInput 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search library..." 
            className="pl-8 bg-background border-none shadow-none ring-1 ring-border" 
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Your Library</SidebarGroupLabel>
          <SidebarMenu>
            {filteredDocs.map((doc) => (
              <SidebarMenuItem key={doc.id}>
                <SidebarMenuButton
                  isActive={activeDocumentId === doc.id}
                  onClick={() => selectDocument(doc)}
                  className={cn(
                    "w-full group transition-all duration-200 pr-2",
                    activeDocumentId === doc.id 
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400" 
                      : "hover:bg-accent/50"
                  )}
                >
                  <FileText className={cn(
                    "w-4 h-4 mr-2 shrink-0",
                    activeDocumentId === doc.id ? "text-brand-600" : "text-muted-foreground group-hover:text-brand-600"
                  )} />
                  <span className="truncate flex-1">{doc.title}</span>
                  <button
                    onClick={(e) => deleteDocument(e, doc.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {documents.length === 0 && (
              <div className="px-6 py-12 text-center space-y-3">
                <LayoutDashboard className="w-8 h-8 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground italic">Your library is empty.</p>
                <Button variant="link" size="sm" onClick={createDocument} className="text-brand-600">
                  Create your first doc
                </Button>
              </div>
            )}
            {documents.length > 0 && filteredDocs.length === 0 && (
              <div className="px-6 py-12 text-center text-xs text-muted-foreground">
                No matches for "{search}"
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Lumiere Pro</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}