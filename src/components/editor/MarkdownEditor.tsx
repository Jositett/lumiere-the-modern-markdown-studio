import React, { useRef, useEffect, useMemo } from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import { useEditorStore } from '@/lib/store';
import { useTheme } from '@/hooks/use-theme';
import { MONACO_THEMES } from '@/lib/monaco-themes';
loader.config({
  paths: {
    vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
  }
});
export function MarkdownEditor() {
  const content = useEditorStore((s) => s.content);
  const setContent = useEditorStore((s) => s.setContent);
  const activeDocumentId = useEditorStore((s) => s.activeDocumentId);
  const editorSettings = useEditorStore((s) => s.editorSettings);
  const setScrollPercentage = useEditorStore((s) => s.setScrollPercentage);
  const scrollPercentage = useEditorStore((s) => s.scrollPercentage);
  const { isDark } = useTheme();
  const editorRef = useRef<any>(null);
  const isSyncingRef = useRef(false);
  const lastScrollUpdateRef = useRef(0);
  const selectedTheme = useMemo(() => {
    if (editorSettings.theme === 'auto') return isDark ? 'vs-dark' : 'vs';
    return editorSettings.theme;
  }, [editorSettings.theme, isDark]);
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
    }
  };
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    // Register custom themes
    Object.entries(MONACO_THEMES).forEach(([name, data]) => {
      monaco.editor.defineTheme(name, data);
    });
    const scrollListener = editor.onDidScrollChange((e) => {
      const now = Date.now();
      // Guard against internal sync and rapid flutter
      if (isSyncingRef.current || now - lastScrollUpdateRef.current < 16) return;
      const layoutInfo = editor.getLayoutInfo();
      const scrollHeight = editor.getScrollHeight();
      const scrollTop = editor.getScrollTop();
      const visibleHeight = layoutInfo.height;
      const scrollable = scrollHeight - visibleHeight;
      if (scrollable > 10) {
        const percentage = scrollTop / scrollable;
        isSyncingRef.current = true;
        lastScrollUpdateRef.current = now;
        setScrollPercentage(percentage);
        // Short timeout to release lock after state propagates
        setTimeout(() => { isSyncingRef.current = false; }, 32);
      }
    });
    // Cleanup listener on unmount is handled by monaco component usually,
    // but we can ensure stability by tracking it if needed.
  };
  useEffect(() => {
    if (editorRef.current && !isSyncingRef.current) {
      const editor = editorRef.current;
      const layoutInfo = editor.getLayoutInfo();
      const scrollHeight = editor.getScrollHeight();
      const visibleHeight = layoutInfo.height;
      const scrollable = scrollHeight - visibleHeight;
      if (scrollable <= 0) return;
      const targetScrollTop = scrollPercentage * scrollable;
      // Precision check to avoid infinite loops from minor float diffs
      if (Math.abs(editor.getScrollTop() - targetScrollTop) > 1.5) {
        isSyncingRef.current = true;
        editor.setScrollTop(targetScrollTop);
        setTimeout(() => { isSyncingRef.current = false; }, 32);
      }
    }
  }, [scrollPercentage]);
  if (!activeDocumentId) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/5 text-muted-foreground font-display">
        <div className="text-center p-8 border-2 border-dashed rounded-3xl max-w-md animate-in fade-in zoom-in-95 duration-500">
          <p className="text-xl font-bold mb-2">No Document Selected</p>
          <p className="text-sm opacity-70">Create a new document or select one from the library to begin your creative journey.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full w-full overflow-hidden bg-background">
      <Editor
        key={activeDocumentId} // Force fresh editor instance on doc change for stability
        height="100%"
        defaultLanguage="markdown"
        value={content}
        theme={selectedTheme}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        options={{
          fontSize: editorSettings.fontSize,
          wordWrap: 'on',
          minimap: { enabled: false },
          lineNumbers: editorSettings.compactMode ? 'off' : 'interval',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 24, bottom: 24 },
          fontFamily: 'JetBrains Mono, monospace',
          selectionHighlight: true,
          renderLineHighlight: 'gutter',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          folding: false,
          glyphMargin: false,
          overviewRulerLanes: 0,
          lineHeight: 22,
          fontLigatures: true,
          scrollPredominantAxis: true,
          codeLens: false,
          fixedOverflowWidgets: true, // Prevents tooltips from being clipped by panel borders
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          }
        }}
      />
    </div>
  );
}