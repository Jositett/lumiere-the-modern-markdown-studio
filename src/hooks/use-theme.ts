import { useEffect } from 'react';
import { useEditorStore } from '@/lib/store';

type MediaQueryListEvent = { matches: boolean };

export function useTheme() {
  const isDark = useEditorStore((s) => s.isDark);
  const setIsDark = useEditorStore((s) => s.setIsDark);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved && saved !== (isDark ? 'dark' : 'light')) {
      setIsDark(saved === 'dark');
    }
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark, setIsDark]);

  const toggleTheme = () => {
    const newDark = !useEditorStore.getState().isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handle = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mql.addEventListener('change', handle);
    return () => mql.removeEventListener('change', handle);
  }, [setIsDark]);

  return { isDark, toggleTheme };
}
