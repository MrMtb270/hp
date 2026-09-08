import { subtestShort } from "@/lib/utils";

export type WeaknessInput = { subtest: string; rating: number };

export type PlanDay = {
  dayOfWeek: number; // 0 = Monday .. 6 = Sunday
  label: string;
  minutes: number;
  subtest: string | null;
};

const DAY_NAMES = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];

/**
 * Genererar en enkel veckoplan baserat på svagheter och tillgänglig tid.
 * Tyngdpunkt läggs på de två svagaste delproven, en vilodag och en
 * lördag med kortprov/blandat följt av söndagsanalys.
 */
export function generateWeeklyPlan(
  weaknesses: WeaknessInput[],
  dailyMinutesAvailable: number,
  hasWeekendTest = true
): PlanDay[] {
  const sorted = [...weaknesses].sort((a, b) => a.rating - b.rating);
  const focus = sorted.slice(0, 3).map((w) => w.subtest);
  const plan: PlanDay[] = [];

  const pattern: (string | "mixed" | "rest" | "test" | "review")[] = [
    focus[0] ?? "mixed",
    focus[1] ?? "mixed",
    "mixed",
    focus[2] ?? focus[0] ?? "mixed",
    "rest",
    hasWeekendTest ? "test" : (focus[0] ?? "mixed"),
    "review",
  ];

  pattern.forEach((item, i) => {
    if (item === "rest") {
      plan.push({ dayOfWeek: i, label: "Vila", minutes: 0, subtest: null });
    } else if (item === "test") {
      plan.push({ dayOfWeek: i, label: "Mini-prov", minutes: Math.max(dailyMinutesAvailable, 30), subtest: null });
    } else if (item === "review") {
      plan.push({ dayOfWeek: i, label: "Analys & repetition", minutes: Math.round(dailyMinutesAvailable * 0.6), subtest: null });
    } else if (item === "mixed") {
      plan.push({ dayOfWeek: i, label: "Blandad träning", minutes: dailyMinutesAvailable, subtest: null });
    } else {
      plan.push({ dayOfWeek: i, label: `${subtestShort(item)}-fokus`, minutes: dailyMinutesAvailable, subtest: item });
    }
  });

  return plan;
}

export function adjustPlanForAvailableTime(plan: PlanDay[], todayDayOfWeek: number, availableMinutes: number): PlanDay[] {
  return plan.map((d) => (d.dayOfWeek === todayDayOfWeek && d.minutes > 0 ? { ...d, minutes: availableMinutes } : d));
}

export function dayName(dayOfWeek: number) {
  return DAY_NAMES[dayOfWeek] ?? "";
}
