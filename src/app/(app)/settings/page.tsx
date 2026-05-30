import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/auth";

type SettingsPageProps = {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
};

function resolveValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveAccountPanel(value: string | undefined) {
  if (value === "security") {
    return "password";
  }

  if (value === "danger-zone") {
    return "clear-data";
  }

  return "profile";
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await getRequiredSession();

  const resolvedSearchParams = await searchParams;
  const account = resolveAccountPanel(resolveValue(resolvedSearchParams?.tab));

  redirect(`/documents?account=${account}`);
}
