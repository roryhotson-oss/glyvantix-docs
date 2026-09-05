"use client";

import type { ReactNode } from "react";
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
        "doc-markdown max-w-none break-words text-[0.94rem] leading-7 text-slate-700 print:text-[0.9rem]",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="mb-7 mt-1 border-b-2 border-[var(--doc-accent)]/25 pb-5 font-serif text-[2rem] font-bold leading-tight tracking-[-0.02em] text-slate-950 sm:text-[2.35rem]"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="mb-4 mt-10 flex scroll-mt-6 items-center gap-3 border-b border-slate-200 pb-3 text-[1.08rem] font-bold uppercase tracking-[0.08em] text-slate-950 before:h-6 before:w-1 before:rounded-full before:bg-[var(--doc-accent)] first:mt-0"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="mb-2 mt-7 text-base font-bold text-slate-900" {...props} />
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
            <p className="my-3 leading-7 [&+p]:mt-2" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="my-4 list-disc space-y-1.5 pl-6" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-4 list-decimal space-y-1.5 pl-6" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="pl-1 leading-relaxed marker:text-[var(--doc-accent)]" {...props} />
          ),
          input: ({ node, ...props }) => (
            <input
              type="checkbox"
              readOnly
              className="mr-2 h-4 w-4 translate-y-0.5 accent-[var(--doc-accent)]"
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-foreground" {...props} />
          ),
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-6 rounded-r-xl border-l-4 border-[var(--doc-accent-2)] bg-amber-50/80 px-5 py-4 text-[0.92rem] text-slate-700 shadow-sm"
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
              className="my-5 overflow-x-auto rounded-lg bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100"
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
            <div className="my-7 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm print:shadow-none">
              <table className="w-full min-w-[34rem] border-collapse text-[0.83rem] leading-6" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-[var(--doc-accent)] text-white" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="border-b border-white/20 px-4 py-3 text-left text-[0.68rem] font-bold uppercase tracking-[0.1em]"
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
            <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-700" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-0 border-t-2 border-dashed border-slate-200" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
