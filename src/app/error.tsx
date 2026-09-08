"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle size={24} />
      </div>
      <h1 className="text-lg font-semibold">Något gick fel</h1>
      <p className="mt-1 max-w-sm text-sm text-muted">Sidan kunde inte laddas just nu. Försök igen om en liten stund.</p>
      <div className="mt-5 flex gap-3">
        <Button onClick={reset}>Försök igen</Button>
        <Link href="/">
          <Button variant="outline">Till startsidan</Button>
        </Link>
      </div>
    </div>
  );
}
