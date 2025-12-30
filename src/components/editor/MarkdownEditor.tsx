import React, { useCallback, useRef, useEffect } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { lineWrappingConfig, EditorView } from '@codemirror/view';
import * as themes from '@uiw/codemirror-themes';
import { useEditorStore } from '@/lib/store';
export function MarkdownEditor() {
  const content = useEditorStore((s) => s.content);
  const setContent = useEditorStore((s) => s.setContent);
  const activeDocumentId = useEditorStore((s) => s.activeDocumentId);
  const editorSettings = useEditorStore((s) => s.editorSettings);
  const setScrollPercentage = useEditorStore((s) => s.setScrollPercentage);
  const themeName = (editorSettings.theme || 'vscodeDark') as string;
  const scrollPercentage = useEditorStore((s) => s.scrollPercentage);
  const viewRef = useRef<EditorView | null>(null);
  const rafRef = useRef(0);
  const cmRef = useRef<any>(null);
  const lastScrollTopRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  // Use bracket notation to avoid TS2339 property access errors on dynamic themes
  const selectedTheme = (themes as any)[themeName] || (themes as any)['vscodeDark'];
  const handleScroll = useCallback((view: EditorView) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      isUserScrollingRef.current = true;
      const { scrollHeight, clientHeight, scrollTop } = view.scrollDOM;
      if (scrollHeight > clientHeight) {
        const percentage = scrollTop / (scrollHeight - clientHeight);
        if (isFinite(percentage)) {
          lastScrollTopRef.current = scrollTop;
          setScrollPercentage(percentage);
        }
      }
      setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 100);
    });
  }, [setScrollPercentage]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (scrollPercentage !== undefined && viewRef.current && !isUserScrollingRef.current) {
      const view = viewRef.current;
      const scrollDOM = view.scrollDOM;
      const targetScrollTop = scrollPercentage * (scrollDOM.scrollHeight - scrollDOM.clientHeight);
      const delta = targetScrollTop - scrollDOM.scrollTop;
      if (Math.abs(delta) > 5) {
        scrollDOM.scrollTo({
          top: targetScrollTop,
          behavior: 'auto'
        });
        lastScrollTopRef.current = targetScrollTop;
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
      <CodeMirror
        value={content}
        height="100%"
        theme={selectedTheme}
        ref={(ref) => {
          cmRef.current = ref;
          if (ref?.view) viewRef.current = ref.view;
        }}
        extensions={[
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          EditorView.lineWrapping.of(lineWrappingConfig.proseWrap(true)),
          EditorView.domEventHandlers({
            scroll: (event, view) => {
              handleScroll(view);
            }
          })
        ]}
        onChange={(value) => setContent(value)}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
        }}
        style={{ fontSize: `${editorSettings.fontSize}px` }}
        className="h-full font-mono selection:bg-brand-500/30"
      />
    </div>
  );
}