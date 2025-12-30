import React, { useState, useEffect, useRef, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import mermaid from 'mermaid';
import { Loader2 } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
mermaid.initialize({ 
  startOnLoad: true, 
  theme: 'dark', 
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif'
});
const MermaidDiagram = ({ code }: { code: string }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  useEffect(() => {
    let isMounted = true;
    const render = async () => {
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
    return () => { isMounted = false; };
  }, [code]);
  if (error) return <div className="p-4 bg-destructive/10 text-destructive text-xs rounded-lg font-mono">{error}</div>;
  return (
    <div className="my-6 relative min-h-[100px] flex items-center justify-center bg-muted/30 dark:bg-slate-900/50 p-6 rounded-2xl border border-border/50 transition-all">
      {isRendering ? (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Rendering Diagram</span>
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
export const MarkdownPreview = forwardRef<HTMLDivElement, MarkdownPreviewProps>(({
  content: propsContent,
  scrollPercentage: propsScroll,
  className
}, ref) => {
  const storeContent = useEditorStore((s) => s.content);
  const storeScroll = useEditorStore((s) => s.scrollPercentage);
  const content = propsContent !== undefined ? propsContent : storeContent;
  const scrollPercentage = propsScroll !== undefined ? propsScroll : storeScroll;
  const internalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = internalRef.current;
    if (el) {
      const targetScroll = scrollPercentage * (el.scrollHeight - el.clientHeight);
      el.scrollTo({ top: targetScroll, behavior: 'auto' });
    }
  }, [scrollPercentage]);
  return (
    <div
      ref={(node) => {
        (internalRef as any).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as any).current = node;
      }}
      className={cn("h-full w-full overflow-auto bg-card p-6 md:p-10 scroll-smooth selection:bg-brand-100 dark:selection:bg-brand-900", className)}
    >
      <div className="max-w-3xl mx-auto">
        <article className={cn(
          "prose prose-slate dark:prose-invert max-w-none print:prose-black",
          "prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight",
          "prose-a:text-brand-600 dark:prose-a:text-brand-400 prose-a:no-underline hover:prose-a:underline transition-colors",
          "prose-code:text-brand-600 dark:prose-code:text-brand-400 prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl prose-pre:p-6 prose-pre:shadow-xl",
          "prose-blockquote:border-l-brand-500 prose-blockquote:bg-brand-500/5 dark:prose-blockquote:bg-brand-400/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:font-medium",
          "prose-img:rounded-2xl prose-img:shadow-lg",
          "prose-hr:border-border/50"
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
                return <code className={className} {...props}>{children}</code>;
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
});
MarkdownPreview.displayName = "MarkdownPreview";