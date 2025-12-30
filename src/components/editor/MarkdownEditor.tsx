import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { useEditorStore } from '@/lib/store';
import { useTheme } from '@/hooks/use-theme';
export function MarkdownEditor() {
  const content = useEditorStore((s) => s.content);
  const setContent = useEditorStore((s) => s.setContent);
  const { isDark } = useTheme();
  return (
    <div className="h-full w-full overflow-hidden bg-background">
      <CodeMirror
        value={content}
        height="100%"
        theme={isDark ? 'dark' : 'light'}
        extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]}
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