import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import mermaid from 'mermaid';
import { Loader2, ShieldAlert } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose', // Still "loose" for rendering functionality, but we wrap in manual filters
  fontFamily: 'Inter, sans-serif'
});
const sanitizeMermaid = (code: string) => {
  // Simple heuristic for script injection prevention in diagrams
  const dangerousPatterns = [/<script/i, /javascript:/i, /onclick/i, /onload/i, /onerror/i];
  return !dangerousPatterns.some(p => p.test(code));
};
const MermaidDiagram = ({ code }: { code: string }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  useEffect(() => {
    let isMounted = true;
    const render = async () => {
      if (!sanitizeMermaid(code)) {
        if (isMounted) setError('Security violation detected in diagram source');
        setIsRendering(false);
        return;
      }
      setIsRendering(true);
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        if (isMounted) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError('Mermaid rendering error');
      } finally {
        if (isMounted) setIsRendering(false);
      }
    };
    render();
    return () => {
      isMounted = false;
    };
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
}
export const MarkdownPreview = ({
  content: propsContent,
  scrollPercentage: propsScroll,
  className
}: MarkdownPreviewProps) => {
  const storeContent = useEditorStore((s) => s.content);
  const storeScroll = useEditorStore((s) => s.scrollPercentage);
  const setScrollPercentage = useEditorStore((s) => s.setScrollPercentage);
  const content = propsContent !== undefined ? propsContent : storeContent;
  const scrollPercentage = propsScroll !== undefined ? propsScroll : storeScroll;
  const internalRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const prevPercRef = useRef(0);
  const scrollPercentageRef = useRef(0);

  const handlePreviewScroll = useCallback(() => {
    const el = internalRef.current;
    if (!el) return;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      const currentEl = internalRef.current;
      if (!currentEl) return;
      const scrollable = Math.max(1, currentEl.scrollHeight - currentEl.clientHeight);
      const perc = currentEl.scrollTop / scrollable;
      if (Number.isFinite(perc)) {
        prevPercRef.current = perc;
        if (Math.abs(perc - scrollPercentageRef.current) > 0.01) {
          setScrollPercentage(Math.max(0, Math.min(1, perc)));
        }
      }
      rafRef.current = null;
    });
  }, [setScrollPercentage]);
  useEffect(() => {
    const el = internalRef.current;
    if (el) {
      const scrollable = Math.max(0, el.scrollHeight - el.clientHeight);
      const targetScroll = scrollPercentage * scrollable;
      if (Math.abs(targetScroll - el.scrollTop) > 1) {
        prevPercRef.current = scrollPercentage;
        el.scrollTo({ top: targetScroll, behavior: 'auto' });
      }
    }
  }, [scrollPercentage]);

  useEffect(() => {
    scrollPercentageRef.current = scrollPercentage;
  }, [scrollPercentage]);
  return (
    <div
      ref={internalRef}
      onScroll={handlePreviewScroll}
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
            rehypePlugins={[rehypeHighlight, rehypeKatex]}
            components={{
              code({ node, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                if (match?.[1] === 'mermaid') {
                  return <MermaidDiagram code={String(children).replace(/\n$/, '')} />;
                }
                // Prevent dangerously huge inline code blocks
                return <code className={cn(className, "break-words")} {...props}>{children}</code>;
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};