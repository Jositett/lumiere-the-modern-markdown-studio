import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import 'highlight.js/styles/github-dark.css';
export function MarkdownPreview({ className }: { className?: string }) {
  const content = useEditorStore((s) => s.content);
  return (
    <div className={cn("h-full w-full overflow-auto bg-card p-6 md:p-10", className)}>
      <div className="max-w-3xl mx-auto">
        <article className={cn(
          "prose prose-slate dark:prose-invert max-w-none",
          "prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight",
          "prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl",
          "prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline",
          "prose-code:text-brand-600 dark:prose-code:text-brand-400 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-slate-900 prose-pre:border prose-pre:rounded-xl prose-pre:p-4",
          "prose-img:rounded-xl prose-img:shadow-lg",
          "prose-blockquote:border-l-brand-500 prose-blockquote:bg-brand-50/50 dark:prose-blockquote:bg-brand-900/10 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg"
        )}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}