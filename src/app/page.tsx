import { AppShell } from "@/components/layout/AppShell";
import { LoginStub } from "@/components/auth/LoginStub";

export default function Home() {
  return (
    <AppShell>
      <LoginStub />
    </AppShell>
  );
}
