"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Custom-styled Markdown renderer. The Tailwind Typography plugin isn't
 * installed in this project, so we provide our own minimal-but-polished
 * element styles for headings, lists, tables, code, and blockquotes.
 */
export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "doc-markdown max-w-none break-words text-[0.94rem] leading-7 text-slate-700",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="mb-5 mt-2 border-b border-slate-200 pb-4 font-serif text-3xl font-bold tracking-tight text-slate-950"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="mb-3 mt-9 flex items-center gap-3 border-b border-slate-200 pb-2 text-xl font-bold tracking-tight text-slate-950 before:h-5 before:w-1 before:rounded-full before:bg-[var(--doc-accent)]"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="mb-2 mt-6 text-lg font-semibold text-slate-900" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold mt-3 mb-1" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-sm font-semibold mt-3 mb-1" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-sm font-medium mt-2 mb-1" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="my-3 leading-7" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 space-y-1 my-3" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 space-y-1 my-3" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed pl-1" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-foreground" {...props} />
          ),
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-5 rounded-r-xl border-l-4 border-[var(--doc-accent-2)] bg-amber-50 px-5 py-3 text-slate-700"
              {...props}
            />
          ),
          code: ({ node, className: cName, children, ...props }) => (
            <code
              className={cn(
                "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]",
                cName
              )}
              {...props}
            >
              {children}
            </code>
          ),
          pre: ({ node, children, ...props }) => (
            <pre
              className="rounded-lg bg-muted p-4 overflow-x-auto my-4 font-mono text-xs leading-relaxed"
              {...props}
            >
              {children}
            </pre>
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full min-w-[34rem] border-collapse text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-[var(--doc-accent)] text-white" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="border-b border-white/20 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
              {...props}
            />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-slate-100 bg-white" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="even:bg-slate-50/70" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border-b border-slate-100 px-4 py-3 align-top" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="border-border my-6" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
