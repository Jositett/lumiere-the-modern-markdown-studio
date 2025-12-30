import { create } from 'zustand';
import type { Document, User, EditorSettings, VersionSnapshot, AdminStats, SubscriptionStatus } from '@shared/types';
import { api } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';
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
  subscriptionStatus: SubscriptionStatus;
  isBanned: boolean;
  isDark: boolean;
  editorSettings: EditorSettings;
  tourComplete: boolean;
  adminStats: AdminStats | null;
  isGuest: boolean;
  guestDocuments: Document[];
  mfaRequired: boolean;
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
  setAuth: (user: User | null) => Promise<void>;
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
  setIsDark: (value: boolean) => void;
  setMfaRequired: (value: boolean) => void;
}
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
  user: null,
  subscriptionStatus: 'free',
  isBanned: false,
  tourComplete: localStorage.getItem('lumiere_tour_complete') === 'true',
  adminStats: null,
  isGuest: true,
  mfaRequired: false,
  isDark: (() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  })(),
  guestDocuments: [],
  editorSettings: (() => {
    const saved = localStorage.getItem('lumiere_settings');
    if (saved) {
      try {
        return { theme: 'vs-dark', fontSize: 16, compactMode: false, ...JSON.parse(saved) };
      } catch (e) {
        return { theme: 'vs-dark', fontSize: 16, compactMode: false };
      }
    }
    return { theme: 'vs-dark', fontSize: 16, compactMode: false };
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
  setAuth: async (user) => {
    if (user) {
      set({ user, isGuest: false, isBanned: !!user.isBanned, subscriptionStatus: user.subscriptionStatus || 'free', mfaRequired: false });
      const state = get();
      if (state.guestDocuments.length > 0) await get().migrateGuestDocuments();
      else await get().loadDocuments();
    } else {
      get().logout();
    }
  },
  logout: async () => {
    await authClient.signOut();
    set({ user: null, documents: [], activeDocumentId: null, content: '', title: '', isGuest: true, isBanned: false, subscriptionStatus: 'free', mfaRequired: false });
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
  deleteGuestDocument: (id: string) => {
    set((state) => {
      const next = state.guestDocuments.filter(d => d.id !== id);
      localStorage.setItem('lumiere_guest_docs', JSON.stringify(next));
      return { guestDocuments: next };
    });
  },
  setIsDark: (nextDark: boolean) => {
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    set({ isDark: nextDark });
  },
  setMfaRequired: (mfaRequired) => set({ mfaRequired }),
  loadDocuments: async () => {
    const isGuest = get().isGuest;
    if (isGuest) return;
    try {
      const resp = await api<{ items: Document[] }>('/api/documents');
      set({ documents: resp.items || [] });
    } catch (e) {
      console.error('loadDocuments failed', e);
    }
  },
  migrateGuestDocuments: async () => {
    const isGuest = get().isGuest;
    const guestDocuments = get().guestDocuments;
    if (isGuest || guestDocuments.length === 0) return;
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