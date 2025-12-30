import React, { useState, useEffect, useRef, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import mermaid from 'mermaid';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });
const MermaidDiagram = ({ code }: { code: string }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const render = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        setError('Mermaid rendering error');
      }
    };
    render();
  }, [code]);
  if (error) return <div className="p-4 bg-destructive/10 text-destructive text-xs rounded-lg">{error}</div>;
  return <div dangerouslySetInnerHTML={{ __html: svg }} className="my-4 flex justify-center bg-white/5 p-4 rounded-xl" />;
};
export const MarkdownPreview = forwardRef<HTMLDivElement, { className?: string }>(({ className }, ref) => {
  const content = useEditorStore((s) => s.content);
  const scrollPercentage = useEditorStore((s) => s.scrollPercentage);
  const internalRef = useRef<HTMLDivElement>(null);
  // Synchronize scrolling from the store
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
      className={cn("h-full w-full overflow-auto bg-card p-6 md:p-10 scroll-smooth", className)}
    >
      <div className="max-w-3xl mx-auto">
        <article className={cn(
          "prose prose-slate dark:prose-invert max-w-none print:prose-black",
          "prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight",
          "prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline",
          "prose-code:text-brand-600 dark:prose-code:text-brand-400 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          "prose-pre:bg-slate-900 prose-pre:border prose-pre:rounded-xl prose-pre:p-4",
          "prose-blockquote:border-l-brand-500 prose-blockquote:bg-brand-50/50 dark:prose-blockquote:bg-brand-900/10 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg"
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