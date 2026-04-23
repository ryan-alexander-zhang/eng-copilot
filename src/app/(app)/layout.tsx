import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { UnauthenticatedError, getRequiredSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await getRequiredSession();
  } catch (error) {
    if (!(error instanceof UnauthenticatedError)) {
      throw error;
    }

    redirect("/sign-in");
  }

  return <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">{children}</div>;
}
