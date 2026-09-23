import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { LoginStub } from "@/components/auth/LoginStub";
import { getSession } from "@/lib/server/session";

export default async function Home() {
  if (await getSession()) redirect("/launcher");
  return (
    <AppShell>
      <LoginStub />
    </AppShell>
  );
}
