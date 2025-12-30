import { create } from 'zustand';
import type { Document } from '@shared/types';
interface EditorState {
  content: string;
  title: string;
  activeDocumentId: string | null;
  documents: Document[];
  isPreviewMode: boolean;
  isSidebarOpen: boolean;
  isSaving: boolean;
  setContent: (content: string) => void;
  setTitle: (title: string) => void;
  setActiveDocumentId: (id: string | null) => void;
  setDocuments: (docs: Document[]) => void;
  setPreviewMode: (enabled: boolean) => void;
  toggleSidebar: () => void;
  setSaving: (isSaving: boolean) => void;
  updateDocumentLocally: (id: string, updates: Partial<Document>) => void;
}
export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  title: 'Untitled Document',
  activeDocumentId: null,
  documents: [],
  isPreviewMode: true,
  isSidebarOpen: true,
  isSaving: false,
  setContent: (content) => set({ content }),
  setTitle: (title) => set({ title }),
  setActiveDocumentId: (id) => set({ activeDocumentId: id }),
  setDocuments: (documents) => set({ documents }),
  setPreviewMode: (enabled) => set({ isPreviewMode: enabled }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSaving: (isSaving) => set({ isSaving }),
  updateDocumentLocally: (id, updates) => set((state) => ({
    documents: state.documents.map(doc => doc.id === id ? { ...doc, ...updates } : doc)
  })),
}));