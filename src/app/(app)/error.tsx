"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle size={24} />
      </div>
      <h1 className="text-lg font-semibold">Något gick fel</h1>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Det uppstod ett tillfälligt problem. Dina svar och din progression är sparade - försök igen.
      </p>
      <Button className="mt-5" onClick={reset}>
        Försök igen
      </Button>
    </div>
  );
}
