import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { useEditorStore } from '@/lib/store';
import { useTheme } from '@/hooks/use-theme';
export function MarkdownEditor() {
  const content = useEditorStore((s) => s.content);
  const setContent = useEditorStore((s) => s.setContent);
  const activeDocumentId = useEditorStore((s) => s.activeDocumentId);
  const { isDark } = useTheme();
  if (!activeDocumentId) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/5 text-muted-foreground font-display">
        <div className="text-center p-8 border-2 border-dashed rounded-3xl">
          <p className="text-xl font-medium mb-2">No Document Selected</p>
          <p className="text-sm opacity-70">Create a new document or select one from the sidebar to begin.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full w-full overflow-hidden bg-background">
      <CodeMirror
        value={content}
        height="100%"
        theme={isDark ? 'dark' : 'light'}
        extensions={[markdown({ base: markdownLanguage })]}
        onChange={(value) => setContent(value)}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
        }}
        className="h-full text-base sm:text-lg font-mono selection:bg-brand-200 dark:selection:bg-brand-800"
      />
    </div>
  );
}