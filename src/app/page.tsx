import Link from "next/link";
import { ArrowRight, Target, Sparkles, TrendingUp, Flame, Trophy, Brain, Check } from "lucide-react";
import { getSessionUser } from "@/lib/current-user";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const user = await getSessionUser();
  const primaryHref = user ? "/dashboard" : "/register";
  const primaryLabel = user ? "Till dashboard" : "Kom igång gratis";

  return (
    <div className="flex flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">
          prov<span className="text-primary">et</span>
        </span>
        <nav className="flex items-center gap-3">
          {!user && (
            <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground">
              Logga in
            </Link>
          )}
          <Link href={primaryHref}>
            <Button size="sm">{primaryLabel}</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-20 pt-16 text-center">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
          <Sparkles size={12} /> AI-driven träning för Högskoleprovet
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Plugga smartare till Högskoleprovet.</h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          En personlig studieplattform som lär sig vad du kan, hittar dina svagheter och visar exakt vad du bör träna på härnäst.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={primaryHref}>
            <Button size="lg">
              {primaryLabel} <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline">
              Testa 5 frågor utan konto
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <h2 className="text-center text-sm font-medium uppercase tracking-wide text-muted">Hur det fungerar</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            { icon: Brain, title: "1. Diagnos", desc: "Ett kort test kartlägger var du faktiskt ligger inom alla åtta delprov." },
            { icon: Target, title: "2. Adaptiv träning", desc: "Frågorna anpassas efter din nivå - alltid nära din utvecklingszon." },
            { icon: TrendingUp, title: "3. Se dig förbättras", desc: "Din prognos, dina svagheter och din plan uppdateras i realtid." },
          ].map((s) => (
            <div key={s.title} className="rounded-[var(--radius-md)] border border-border bg-surface p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <s.icon size={18} />
              </div>
              <h3 className="mt-4 font-medium">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface-2/50 py-16">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-primary">Personlig AI-coach</span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">En coach som faktiskt känner dig.</h2>
            <p className="mt-3 text-muted">
              Inte generiska tips. Din coach ser dina mönster - vilka feltyper som återkommer, när du presterar bäst och vilket
              delprov som ger mest poäng per minut just nu.
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 text-sm">
              {[
                "Konkreta insikter baserade på din faktiska data",
                "Ledtrådar i fyra nivåer istället för att bara ge facit",
                "Förklaringar anpassade efter hur du vill lära dig",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm">
            <p className="text-sm font-medium text-muted">Din coach idag</p>
            <p className="mt-2 text-lg font-medium">&ldquo;Du har förbättrat KVA med 0,14 de senaste två veckorna.&rdquo;</p>
            <p className="mt-3 text-sm text-muted">&ldquo;Du tappar fortfarande poäng på proportionalitet - 15 minuter idag räcker.&rdquo;</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Flame, title: "Streaks som peppar", desc: "Bygg vanor utan stress. Missa en dag? Rädda din streak med en freeze." },
            { icon: Trophy, title: "Meningsfulla belöningar", desc: "XP, nivåer och utmärkelser byggda kring riktig utveckling, inte bara antal." },
            { icon: TrendingUp, title: "Se varje framsteg", desc: "Din prognos, historik och milstolpar - allt på ett ställe." },
          ].map((s) => (
            <div key={s.title} className="rounded-[var(--radius-md)] border border-border bg-surface p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                <s.icon size={18} />
              </div>
              <h3 className="mt-4 font-medium">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight">Vanliga frågor</h2>
        <div className="mt-8 flex flex-col divide-y divide-border">
          {[
            { q: "Kostar det något?", a: "Det är gratis att komma igång med begränsad träning. En Pro-nivå med obegränsad träning och full AI-coach är på väg." },
            { q: "Hur vet ni vad jag behöver träna på?", a: "Vi bygger en profil av dina svar - ämne, svårighetsgrad, tempo och feltyp - och räknar fram var du får mest poäng per minut." },
            { q: "Kan jag träna på mobilen?", a: "Ja, hela plattformen är byggd mobile-first. Ett pass tar 5-10 minuter." },
            { q: "Är frågorna riktiga högskoleprovsfrågor?", a: "Frågebanken är byggd i samma stil och format som det riktiga provet, för realistisk träning." },
          ].map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                {item.q}
                <span className="text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-6 pb-24 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Redo att se var du ligger?</h2>
        <p className="mt-2 text-muted">Tar under en minut att komma igång.</p>
        <Link href={primaryHref} className="mt-6 inline-block">
          <Button size="lg">
            {primaryLabel} <ArrowRight size={16} />
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        <p>provet - byggd för dig som pluggar till Högskoleprovet.</p>
      </footer>
    </div>
  );
}
