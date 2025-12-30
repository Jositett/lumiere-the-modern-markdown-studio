import React from 'react';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Clock, Hash, Type, Cloud, Database } from 'lucide-react';
export function StatusBar() {
  const content = useEditorStore(s => s.content);
  const isSaving = useEditorStore(s => s.isSaving);
  const isGuest = useEditorStore(s => s.isGuest);
  const activeDocumentId = useEditorStore(s => s.activeDocumentId);
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readingTime = Math.ceil(wordCount / 200);
  if (!activeDocumentId) return null;
  return (
    <div className="h-8 border-t bg-muted/20 flex items-center justify-between px-4 text-[11px] font-medium text-muted-foreground select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Hash className="w-3 h-3" />
          <span>{wordCount} words</span>
        </div>
        <div className="flex items-center gap-1.5 hidden md:flex">
          <Type className="w-3 h-3" />
          <span>{charCount} characters</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span>{readingTime} min read</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isSaving ? (
          <div className="flex items-center gap-1.5 text-brand-600 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>Syncing changes...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>All changes saved</span>
          </div>
        )}
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-full",
          isGuest ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30" : "bg-brand-100 text-brand-700 dark:bg-brand-900/30"
        )}>
          {isGuest ? (
            <>
              <Database className="w-3 h-3" />
              <span>Local Storage</span>
            </>
          ) : (
            <>
              <Cloud className="w-3 h-3" />
              <span>Cloud Sync</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}