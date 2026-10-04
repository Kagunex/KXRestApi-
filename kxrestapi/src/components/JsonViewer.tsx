"use client";

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
          if (/:$/.test(match)) {
            cls = "json-key";
          } else {
            cls = "json-string";
          }
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
    <pre
      className={`overflow-x-auto rounded border border-surface-border bg-surface p-3 text-[13px] leading-relaxed ${className}`}
    >
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}
