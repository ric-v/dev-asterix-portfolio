"use client";

import ReactMarkdown from "react-markdown";
// @ts-ignore
import remarkGfm from "remark-gfm";
// @ts-ignore
import rehypeHighlight from "rehype-highlight";
// Important: we need to import highlight.js CSS globally or here
import "highlight.js/styles/atom-one-dark.css";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert prose-cyan max-w-none 
      prose-headings:font-semibold prose-headings:tracking-tight 
      prose-a:text-cyan-glowing hover:prose-a:text-cyan-glowing/80
      prose-img:rounded-xl prose-img:border prose-img:border-glass-border
      prose-hr:border-glass-border prose-blockquote:border-l-cyan-glowing
      prose-blockquote:bg-cyan-glowing/5 prose-blockquote:py-1 prose-blockquote:px-3
      prose-blockquote:rounded-r-lg prose-table:border-glass-border">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
