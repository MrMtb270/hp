"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      toast.error("Fel e-post eller lösenord.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="animate-fade-up">
      <CardContent className="p-6">
        <h1 className="text-xl font-semibold">Välkommen tillbaka</h1>
        <p className="mt-1 text-sm text-muted">Logga in för att fortsätta träna.</p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <Input type="email" placeholder="E-post" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" size="lg" disabled={loading} className="mt-2">
            {loading ? "Loggar in..." : "Logga in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Nytt konto?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Skapa ett gratis
          </Link>
        </p>
        <div className="mt-4 rounded-[var(--radius-sm)] bg-surface-2 p-3 text-center text-xs text-muted">
          Demo: <span className="font-mono">demo@provet.se</span> / <span className="font-mono">demo1234</span>
        </div>
      </CardContent>
    </Card>
  );
}
