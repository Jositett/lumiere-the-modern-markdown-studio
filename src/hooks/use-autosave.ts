import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/lib/store';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Document } from '@shared/types';
export function useAutoSave() {
  const storeSelectors = useEditorStore((s) => ({
    content: s.content,
    title: s.title,
    activeDocumentId: s.activeDocumentId,
    setSaving: s.setSaving,
    updateDocumentLocally: s.updateDocumentLocally,
    updateGuestDocument: s.updateGuestDocument,
    token: s.token,
  }));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Set debounce timer for 2 seconds
    timerRef.current = setTimeout(async () => {
      const { content, title, activeDocumentId, setSaving, updateDocumentLocally, updateGuestDocument, token } = storeSelectors;
      if (!activeDocumentId) return;
      
      setSaving(true);
      if (!token) {
        updateGuestDocument(activeDocumentId, { content, title });
        toast.success('Saved locally');
        setSaving(false);
        return;
      }

      try {
        const updated = await api<Document>(`/api/documents/${activeDocumentId}`, {
          method: 'PUT',
          body: JSON.stringify({ content, title }),
        });
        toast.success('Saved to cloud');
        updateDocumentLocally(activeDocumentId, { content: updated.content, title: updated.title });
      } catch (error) {
        toast.error('Autosave failed - check connection');
        console.error('[AUTOSAVE ERROR]', error);
      } finally {
        setSaving(false);
      }
    }, 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [storeSelectors]);
}