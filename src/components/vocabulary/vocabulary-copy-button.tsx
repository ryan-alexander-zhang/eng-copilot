"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

export function VocabularyCopyButton({
  className,
  word,
}: {
  className: string;
  word: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  return (
    <button
      aria-label={`Copy ${word}`}
      className={className}
      onClick={() => {
        void copyText(word);
        setCopied(true);
      }}
      type="button"
    >
      {copied ? (
        <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      ) : (
        <Copy aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      )}
    </button>
  );
}

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "true");
  input.style.position = "absolute";
  input.style.left = "-9999px";

  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}
