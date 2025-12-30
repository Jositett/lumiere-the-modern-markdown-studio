import React, { useEffect } from "react";
import { FileText, Plus, Search, Settings, ExternalLink, Loader2 } from "lucide-react";
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
export function AppSidebar(): JSX.Element {
  const documents = useEditorStore((s) => s.documents);
  const setDocuments = useEditorStore((s) => s.setDocuments);
  const activeDocumentId = useEditorStore((s) => s.activeDocumentId);
  const setActiveDocumentId = useEditorStore((s) => s.setActiveDocumentId);
  const setContent = useEditorStore((s) => s.setContent);
  const setTitle = useEditorStore((s) => s.setTitle);
  const fetchDocuments = async () => {
    try {
      const data = await api<{ items: Document[] }>('/api/documents');
      setDocuments(data.items);
    } catch (e) {
      console.error('Failed to fetch docs', e);
    }
  };
  useEffect(() => {
    fetchDocuments();
  }, []);
  const createDocument = async () => {
    try {
      const doc = await api<Document>('/api/documents', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Document', content: '' })
      });
      setDocuments([doc, ...documents]);
      selectDocument(doc);
    } catch (e) {
      console.error('Failed to create doc', e);
    }
  };
  const selectDocument = (doc: Document) => {
    setActiveDocumentId(doc.id);
    setContent(doc.content);
    setTitle(doc.title);
  };
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
          <SidebarInput placeholder="Quick search..." className="pl-8 bg-background border-none shadow-none ring-1 ring-border" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarMenu>
            {documents.map((doc) => (
              <SidebarMenuItem key={doc.id}>
                <SidebarMenuButton 
                  isActive={activeDocumentId === doc.id}
                  onClick={() => selectDocument(doc)}
                  className={cn(
                    "w-full group transition-colors",
                    activeDocumentId === doc.id ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400" : "hover:bg-accent/50"
                  )}
                >
                  <FileText className={cn(
                    "w-4 h-4 mr-2",
                    activeDocumentId === doc.id ? "text-brand-600" : "text-muted-foreground group-hover:text-brand-600"
                  )} />
                  <span className="truncate">{doc.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {documents.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                No documents found.
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2">
              <ExternalLink className="w-4 h-4" />
              <span>Documentation</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}