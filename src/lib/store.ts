import { create } from 'zustand';
interface EditorState {
  content: string;
  title: string;
  isPreviewMode: boolean;
  isSidebarOpen: boolean;
  setContent: (content: string) => void;
  setTitle: (title: string) => void;
  setPreviewMode: (enabled: boolean) => void;
  toggleSidebar: () => void;
}
export const useEditorStore = create<EditorState>((set) => ({
  content: '# Welcome to Lumiere\n\nType something beautiful here...',
  title: 'Untitled Document',
  isPreviewMode: true,
  isSidebarOpen: true,
  setContent: (content) => set({ content }),
  setTitle: (title) => set({ title }),
  setPreviewMode: (enabled) => set({ isPreviewMode: enabled }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));