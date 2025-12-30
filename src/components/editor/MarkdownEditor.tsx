import React, { useRef, useEffect, useMemo } from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import { useEditorStore } from '@/lib/store';
import { useTheme } from '@/hooks/use-theme';
import { MONACO_THEMES } from '@/lib/monaco-themes';
// Configure Monaco loader to be faster
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
    editor.onDidScrollChange((e) => {
      if (isSyncingRef.current) return;
      const layoutInfo = editor.getLayoutInfo();
      const scrollHeight = editor.getScrollHeight();
      const scrollTop = editor.getScrollTop();
      const visibleHeight = layoutInfo.height;
      const scrollable = scrollHeight - visibleHeight;
      if (scrollable > 10) {
        const percentage = scrollTop / scrollable;
        isSyncingRef.current = true;
        setScrollPercentage(percentage);
        setTimeout(() => { isSyncingRef.current = false; }, 50);
      }
    });
  };
  useEffect(() => {
    if (editorRef.current && !isSyncingRef.current) {
      const editor = editorRef.current;
      const scrollHeight = editor.getScrollHeight();
      const layoutInfo = editor.getLayoutInfo();
      const visibleHeight = layoutInfo.height;
      const scrollable = scrollHeight - visibleHeight;
      if (scrollable <= 0) return;
      const targetScrollTop = scrollPercentage * scrollable;
      if (Math.abs(editor.getScrollTop() - targetScrollTop) > 2) {
        isSyncingRef.current = true;
        editor.setScrollTop(targetScrollTop);
        setTimeout(() => { isSyncingRef.current = false; }, 50);
      }
    }
  }, [scrollPercentage]);
  if (!activeDocumentId) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/5 text-muted-foreground font-display">
        <div className="text-center p-8 border-2 border-dashed rounded-3xl max-w-md">
          <p className="text-xl font-medium mb-2">No Document Selected</p>
          <p className="text-sm opacity-70">Create a new document or select one from the sidebar to begin your journey.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full w-full overflow-hidden bg-background">
      <Editor
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
          lineNumbers: editorSettings.compactMode ? 'off' : 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 20 },
          fontFamily: 'JetBrains Mono, monospace',
          selectionHighlight: true,
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
          }
        }}
      />
    </div>
  );
}