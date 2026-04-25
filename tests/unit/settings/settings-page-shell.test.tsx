import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SettingsPageShell } from "@/components/settings/settings-page-shell";

const baseProps = {
  activeTab: "profile" as const,
  sessions: [
    {
      id: "session-1",
      label: "Current browser",
      detail: "Expires May 15, 2026",
      isCurrent: true,
    },
  ],
  user: {
    displayName: "Jane Notes",
    email: "jane.notes@example.com",
    image: null,
    initial: "JN",
    username: "jane-notes",
  },
  deleteAllDataAction: async () => {},
  revokeSessionAction: async () => {},
  updatePasswordAction: async () => {},
  updateProfileAction: async () => {},
};

afterEach(() => {
  cleanup();
});

describe("SettingsPageShell", () => {
  it("renders the profile view", () => {
    render(<SettingsPageShell {...baseProps} />);

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toHaveValue("jane-notes");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("renders the security view", () => {
    render(<SettingsPageShell {...baseProps} activeTab="security" />);

    expect(screen.getByRole("heading", { name: "Security" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update password" })).toBeInTheDocument();
    expect(screen.getByText("Recent sessions")).toBeInTheDocument();
  });

  it("renders the danger zone view", () => {
    render(<SettingsPageShell {...baseProps} activeTab="danger-zone" />);

    expect(screen.getByRole("heading", { name: "Danger Zone" })).toBeInTheDocument();
    expect(screen.getByText("Type DELETE to confirm")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Permanently delete all data" }),
    ).toBeInTheDocument();
  });

  it("keeps the permanent delete action disabled until DELETE is entered", () => {
    render(<SettingsPageShell {...baseProps} activeTab="danger-zone" />);

    const submitButton = screen.getByRole("button", {
      name: "Permanently delete all data",
    });

    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Delete confirmation"), {
      target: { value: "DELETE" },
    });

    expect(submitButton).toBeEnabled();
  });
});
