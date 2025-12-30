import { create } from 'zustand';
import type { Document, User, EditorSettings, VersionSnapshot, AdminStats } from '@shared/types';
import { api } from '@/lib/api-client';
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
  versions: VersionSnapshot[] | null;
  user: User | null;
  token: string | null;
  editorSettings: EditorSettings;
  tourComplete: boolean;
  adminStats: AdminStats | null;
  loadVersionsForDoc: (docId: string) => Promise<void>;
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
  setTourComplete: (complete: boolean) => void;
  setAdminStats: (stats: AdminStats | null) => void;
}
const savedToken = typeof window !== 'undefined' ? localStorage.getItem('lumiere_token') : null;
const savedUser = typeof window !== 'undefined' ? localStorage.getItem('lumiere_user') : null;
const savedTour = typeof window !== 'undefined' ? localStorage.getItem('lumiere_tour_complete') === 'true' : false;
export const useEditorStore = create<EditorState>((set, get) => ({
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
  tourComplete: savedTour,
  adminStats: null,
  editorSettings: (() => {
    const savedSettingsStr = typeof window !== 'undefined' ? localStorage.getItem('lumiere_settings') : null;
    const savedSettings = savedSettingsStr ? JSON.parse(savedSettingsStr) : null;
    return savedSettings || {theme: 'vscodeDark', fontSize: 16};
  })(),
  setContent: (content) => set({ content }),
  setTitle: (title) => set({ title }),
  setActiveDocumentId: (id) => set({ activeDocumentId: id }),
  setDocuments: (documents) => set({ documents }),
  setPreviewMode: (enabled) => set({ isPreviewMode: enabled }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSaving: (isSaving) => set({ isSaving }),
  setFocusMode: (enabled) => set({ isFocusMode: enabled }),
  setScrollPercentage: (scrollPercentage) => set({ scrollPercentage }),
  versions: null,
  loadVersionsForDoc: async (docId: string) => {
    try {
      const resp = await api<{items: VersionSnapshot[]}>('/api/documents/' + docId + '/versions');
      set({versions: resp.items || []});
    } catch {
      set({versions: null});
    }
  },
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
  updateSettings: (updates) => {
    const currentSettings = get().editorSettings;
    const newSettings = { ...currentSettings, ...updates };
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumiere_settings', JSON.stringify(newSettings));
    }
    set({ editorSettings: newSettings });
  },
  setTourComplete: (complete) => {
    localStorage.setItem('lumiere_tour_complete', String(complete));
    set({ tourComplete: complete });
  },
  setAdminStats: (adminStats) => set({ adminStats }),
}));