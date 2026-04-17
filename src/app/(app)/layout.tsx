import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await getRequiredSession();
  } catch {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
