"use client";

import { CopyButton } from "./copy-button";

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "json-number";
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "json-key" : "json-string";
        } else if (/true|false/.test(match)) {
          cls = "json-boolean";
        } else if (/null/.test(match)) {
          cls = "json-null";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

interface JsonViewerProps {
  data: unknown;
  className?: string;
}

export function JsonViewer({ data, className = "" }: JsonViewerProps) {
  const text = JSON.stringify(data, null, 2);
  const html = syntaxHighlight(text);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute right-2 top-2 z-10">
        <CopyButton text={text} label="Copy JSON" />
      </div>
      <pre className="overflow-x-auto rounded border border-surface-border bg-surface p-3 pr-24 text-[13px] leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
