import React from "react";
import { FileText, Folder, Plus, Search, Clock, Star, Settings, ExternalLink } from "lucide-react";
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
const MOCK_DOCS = [
  { id: '1', title: 'Project Roadmap', icon: FileText },
  { id: '2', title: 'Meeting Notes', icon: FileText },
  { id: '3', title: 'Product Vision', icon: Star },
];
export function AppSidebar(): JSX.Element {
  return (
    <Sidebar className="border-r bg-muted/20">
      <SidebarHeader className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-white" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight">Lumiere</span>
        </div>
        <Button className="w-full justify-start gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm">
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
          <SidebarGroupLabel>Recent Documents</SidebarGroupLabel>
          <SidebarMenu>
            {MOCK_DOCS.map((doc) => (
              <SidebarMenuItem key={doc.id}>
                <SidebarMenuButton asChild>
                  <a href="#" className="flex items-center gap-2 group">
                    <doc.icon className="w-4 h-4 text-muted-foreground group-hover:text-brand-600 transition-colors" />
                    <span>{doc.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Folders</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#" className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <span>Drafts</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#" className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <span>Archive</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>Documentation</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}