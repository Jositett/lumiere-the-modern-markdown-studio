import { create } from 'zustand';
import type { Document, User, EditorSettings, VersionSnapshot, AdminStats, SubscriptionStatus } from '@shared/types';
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
  refreshToken: string | null;
  subscriptionStatus: SubscriptionStatus;
  isBanned: boolean;
  editorSettings: EditorSettings;
  tourComplete: boolean;
  adminStats: AdminStats | null;
  isGuest: boolean;
  guestDocuments: Document[];
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
  setAuth: (user: User | null, token: string | null, refreshToken?: string | null) => Promise<void>;
  logout: () => void;
  updateSettings: (updates: Partial<EditorSettings>) => void;
  setTourComplete: (complete: boolean) => void;
  setAdminStats: (stats: AdminStats | null) => void;
  initializeGuestMode: () => void;
  addGuestDocument: (doc: Document) => void;
  updateGuestDocument: (id: string, updates: Partial<Document>) => void;
  deleteGuestDocument: (id: string) => void;
  loadDocuments: () => Promise<void>;
  migrateGuestDocuments: () => Promise<void>;
}
const savedToken = typeof window !== 'undefined' ? localStorage.getItem('lumiere_token') : null;
const savedRefresh = typeof window !== 'undefined' ? localStorage.getItem('lumiere_refresh') : null;
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
  refreshToken: savedRefresh || null,
  subscriptionStatus: 'free',
  isBanned: false,
  tourComplete: savedTour,
  adminStats: null,
  isGuest: !savedToken,
  guestDocuments: [],
  editorSettings: (() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lumiere_settings') : null;
    return saved ? JSON.parse(saved) : { theme: 'auto', fontSize: 16 };
  })(),
  setContent: (content) => set({ content }),
  setTitle: (title) => set({ title }),
  setActiveDocumentId: (id) => {
    const state = get();
    const doc = (state.isGuest ? state.guestDocuments : state.documents).find(d => d.id === id);
    if (doc) set({ activeDocumentId: id, content: doc.content, title: doc.title });
    else set({ activeDocumentId: id });
  },
  setDocuments: (documents) => set({ documents }),
  setPreviewMode: (enabled) => set({ isPreviewMode: enabled }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSaving: (isSaving) => set({ isSaving }),
  setFocusMode: (enabled) => set({ isFocusMode: enabled }),
  setScrollPercentage: (scrollPercentage) => set({ scrollPercentage }),
  versions: null,
  loadVersionsForDoc: async (docId: string) => {
    if (get().isGuest) return;
    try {
      const resp = await api<{ items: VersionSnapshot[] }>(`/api/documents/${docId}/versions`);
      set({ versions: resp.items || [] });
    } catch { set({ versions: null }); }
  },
  updateDocumentLocally: (id, updates) => set((state) => ({
    documents: state.documents.map(doc => doc.id === id ? { ...doc, ...updates } : doc)
  })),
  setAuth: async (user, token, refreshToken) => {
    if (token) {
      localStorage.setItem('lumiere_token', token);
      if (refreshToken) localStorage.setItem('lumiere_refresh', refreshToken);
      localStorage.setItem('lumiere_user', JSON.stringify(user));
      set({ user, token, refreshToken: refreshToken || get().refreshToken, isGuest: false, isBanned: user?.isBanned || false, subscriptionStatus: user?.subscriptionStatus || 'free' });
      
      const state = get();
      if (state.guestDocuments.length > 0) {
        await get().migrateGuestDocuments();
      } else {
        await get().loadDocuments();
      }
    } else {
      get().logout();
    }
  },
  logout: () => {
    localStorage.removeItem('lumiere_token');
    localStorage.removeItem('lumiere_refresh');
    localStorage.removeItem('lumiere_user');
    set({ user: null, token: null, refreshToken: null, documents: [], activeDocumentId: null, content: '', title: '', isGuest: true, isBanned: false, subscriptionStatus: 'free' });
    get().initializeGuestMode();
  },
  updateSettings: (updates) => {
    const newSettings = { ...get().editorSettings, ...updates };
    localStorage.setItem('lumiere_settings', JSON.stringify(newSettings));
    set({ editorSettings: newSettings });
  },
  setTourComplete: (complete) => {
    localStorage.setItem('lumiere_tour_complete', String(complete));
    set({ tourComplete: complete });
  },
  setAdminStats: (adminStats) => set({ adminStats }),
  initializeGuestMode: () => {
    const stored = localStorage.getItem('lumiere_guest_docs');
    if (stored) set({ guestDocuments: JSON.parse(stored) });
  },
  addGuestDocument: (doc) => {
    set((state) => {
      const next = [doc, ...state.guestDocuments].slice(0, 10);
      localStorage.setItem('lumiere_guest_docs', JSON.stringify(next));
      return { guestDocuments: next };
    });
  },
  updateGuestDocument: (id, updates) => {
    set((state) => {
      const next = state.guestDocuments.map(d => d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d);
      localStorage.setItem('lumiere_guest_docs', JSON.stringify(next));
      return { guestDocuments: next };
    });
  },
  deleteGuestDocument: (id) => {
    set((state) => {
      const next = state.guestDocuments.filter(d => d.id !== id);
      localStorage.setItem('lumiere_guest_docs', JSON.stringify(next));
      return { guestDocuments: next };
    });
  },
  loadDocuments: async () => {
    const { isGuest, token } = get();
    if (isGuest || !token) return;
    
    try {
      const resp = await api<{ items: Document[] }>('/api/documents');
      set({ documents: resp.items || [] });
    } catch (e) {
      console.error('loadDocuments failed', e);
    }
  },
  migrateGuestDocuments: async () => {
    const { isGuest, token, guestDocuments } = get();
    if (isGuest || !token || guestDocuments.length === 0) return;
    try {
      await Promise.all(guestDocuments.map(doc => api('/api/documents', {
        method: 'POST',
        body: JSON.stringify({ title: doc.title, content: doc.content })
      })));
      set({ guestDocuments: [] });
      localStorage.removeItem('lumiere_guest_docs');
      const updated = await api<{ items: Document[] }>('/api/documents');
      set({ documents: updated.items });
    } catch (e) { console.error('Migration failed', e); }
  }
}));