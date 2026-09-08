import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Compass size={24} />
      </div>
      <h1 className="text-lg font-semibold">Sidan hittades inte</h1>
      <p className="mt-1 max-w-sm text-sm text-muted">Länken kan vara felstavad eller borttagen.</p>
      <Link href="/" className="mt-5">
        <Button>Till startsidan</Button>
      </Link>
    </div>
  );
}
