import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/lib/store';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Document } from '@shared/types';
export function useAutoSave() {
  const content = useEditorStore(s => s.content);
  const title = useEditorStore(s => s.title);
  const activeDocumentId = useEditorStore(s => s.activeDocumentId);
  const setSaving = useEditorStore(s => s.setSaving);
  const updateDocumentLocally = useEditorStore(s => s.updateDocumentLocally);
  const updateGuestDocument = useEditorStore(s => s.updateGuestDocument);
  const token = useEditorStore(s => s.token);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Set debounce timer for 2 seconds
    timerRef.current = setTimeout(async () => {
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
  }, [content, title, activeDocumentId, token, setSaving, updateDocumentLocally, updateGuestDocument]);
}