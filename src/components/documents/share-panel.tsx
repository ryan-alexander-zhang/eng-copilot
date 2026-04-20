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
    <section>
      <h2>Share</h2>
      <p>Shared viewers must sign in with Google before they can open the document.</p>
      {isActive && sharePath ? (
        <>
          <p>
            Link: <Link href={sharePath}>{sharePath}</Link>
          </p>
          <form action={revokeAction}>
            <button type="submit">Disable share link</button>
          </form>
        </>
      ) : (
        <>
          <p>Shared link is off.</p>
          <form action={enableAction}>
            <button type="submit">Enable share link</button>
          </form>
        </>
      )}
    </section>
  );
}
