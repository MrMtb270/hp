"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { respondToFriendRequest, removeFriendship } from "@/lib/actions/friends";

export function FriendRequestRow({ friendshipId, name, email }: { friendshipId: string; name: string | null; email: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function respond(accept: boolean) {
    setPending(true);
    await respondToFriendRequest(friendshipId, accept);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-surface-2 px-3 py-2">
      <span className="text-sm font-medium">{name ?? email}</span>
      <div className="flex gap-1.5">
        <button
          disabled={pending}
          onClick={() => respond(true)}
          aria-label="Acceptera"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-success-soft text-success hover:opacity-80 disabled:opacity-50"
        >
          <Check size={14} />
        </button>
        <button
          disabled={pending}
          onClick={() => respond(false)}
          aria-label="Avvisa"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-danger-soft text-danger hover:opacity-80 disabled:opacity-50"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function RemoveFriendButton({ friendshipId }: { friendshipId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleRemove() {
    if (!confirm("Ta bort vännen?")) return;
    setPending(true);
    await removeFriendship(friendshipId);
    router.refresh();
  }

  return (
    <button onClick={handleRemove} disabled={pending} className="text-xs text-muted hover:text-danger disabled:opacity-50">
      Ta bort
    </button>
  );
}
