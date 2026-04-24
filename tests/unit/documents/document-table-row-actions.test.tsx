import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentTableRowActions } from "@/components/documents/document-table-row-actions";

const refresh = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DocumentTableRowActions", () => {
  it("opens the share modal from the more-actions menu", async () => {
    render(
      <table>
        <tbody>
          <tr>
            <DocumentTableRowActions
              documentId="doc_123"
              enableShareAction={vi.fn().mockResolvedValue({
                isActive: true,
                token: "share-token",
              })}
              initialShare={{
                isActive: true,
                token: "share-token",
              }}
              moveToTrashAction={vi.fn().mockResolvedValue(undefined)}
              originalName="study-notes.md"
              title="study-notes"
            />
          </tr>
        </tbody>
      </table>,
    );

    fireEvent.click(screen.getByRole("button", { name: /More actions/i }));
    fireEvent.click(screen.getByRole("button", { name: /Enable sharing/i }));

    expect(screen.getByText('Share "study-notes.md"')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/shared\/share-token/)).toBeInTheDocument();
    expect(screen.getByText("Link settings")).toBeInTheDocument();
  });

  it("moves a document to trash from the more-actions menu", async () => {
    const moveToTrashAction = vi.fn().mockResolvedValue(undefined);

    render(
      <table>
        <tbody>
          <tr>
            <DocumentTableRowActions
              documentId="doc_123"
              enableShareAction={vi.fn().mockResolvedValue(null)}
              initialShare={null}
              moveToTrashAction={moveToTrashAction}
              originalName="study-notes.md"
              title="study-notes"
            />
          </tr>
        </tbody>
      </table>,
    );

    fireEvent.click(screen.getByRole("button", { name: /More actions/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Delete$/i }));

    await waitFor(() => {
      expect(moveToTrashAction).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });
});
