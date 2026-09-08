import { Flame, Trophy, Users } from "lucide-react";
import { getFriendsData, getLeaderboard } from "@/lib/actions/friends";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddFriendForm } from "@/components/social/add-friend-form";
import { FriendRequestRow, RemoveFriendButton } from "@/components/social/friend-request-row";
import { cn, formatScore } from "@/lib/utils";

export default async function FriendsPage() {
  const [data, leaderboard] = await Promise.all([getFriendsData(), getLeaderboard()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vänner</h1>
        <p className="mt-1 text-muted">Jämför utveckling och peppa varandra - inte bara resultat, utan framsteg.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-medium text-muted">Lägg till en vän</h2>
          <div className="mt-3">
            <AddFriendForm />
          </div>
        </CardContent>
      </Card>

      {data.pendingIncoming.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-medium text-muted">Väntande förfrågningar</h2>
            <div className="mt-3 flex flex-col gap-2">
              {data.pendingIncoming.map((f) => (
                <FriendRequestRow key={f.friendshipId} friendshipId={f.friendshipId} name={f.name} email={f.email} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h2 className="text-sm font-medium text-muted">Dina vänner ({data.friends.length})</h2>
            </div>
            {data.friends.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Inga vänner ännu - bjud in någon ovan.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2.5">
                {data.friends.map((f) => (
                  <li key={f.friendshipId} className="flex items-center justify-between rounded-[var(--radius-sm)] bg-surface-2 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{f.name ?? f.email}</p>
                      <p className="text-xs text-muted">
                        Nivå {f.level?.level ?? 1} · {f.currentEstimate !== null ? formatScore(f.currentEstimate) : "–"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-accent">
                        <Flame size={12} /> {f.streakCount}
                      </span>
                      <RemoveFriendButton friendshipId={f.friendshipId} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {data.pendingOutgoing.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs text-muted">Väntar på svar: {data.pendingOutgoing.map((f) => f.name ?? f.email).join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-accent" />
              <h2 className="text-sm font-medium text-muted">Veckans topplista</h2>
            </div>
            <p className="mt-1 text-xs text-muted">Rankad efter XP denna vecka - alla kan vinna, oavsett nivå.</p>
            <ol className="mt-3 flex flex-col gap-2">
              {leaderboard.map((row, i) => (
                <li
                  key={row.userId}
                  className={cn(
                    "flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2.5",
                    row.isMe ? "bg-primary-soft" : "bg-surface-2"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center text-sm font-semibold text-muted">{i + 1}</span>
                    <div>
                      <p className={cn("text-sm font-medium", row.isMe && "text-primary")}>
                        {row.isMe ? `${row.name} (du)` : row.name}
                      </p>
                      <p className="text-xs text-muted">Nivå {row.level.level} · {row.level.name}</p>
                    </div>
                  </div>
                  <Badge variant={row.isMe ? "primary" : "default"}>+{row.weeklyXp} XP</Badge>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
