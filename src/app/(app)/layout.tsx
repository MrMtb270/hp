import { requireUser } from "@/lib/current-user";
import { Nav } from "@/components/nav";

// OBS: kräver bara inloggning, inte avslutad onboarding - /practice/run återanvänds
// av onboardingens diagnostiska test, som körs INNAN onboardingDone sätts till true.
// Sidor som behöver ett fullständigt onboardat konto anropar requireProfile() själva.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav isAdmin={user.isAdmin} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:px-6 md:pb-10">{children}</main>
    </div>
  );
}
