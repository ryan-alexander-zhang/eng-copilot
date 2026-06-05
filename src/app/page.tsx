import Link from "next/link";

const featurePills = [
  "Read in context",
  "Catch key vocabulary",
  "Save notes beside the text",
  "Share a clean view",
];

export default function LandingPage() {
  return (
    <main className="app-shell">
      <div className="mx-auto w-full max-w-[1440px]">
        <section className="px-5 pb-16 pt-10 sm:px-10 lg:px-[120px] lg:pb-[64px]">
          <header className="flex items-center justify-between">
            <Link
              className="font-[var(--font-display)] text-[18px] font-semibold tracking-[-0.03em] sm:text-[22px]"
              href="/"
            >
              Eng Copilot
            </Link>
            <nav className="text-muted flex items-center gap-3 text-[11px] font-medium sm:gap-6 sm:text-[13px]">
              <Link href="/sign-in">Sign in</Link>
              <Link href="/documents">Workspace</Link>
            </nav>
          </header>

          <div className="mt-12 flex flex-col items-center text-center sm:mt-16">
            <p className="text-muted font-[var(--font-sans)] text-[11px] font-medium sm:text-[13px]">
              Focused reading for study notes and long-form docs
            </p>
            <h1 className="mt-[22px] max-w-[840px] font-[var(--font-display)] text-[42px] font-semibold leading-[1.08] tracking-[-0.05em] sm:text-[54px] lg:text-[62px]">
              Make long Markdown documents easier to read, review, and share.
            </h1>
            <p className="text-muted mt-[22px] max-w-[760px] text-[15px] leading-[1.45] sm:text-[18px]">
              Upload one document, keep notes beside the exact passage, and send someone the same
              reading view when you are ready to share it.
            </p>
            <div className="mt-[22px] flex flex-col items-center gap-3 sm:flex-row sm:gap-3">
              <Link className="button-primary px-6 py-[14px] text-[14px]" href="/documents">
                Open your workspace
              </Link>
              <Link className="button-secondary px-6 py-[14px] text-[14px]" href="/sign-in">
                Sign in with Google
              </Link>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center">
            <h2 className="max-w-[620px] text-center font-[var(--font-display)] text-[28px] font-semibold leading-[1.15] tracking-[-0.04em] sm:text-[36px]">
              Built for focused study and review.
            </h2>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
              {featurePills.map((pill) => (
                <span
                  key={pill}
                  className="text-muted rounded-[9999px] px-3 py-2 font-[var(--font-sans)] text-[12px] font-medium"
                  style={{ backgroundColor: "var(--surface-soft)" }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mt-12 hidden h-[680px] lg:block">
            <div className="panel-card absolute left-[300px] top-[90px] h-[520px] w-[760px] rotate-[-3deg] px-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold">Your library</p>
                <p className="text-muted font-[var(--font-sans)] text-[12px]">recent files</p>
              </div>
              <div className="mt-[14px] space-y-[14px]">
                <div
                  className="text-muted h-[34px] w-[205px] rounded-[999px] border px-3 py-[9px] text-[12px]"
                  style={{ backgroundColor: "var(--surface-soft)", borderColor: "var(--border)" }}
                >
                  Find a document
                </div>
                <div
                  className="h-[308px] rounded-[8px] border px-4 py-4"
                  style={{ backgroundColor: "var(--surface-strong)", borderColor: "var(--border-strong)" }}
                >
                  <div
                    className="text-soft h-full overflow-hidden rounded-[4px] px-3 py-3 font-mono text-[11px] leading-[1.65]"
                    style={{ backgroundColor: "var(--surface-soft)" }}
                  >
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
                <p className="text-muted font-[var(--font-sans)] text-[11px]">
                  Pick a page and continue where you left off.
                </p>
              </div>
            </div>

            <div className="panel-card absolute left-[520px] top-[180px] h-[420px] w-[640px] rotate-[6deg] px-[18px] py-[18px]">
              <p className="text-[18px] font-semibold">study-notes.md</p>
              <p className="mt-[14px] max-w-full text-[16px] leading-[1.45]">
                Keep your reading surface clean, then save notes exactly where they matter.
              </p>
              <div className="mt-[14px] flex items-center gap-2">
                <span className="badge-accent font-[var(--font-sans)]">
                  vocabulary
                </span>
                <span
                  className="text-muted rounded-[9999px] px-[10px] py-[6px] font-[var(--font-sans)] text-[12px] font-medium"
                  style={{ backgroundColor: "rgba(123, 103, 84, 0.08)" }}
                >
                  note
                </span>
              </div>
              <div
                className="mt-5 rounded-[8px] border px-4 py-4"
                style={{ backgroundColor: "var(--surface-soft)", borderColor: "var(--border)" }}
              >
                <div className="text-soft max-h-[250px] overflow-hidden font-mono text-[11px] leading-[1.68]">
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
            <div className="panel-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold">Your library</p>
                <p className="text-muted font-[var(--font-sans)] text-[12px]">recent files</p>
              </div>
              <div
                className="mt-4 rounded-[8px] border px-4 py-4"
                style={{ backgroundColor: "var(--surface-strong)", borderColor: "var(--border-strong)" }}
              >
                <div
                  className="text-soft max-h-[180px] overflow-hidden rounded-[4px] px-3 py-3 font-mono text-[11px] leading-[1.65]"
                  style={{ backgroundColor: "var(--surface-soft)" }}
                >
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
            <div className="panel-card p-[18px]">
              <p className="text-[18px] font-semibold">study-notes.md</p>
              <p className="mt-[14px] text-[16px] leading-[1.45]">
                Keep your reading surface clean, then save notes exactly where they matter.
              </p>
              <div className="mt-[14px] flex items-center gap-2">
                <span className="badge-accent font-[var(--font-sans)]">
                  vocabulary
                </span>
                <span
                  className="text-muted rounded-[9999px] px-[10px] py-[6px] font-[var(--font-sans)] text-[12px] font-medium"
                  style={{ backgroundColor: "rgba(123, 103, 84, 0.08)" }}
                >
                  note
                </span>
              </div>
              <div
                className="mt-5 rounded-[8px] border px-4 py-4"
                style={{ backgroundColor: "var(--surface-soft)", borderColor: "var(--border)" }}
              >
                <div className="text-soft max-h-[200px] overflow-hidden font-mono text-[11px] leading-[1.68]">
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
