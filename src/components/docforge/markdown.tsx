"use client";

import ReactMarkdown from "react-markdown";
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
        "text-sm leading-relaxed text-foreground space-y-3 break-words",
        className
      )}
    >
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-2xl font-bold tracking-tight mt-6 mb-3 font-serif"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-xl font-bold tracking-tight mt-5 mb-2"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />
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
            <p className="leading-relaxed my-2" {...props} />
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
              className="border-l-2 border-emerald-500/60 bg-muted/40 pl-4 italic text-muted-foreground my-4 rounded-r-md py-1"
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
            <div className="overflow-x-auto my-4 rounded-md border border-border">
              <table
                className="w-full border-collapse text-sm"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted/60" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="border-b border-border px-3 py-2 text-left font-semibold"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="border-b border-border px-3 py-2" {...props} />
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
