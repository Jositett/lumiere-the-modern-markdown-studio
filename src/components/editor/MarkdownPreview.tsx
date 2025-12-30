import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
export function MarkdownPreview({ className }: { className?: string }) {
  const content = useEditorStore((s) => s.content);
  return (
    <div className={cn("h-full w-full overflow-auto bg-card p-6 md:p-10", className)}>
      <div className="max-w-3xl mx-auto">
        <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-display prose-a:text-brand-600 prose-img:rounded-xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}