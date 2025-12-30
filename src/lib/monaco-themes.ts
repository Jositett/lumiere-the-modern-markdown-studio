import type { editor } from 'monaco-editor';
export const MONACO_THEMES: Record<string, editor.IStandaloneThemeData> = {
  'dracula': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'f8f8f2' },
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'type', foreground: '8be9fd' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'tag', foreground: 'ff79c6' },
      { token: 'attribute.name', foreground: '50fa7b' },
      { token: 'metatag', foreground: 'ff79c6' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editorLineNumber.foreground': '#6272a4',
      'editor.selectionBackground': '#44475a',
      'editor.lineHighlightBackground': '#44475a',
      'editorCursor.foreground': '#f8f8f2',
    }
  },
  'monokai': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'f8f8f2' },
      { token: 'comment', foreground: '75715e' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'type', foreground: '66d9ef' },
      { token: 'number', foreground: 'ae81ff' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editorLineNumber.foreground': '#90908a',
      'editor.selectionBackground': '#49483e',
      'editor.lineHighlightBackground': '#3e3d32',
    }
  },
  'nord': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'd8dee9' },
      { token: 'comment', foreground: '616e88' },
      { token: 'keyword', foreground: '81a1c1' },
      { token: 'string', foreground: 'a3be8c' },
      { token: 'type', foreground: '8fbcbb' },
    ],
    colors: {
      'editor.background': '#2e3440',
      'editor.foreground': '#d8dee9',
      'editorLineNumber.foreground': '#4c566a',
      'editor.selectionBackground': '#434c5e',
      'editor.lineHighlightBackground': '#3b4252',
    }
  },
  'github-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'c9d1d9' },
      { token: 'comment', foreground: '8b949e' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'type', foreground: 'ffa657' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editorLineNumber.foreground': '#6e7681',
      'editor.selectionBackground': '#1f6feb',
      'editor.lineHighlightBackground': '#161b22',
    }
  }
};
export const HIGHLIGHT_JS_MAP: Record<string, string> = {
  'vs-dark': 'github-dark',
  'vs': 'default',
  'hc-black': 'github-dark',
  'dracula': 'dracula',
  'monokai': 'monokai',
  'nord': 'nord',
  'github-dark': 'github-dark'
};