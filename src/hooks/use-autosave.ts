import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/lib/store';
import { api } from '@/lib/api-client';
import type { Document } from '@shared/types';
export function useAutoSave() {
  const content = useEditorStore((s) => s.content);
  const title = useEditorStore((s) => s.title);
  const activeDocumentId = useEditorStore((s) => s.activeDocumentId);
  const setSaving = useEditorStore((s) => s.setSaving);
  const updateDocumentLocally = useEditorStore((s) => s.updateDocumentLocally);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!activeDocumentId) return;
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Set debounce timer for 2 seconds
    timerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const updated = await api<Document>(`/api/documents/${activeDocumentId}`, {
          method: 'PUT',
          body: JSON.stringify({ content, title }),
        });
        updateDocumentLocally(activeDocumentId, { content: updated.content, title: updated.title });
      } catch (error) {
        console.error('[AUTOSAVE ERROR]', error);
      } finally {
        setSaving(false);
      }
    }, 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, title, activeDocumentId, setSaving, updateDocumentLocally]);
}