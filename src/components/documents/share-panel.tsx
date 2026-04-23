import Link from "next/link";

type SharePanelProps = {
  share: {
    token: string;
    isActive: boolean;
  } | null;
  enableAction: () => Promise<void>;
  revokeAction: () => Promise<void>;
};

export function SharePanel({ share, enableAction, revokeAction }: SharePanelProps) {
  const isActive = share?.isActive ?? false;
  const sharePath = share ? `/shared/${share.token}` : null;

  return (
    <section className="surface-card">
      <h2 className="display-copy text-3xl font-semibold text-zinc-950">Sharing</h2>
      <p className="mt-3 text-sm leading-7 text-zinc-600">
        Turn on a view-only page when someone else needs the same highlights and notes without
        editing the original document.
      </p>
      {isActive && sharePath ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-[1.25rem] border border-zinc-200/80 bg-zinc-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Shared page</p>
            <Link
              className="mt-2 block text-sm font-medium text-sky-700 underline-offset-4 hover:underline"
              href={sharePath}
            >
              Open shared view
            </Link>
            <p className="mt-2 break-all text-xs text-zinc-500">{sharePath}</p>
          </div>
          <form action={revokeAction}>
            <button className="button-secondary w-full justify-center sm:w-auto" type="submit">
              Turn off sharing
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <p className="rounded-[1.25rem] border border-zinc-200/80 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
            Sharing is off. Turn it on when someone else needs a read-only view.
          </p>
          <form action={enableAction}>
            <button className="button-primary w-full justify-center sm:w-auto" type="submit">
              Turn on sharing
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
