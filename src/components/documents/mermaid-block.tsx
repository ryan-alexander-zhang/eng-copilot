"use client";

export function MermaidBlock({ code }: { code: string }) {
  return (
    <div className="mt-8 rounded-[16px] border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-5 py-4 text-[14px] leading-7 text-[#6B7280]">
      <p className="font-medium text-[#374151]">Mermaid preview is not enabled yet.</p>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-[13px] text-[#6B7280]">
        {code}
      </pre>
    </div>
  );
}
