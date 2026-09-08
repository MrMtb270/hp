"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ChartDatum = { name: string; [key: string]: string | number };

type TableData = { title?: string; columns: string[]; rows: (string | number)[][] };
type SeriesDef = { key: string; label: string; color?: string };
type BarLineData = { title?: string; xLabel?: string; yLabel?: string; data: ChartDatum[]; series: SeriesDef[] };
type PieData = { title?: string; data: { name: string; value: number }[] };
type MapPoint = { id: string; label: string; x: number; y: number };
type MapEdge = { from: string; to: string; label?: string };
type MapData = { title?: string; points: MapPoint[]; edges?: MapEdge[]; scaleLabel?: string };

const PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#a855f7"];

export function QuestionVisual({ visualType, visualData }: { visualType?: string | null; visualData?: string | null }) {
  if (!visualType || !visualData) return null;
  let data: unknown;
  try {
    data = JSON.parse(visualData);
  } catch {
    return null;
  }

  return (
    <div className="my-4 rounded-[var(--radius-md)] border border-border bg-surface-2 p-4">
      {visualType === "table" && <TableVisual data={data as TableData} />}
      {visualType === "bar" && <BarVisual data={data as BarLineData} />}
      {visualType === "line" && <LineVisual data={data as BarLineData} />}
      {visualType === "pie" && <PieVisual data={data as PieData} />}
      {visualType === "map" && <MapVisual data={data as MapData} />}
    </div>
  );
}

function VisualTitle({ title }: { title?: string }) {
  if (!title) return null;
  return <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>;
}

function TableVisual({ data }: { data: TableData }) {
  return (
    <div>
      <VisualTitle title={data.title} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {data.columns.map((c, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold text-muted">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 1 ? "bg-surface/50" : ""}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-foreground">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BarVisual({ data }: { data: BarLineData }) {
  return (
    <div>
      <VisualTitle title={data.title} />
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data.data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            label={data.yLabel ? { value: data.yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--muted)" } : undefined}
          />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
          {data.series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {data.series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color ?? PALETTE[i % PALETTE.length]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LineVisual({ data }: { data: BarLineData }) {
  return (
    <div>
      <VisualTitle title={data.title} />
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data.data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            label={data.yLabel ? { value: data.yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--muted)" } : undefined}
          />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
          {data.series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {data.series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? PALETTE[i % PALETTE.length]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieVisual({ data }: { data: PieData }) {
  return (
    <div>
      <VisualTitle title={data.title} />
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} isAnimationActive={false}>
            {data.data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function MapVisual({ data }: { data: MapData }) {
  const byId = new Map(data.points.map((p) => [p.id, p]));
  return (
    <div>
      <VisualTitle title={data.title} />
      <svg viewBox="0 0 400 300" className="w-full max-w-xl rounded-[var(--radius-sm)] border border-border bg-surface">
        <rect x={0} y={0} width={400} height={300} fill="var(--surface)" />
        {(data.edges ?? []).map((e, i) => {
          const from = byId.get(e.from);
          const to = byId.get(e.to);
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          return (
            <g key={i}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="4 3" />
              {e.label && (
                <text x={midX} y={midY - 4} fontSize={10} fill="var(--muted)" textAnchor="middle">
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
        {data.points.map((p) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={5} fill="var(--primary)" stroke="var(--surface)" strokeWidth={2} />
            <text x={p.x} y={p.y - 10} fontSize={11} fontWeight={600} fill="var(--foreground)" textAnchor="middle">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      {data.scaleLabel && <p className="mt-2 text-xs text-muted">{data.scaleLabel}</p>}
    </div>
  );
}
