import Link from "next/link";

const featurePills = [
  "Read in context",
  "Catch key vocabulary",
  "Save notes beside the text",
  "Share a clean view",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1a1a1a]">
      <div className="mx-auto w-full max-w-[1440px]">
        <section className="px-5 pb-16 pt-10 sm:px-10 lg:px-[120px] lg:pb-[64px]">
          <header className="flex items-center justify-between">
            <Link
              className="font-[var(--font-display)] text-[18px] font-semibold tracking-[-0.03em] text-[#1a1a1a] sm:text-[22px]"
              href="/"
            >
              Eng Copilot
            </Link>
            <nav className="flex items-center gap-3 text-[11px] font-medium text-[#666666] sm:gap-6 sm:text-[13px]">
              <Link href="/sign-in">Sign in</Link>
              <Link href="/documents">Workspace</Link>
            </nav>
          </header>

          <div className="mt-12 flex flex-col items-center text-center sm:mt-16">
            <p className="font-[var(--font-sans)] text-[11px] font-medium text-[#666666] sm:text-[13px]">
              Focused reading for study notes and long-form docs
            </p>
            <h1 className="mt-[22px] max-w-[840px] font-[var(--font-display)] text-[42px] font-semibold leading-[1.08] tracking-[-0.05em] text-[#1a1a1a] sm:text-[54px] lg:text-[62px]">
              Make long Markdown documents easier to read, review, and share.
            </h1>
            <p className="mt-[22px] max-w-[760px] text-[15px] leading-[1.45] text-[#666666] sm:text-[18px]">
              Upload one document, keep notes beside the exact passage, and send someone the same
              reading view when you are ready to share it.
            </p>
            <div className="mt-[22px] flex flex-col items-center gap-3 sm:flex-row sm:gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-[999px] bg-[#4A9FD8] px-6 py-[14px] text-[14px] font-semibold text-white shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                href="/documents"
              >
                Open your workspace
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-[999px] border border-[#CBD5E1] bg-white px-6 py-[14px] text-[14px] font-medium text-[#1a1a1a]"
                href="/sign-in"
              >
                Sign in with Google
              </Link>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center">
            <h2 className="max-w-[620px] text-center font-[var(--font-display)] text-[28px] font-semibold leading-[1.15] tracking-[-0.04em] text-[#1a1a1a] sm:text-[36px]">
              Built for focused study and review.
            </h2>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
              {featurePills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-[9999px] bg-[#F6F7F8] px-3 py-2 font-[var(--font-sans)] text-[12px] font-medium text-[#666666]"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mt-12 hidden h-[680px] lg:block">
            <div className="absolute left-[300px] top-[90px] h-[520px] w-[760px] rotate-[-3deg] rounded-[12px] border border-[#E6E8EB] bg-white px-4 py-4 shadow-[0_4px_6px_rgba(0,0,0,0.03),0_16px_40px_rgba(0,0,0,0.07)]">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold text-[#1A1A1A]">Your library</p>
                <p className="font-[var(--font-sans)] text-[12px] text-[#666666]">recent files</p>
              </div>
              <div className="mt-[14px] space-y-[14px]">
                <div className="h-[34px] w-[205px] rounded-[999px] border border-[#E5E7EB] bg-[#FBFBFB] px-3 py-[9px] text-[12px] text-[#9AA0A6]">
                  Find a document
                </div>
                <div className="h-[308px] rounded-[8px] border border-[#DDD7FF] bg-white px-4 py-4">
                  <div className="h-full overflow-hidden rounded-[4px] bg-[#FCFCFF] px-3 py-3 font-mono text-[11px] leading-[1.65] text-[#5A5A68]">
                    <p># Reading Notes</p>
                    <p className="mt-2">&gt; &quot;Well begun is half done.&quot;</p>
                    <p>&gt; Aristotle</p>
                    <p className="mt-3">## Keep in mind</p>
                    <p className="mt-1">- &quot;Simplify, simplify.&quot;</p>
                    <p>  - Henry David Thoreau</p>
                    <p className="mt-1">- &quot;The only way to have a</p>
                    <p>  good friend is to be one.&quot;</p>
                    <p>  - Ralph Waldo Emerson</p>
                  </div>
                </div>
                <p className="font-[var(--font-sans)] text-[11px] text-[#666666]">
                  Pick a page and continue where you left off.
                </p>
              </div>
            </div>

            <div className="absolute left-[520px] top-[180px] h-[420px] w-[640px] rotate-[6deg] rounded-[12px] border border-[#E6E8EB] bg-white px-[18px] py-[18px] shadow-[0_4px_6px_rgba(0,0,0,0.03),0_16px_40px_rgba(0,0,0,0.07)]">
              <p className="text-[18px] font-semibold text-[#1A1A1A]">study-notes.md</p>
              <p className="mt-[14px] max-w-full text-[16px] leading-[1.45] text-[#1A1A1A]">
                Keep your reading surface clean, then save notes exactly where they matter.
              </p>
              <div className="mt-[14px] flex items-center gap-2">
                <span className="rounded-[9999px] bg-[#EEF5FB] px-[10px] py-[6px] font-[var(--font-sans)] text-[12px] font-medium text-[#4A9FD8]">
                  vocabulary
                </span>
                <span className="rounded-[9999px] bg-[#F0F2F4] px-[10px] py-[6px] font-[var(--font-sans)] text-[12px] font-medium text-[#666666]">
                  note
                </span>
              </div>
              <div className="mt-5 rounded-[8px] border border-[#EEF0F2] bg-[#FAFBFC] px-4 py-4">
                <div className="max-h-[250px] overflow-hidden font-mono text-[11px] leading-[1.68] text-[#5D6470]">
                  <p>## Marginalia</p>
                  <p className="mt-2">&gt; &quot;The only way to have a</p>
                  <p>&gt; good friend is to be one.&quot;</p>
                  <p>&gt; Ralph Waldo Emerson</p>
                  <p className="mt-3">- highlight: ability</p>
                  <p>- note: ties action to character</p>
                  <p className="mt-3">### Reminder</p>
                  <p>Keep the language simple,</p>
                  <p>precise, and easy to review.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-4 lg:hidden">
            <div className="rounded-[12px] border border-[#E6E8EB] bg-white p-4 shadow-[0_4px_6px_rgba(0,0,0,0.03),0_16px_40px_rgba(0,0,0,0.07)]">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold text-[#1A1A1A]">Your library</p>
                <p className="font-[var(--font-sans)] text-[12px] text-[#666666]">recent files</p>
              </div>
              <div className="mt-4 rounded-[8px] border border-[#DDD7FF] bg-white px-4 py-4">
                <div className="max-h-[180px] overflow-hidden rounded-[4px] bg-[#FCFCFF] px-3 py-3 font-mono text-[11px] leading-[1.65] text-[#5A5A68]">
                  <p># Reading Notes</p>
                  <p className="mt-2">&gt; &quot;Well begun is half done.&quot;</p>
                  <p>&gt; Aristotle</p>
                  <p className="mt-3">## Keep in mind</p>
                  <p className="mt-1">- &quot;Simplify, simplify.&quot;</p>
                  <p>  - Henry David Thoreau</p>
                  <p className="mt-1">- &quot;The only way to have a</p>
                  <p>  good friend is to be one.&quot;</p>
                  <p>  - Ralph Waldo Emerson</p>
                </div>
              </div>
            </div>
            <div className="rounded-[12px] border border-[#E6E8EB] bg-white p-[18px] shadow-[0_4px_6px_rgba(0,0,0,0.03),0_16px_40px_rgba(0,0,0,0.07)]">
              <p className="text-[18px] font-semibold text-[#1A1A1A]">study-notes.md</p>
              <p className="mt-[14px] text-[16px] leading-[1.45] text-[#1A1A1A]">
                Keep your reading surface clean, then save notes exactly where they matter.
              </p>
              <div className="mt-[14px] flex items-center gap-2">
                <span className="rounded-[9999px] bg-[#EEF5FB] px-[10px] py-[6px] font-[var(--font-sans)] text-[12px] font-medium text-[#4A9FD8]">
                  vocabulary
                </span>
                <span className="rounded-[9999px] bg-[#F0F2F4] px-[10px] py-[6px] font-[var(--font-sans)] text-[12px] font-medium text-[#666666]">
                  note
                </span>
              </div>
              <div className="mt-5 rounded-[8px] border border-[#EEF0F2] bg-[#FAFBFC] px-4 py-4">
                <div className="max-h-[200px] overflow-hidden font-mono text-[11px] leading-[1.68] text-[#5D6470]">
                  <p>## Marginalia</p>
                  <p className="mt-2">&gt; &quot;The only way to have a</p>
                  <p>&gt; good friend is to be one.&quot;</p>
                  <p>&gt; Ralph Waldo Emerson</p>
                  <p className="mt-3">- highlight: ability</p>
                  <p>- note: ties action to character</p>
                  <p className="mt-3">### Reminder</p>
                  <p>Keep the language simple,</p>
                  <p>precise, and easy to review.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
