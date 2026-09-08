import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number | null | undefined) {
  if (score === null || score === undefined) return "–";
  return score.toFixed(2).replace(".", ",");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const SUBTEST_LABELS: Record<string, string> = {
  ORD: "Ordförståelse",
  LAS: "Läsförståelse",
  MEK: "Meningskomplettering",
  ELF: "Engelsk läsförståelse",
  XYZ: "Matematisk problemlösning",
  KVA: "Kvantitativa jämförelser",
  NOG: "Kvantitativa resonemang",
  DTK: "Diagram, tabeller och kartor",
};

const SUBTEST_SHORT: Record<string, string> = {
  ORD: "ORD",
  LAS: "LÄS",
  MEK: "MEK",
  ELF: "ELF",
  XYZ: "XYZ",
  KVA: "KVA",
  NOG: "NOG",
  DTK: "DTK",
};

export function subtestLabel(code: string) {
  return SUBTEST_LABELS[code] ?? code;
}
export function subtestShort(code: string) {
  return SUBTEST_SHORT[code] ?? code;
}

export const VERBAL_SUBTESTS = ["ORD", "LAS", "MEK", "ELF"];
export const QUANT_SUBTESTS = ["XYZ", "KVA", "NOG", "DTK"];

export function isVerbal(subtest: string) {
  return VERBAL_SUBTESTS.includes(subtest);
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function daysUntil(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
