"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendFriendRequest } from "@/lib/actions/friends";

export function AddFriendForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const res = await sendFriendRequest(email);
    setSending(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Vänförfrågan skickad!");
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input type="email" placeholder="Kompis e-post" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Button type="submit" disabled={sending}>
        <UserPlus size={16} /> {sending ? "Skickar..." : "Lägg till"}
      </Button>
    </form>
  );
}
