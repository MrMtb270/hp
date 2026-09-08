"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Något gick fel");
        setLoading(false);
        return;
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        toast.error("Kunde inte logga in automatiskt. Försök logga in manuellt.");
        router.push("/login");
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } catch {
      toast.error("Något gick fel. Försök igen.");
      setLoading(false);
    }
  }

  return (
    <Card className="animate-fade-up">
      <CardContent className="p-6">
        <h1 className="text-xl font-semibold">Skapa konto</h1>
        <p className="mt-1 text-sm text-muted">Gratis att komma igång. Ingen bindningstid.</p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <Input placeholder="Namn" value={name} onChange={(e) => setName(e.target.value)} required minLength={1} />
          <Input type="email" placeholder="E-post" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            type="password"
            placeholder="Lösenord (minst 8 tecken)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <Button type="submit" size="lg" disabled={loading} className="mt-2">
            {loading ? "Skapar konto..." : "Kom igång gratis"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Har du redan ett konto?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Logga in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
