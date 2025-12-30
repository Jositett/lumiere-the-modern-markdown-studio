import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import * as themes from '@uiw/codemirror-themes';
import { useEditorStore } from '@/lib/store';
export function MarkdownEditor() {
  const content = useEditorStore((s) => s.content);
  const setContent = useEditorStore((s) => s.setContent);
  const activeDocumentId = useEditorStore((s) => s.activeDocumentId);
  const editorSettings = useEditorStore((s) => s.editorSettings);
  const themeName = (editorSettings.theme || 'vscodeDark') as keyof typeof themes;
  const selectedTheme = themes[themeName] || themes.vscodeDark;
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
        theme={selectedTheme as any}
        extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]}
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