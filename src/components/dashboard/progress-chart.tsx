"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ProgressChart({ points }: { points: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={points} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 2]} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={30} />
        <Tooltip
          formatter={(v) => Number(v).toFixed(2)}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: "var(--muted)" }}
        />
        <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
