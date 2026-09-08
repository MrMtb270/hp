"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";

type Notification = { id: string; title: string; body: string; type: string; read: boolean; createdAt: Date };

function timeAgo(date: Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just nu";
  if (min < 60) return `${min} min sedan`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} tim sedan`;
  return `${Math.floor(h / 24)} dagar sedan`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await getNotifications();
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle() {
    setOpen((o) => !o);
    if (!open) load();
  }

  function handleMarkAllRead() {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  function handleOpenNotification(n: Notification) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      startTransition(async () => {
        await markNotificationRead(n.id);
      });
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label={`Notiser${unreadCount > 0 ? ` (${unreadCount} olästa)` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-80 rounded-[var(--radius-md)] border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border p-3">
            <p className="text-sm font-medium">Notiser</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} disabled={pending} className="text-xs text-primary hover:underline disabled:opacity-50">
                Markera alla som lästa
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && <p className="p-4 text-center text-sm text-muted">Inga notiser än.</p>}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleOpenNotification(n)}
                className={cn("flex w-full flex-col gap-0.5 border-b border-border p-3 text-left last:border-0 hover:bg-surface-2", !n.read && "bg-primary-soft/40")}
              >
                <div className="flex items-center gap-2">
                  {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  <p className="text-sm font-medium">{n.title}</p>
                </div>
                <p className="text-xs text-muted">{n.body}</p>
                <p className="mt-0.5 text-[10px] text-muted">{timeAgo(n.createdAt)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
