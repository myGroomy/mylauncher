import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/session";
import { getRegistryApps } from "@/lib/server/registry";
import { AppShell } from "@/components/layout/AppShell";
import { AppLaunchView } from "@/components/launcher/AppLaunchView";

export default async function AppIdPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId: rawAppId } = await params;
  const session = await getSession();
  if (!session) redirect("/");

  const appId = rawAppId.toUpperCase();
  let apps: Awaited<ReturnType<typeof getRegistryApps>> = [];
  try {
    apps = await getRegistryApps();
  } catch {
    apps = [];
  }

  const app = apps.find((item) => item.app_id === appId);
  const authorized =
    !!app &&
    app.status === "ACTIVE" &&
    session.permissions.includes(app.required_permission);

  return (
    <AppShell>
      <AppLaunchView app={authorized && app ? app : null} appId={appId} />
    </AppShell>
  );
}
