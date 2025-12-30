import { create } from 'zustand';
import type { Document, User, EditorSettings } from '@shared/types';
interface EditorState {
  content: string;
  title: string;
  activeDocumentId: string | null;
  documents: Document[];
  isPreviewMode: boolean;
  isSidebarOpen: boolean;
  isSaving: boolean;
  isFocusMode: boolean;
  scrollPercentage: number;
  user: User | null;
  token: string | null;
  editorSettings: EditorSettings;
  setContent: (content: string) => void;
  setTitle: (title: string) => void;
  setActiveDocumentId: (id: string | null) => void;
  setDocuments: (docs: Document[]) => void;
  setPreviewMode: (enabled: boolean) => void;
  toggleSidebar: () => void;
  setSaving: (isSaving: boolean) => void;
  setFocusMode: (enabled: boolean) => void;
  setScrollPercentage: (percentage: number) => void;
  updateDocumentLocally: (id: string, updates: Partial<Document>) => void;
  setAuth: (user: User | null, token: string | null) => void;
  logout: () => void;
  updateSettings: (updates: Partial<EditorSettings>) => void;
}
const savedToken = localStorage.getItem('lumiere_token');
const savedUser = localStorage.getItem('lumiere_user');
export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  title: 'Untitled Document',
  activeDocumentId: null,
  documents: [],
  isPreviewMode: true,
  isSidebarOpen: true,
  isSaving: false,
  isFocusMode: false,
  scrollPercentage: 0,
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  editorSettings: {
    theme: 'vscodeDark',
    fontSize: 16
  },
  setContent: (content) => set({ content }),
  setTitle: (title) => set({ title }),
  setActiveDocumentId: (id) => set({ activeDocumentId: id }),
  setDocuments: (documents) => set({ documents }),
  setPreviewMode: (enabled) => set({ isPreviewMode: enabled }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSaving: (isSaving) => set({ isSaving }),
  setFocusMode: (enabled) => set({ isFocusMode: enabled }),
  setScrollPercentage: (scrollPercentage) => set({ scrollPercentage }),
  updateDocumentLocally: (id, updates) => set((state) => ({
    documents: state.documents.map(doc => doc.id === id ? { ...doc, ...updates } : doc)
  })),
  setAuth: (user, token) => {
    if (token) localStorage.setItem('lumiere_token', token);
    else localStorage.removeItem('lumiere_token');
    if (user) localStorage.setItem('lumiere_user', JSON.stringify(user));
    else localStorage.removeItem('lumiere_user');
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('lumiere_token');
    localStorage.removeItem('lumiere_user');
    set({ user: null, token: null, documents: [], activeDocumentId: null, content: '', title: '' });
  },
  updateSettings: (updates) => set((state) => ({
    editorSettings: { ...state.editorSettings, ...updates }
  })),
}));