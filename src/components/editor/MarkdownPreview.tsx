import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'isomorphic-dompurify';
import { useEditorStore } from '@/lib/store';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import mermaid from 'mermaid';
import { Loader2, ShieldAlert } from 'lucide-react';
import { HIGHLIGHT_JS_MAP } from '@/lib/monaco-themes';
import 'katex/dist/katex.min.css';
const MermaidDiagram = ({ code }: { code: string }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  useEffect(() => {
    let isMounted = true;
    const render = async () => {
      setIsRendering(true);
      setError(null);
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        if (isMounted) setSvg(renderedSvg);
      } catch (err) {
        if (isMounted) setError('Mermaid rendering error');
      } finally {
        if (isMounted) setIsRendering(false);
      }
    };
    render();
    return () => { isMounted = false; };
  }, [code]);
  if (error) return (
    <div className="p-6 bg-rose-50 dark:bg-rose-950/20 text-rose-600 text-xs rounded-2xl border border-rose-100 dark:border-rose-900/50 flex items-center gap-3 font-medium">
      <ShieldAlert className="w-5 h-5 shrink-0" />
      {error}
    </div>
  );
  return (
    <div className="my-8 relative min-h-[120px] flex items-center justify-center bg-muted/20 dark:bg-slate-900/40 p-10 rounded-3xl border border-border/40 transition-all shadow-inner">
      {isRendering ? (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Rendering Studio Diagram</span>
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full flex justify-center overflow-auto" />
      )}
    </div>
  );
};
interface MarkdownPreviewProps {
  content?: string;
  scrollPercentage?: number;
  className?: string;
  readOnly?: boolean;
}
export const MarkdownPreview = ({
  content: propsContent,
  scrollPercentage: propsScroll,
  className,
  readOnly = false
}: MarkdownPreviewProps) => {
  const storeContent = useEditorStore((s) => s.content);
  const { isDark } = useTheme();
  const storeScroll = useEditorStore((s) => s.scrollPercentage);
  const setScrollPercentage = useEditorStore((s) => s.setScrollPercentage);
  const editorSettings = useEditorStore((s) => s.editorSettings);
  const content = propsContent !== undefined ? propsContent : storeContent;
  const scrollPercentage = propsScroll !== undefined ? propsScroll : storeScroll;
  const internalRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);
  const rafRef = useRef<number>(0);
  const handlePreviewScroll = useCallback(() => {
    if (readOnly) return;
    const el = internalRef.current;
    if (!el || isSyncingRef.current) return;
    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable <= 10) return;
    const perc = el.scrollTop / scrollable;
    if (Number.isFinite(perc)) {
      isSyncingRef.current = true;
      setScrollPercentage(perc);
      setTimeout(() => { isSyncingRef.current = false; }, 50);
    }
  }, [setScrollPercentage, readOnly]);

  const throttledScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      handlePreviewScroll();
      rafRef.current = 0;
    });
  }, [handlePreviewScroll]);
  useEffect(() => {
    const el = internalRef.current;
    if (el && !isSyncingRef.current) {
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) return;
      const targetScroll = scrollPercentage * scrollable;
      if (Math.abs(targetScroll - el.scrollTop) > 2) {
        isSyncingRef.current = true;
        el.scrollTo({ top: targetScroll, behavior: 'auto' });
        setTimeout(() => { isSyncingRef.current = false; }, 50);
      }
    }
  }, [scrollPercentage]);
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif'
    });
  }, [isDark]);
  const sanitizedContent = React.useMemo(() => {
    return DOMPurify.sanitize(content, {
      ADD_TAGS: ['iframe', 'svg', 'use'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
    });
  }, [content]);
  useEffect(() => {
    const linkId = 'hljs-theme';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    const themeFromSettings = editorSettings.theme;
    const editorTheme = themeFromSettings === 'auto' ? (isDark ? 'vs-dark' : 'vs') : themeFromSettings;
    const hlTheme = HIGHLIGHT_JS_MAP[editorTheme] || (isDark ? 'github-dark' : 'default');
    const href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/${hlTheme}.min.css`;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== href) {
      link.href = href;
    }
  }, [editorSettings.theme, isDark]);
  return (
    <div
      id="markdown-preview"
      ref={internalRef}
      onScroll={throttledScroll}
      className={cn("h-full w-full overflow-auto bg-card p-6 md:p-12 lg:p-16 scroll-smooth selection:bg-brand-100 dark:selection:bg-brand-900/50", className)}
    >
      <div className="max-w-3xl mx-auto">
        <article className={cn(
          "prose prose-slate dark:prose-invert max-w-none print:prose-black",
          "prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight",
          "prose-a:text-brand-600 dark:prose-a:text-brand-400 prose-a:no-underline hover:prose-a:underline transition-colors",
          "prose-code:text-brand-600 dark:prose-code:text-brand-400 prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl prose-pre:p-8 prose-pre:shadow-2xl",
          "prose-blockquote:border-l-4 prose-blockquote:border-l-brand-500 prose-blockquote:bg-brand-500/5 dark:prose-blockquote:bg-brand-400/5 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-3xl prose-blockquote:not-italic prose-blockquote:font-medium",
          "prose-img:rounded-3xl prose-img:shadow-2xl",
          "prose-hr:border-border/60"
        )}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
            components={{
              code({ node, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                if (match?.[1] === 'mermaid') {
                  return <MermaidDiagram code={String(children).replace(/\n$/, '')} />;
                }
                return <code className={cn(className, "break-words")} {...props}>{children}</code>;
              }
            }}
          >
            {sanitizedContent}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};