export const LEVELS = [
  { level: 1, name: "Novis", minXp: 0 },
  { level: 2, name: "På gång", minXp: 250 },
  { level: 3, name: "Strateg", minXp: 600 },
  { level: 4, name: "Skarpskytt", minXp: 1200 },
  { level: 5, name: "Analytiker", minXp: 2200 },
  { level: 6, name: "Vass", minXp: 3600 },
  { level: 7, name: "Mästare", minXp: 5500 },
  { level: 8, name: "Elit", minXp: 8000 },
  { level: 9, name: "HP-proffs", minXp: 11500 },
  { level: 10, name: "Legend", minXp: 16000 },
] as const;

export function levelForXp(xp: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) current = l;
  }
  return current;
}

export function xpToNextLevel(xp: number) {
  const idx = LEVELS.findIndex((l) => l.level === levelForXp(xp).level);
  const next = LEVELS[idx + 1];
  if (!next) return null;
  return { next, remaining: next.minXp - xp, span: next.minXp - LEVELS[idx].minXp, progressed: xp - LEVELS[idx].minXp };
}

export const XP = {
  CORRECT_ANSWER: 10,
  INCORRECT_ANSWER: 2,
  SESSION_COMPLETE: 15,
  DAILY_GOAL: 30,
  TEST_COMPLETE: 100,
  PERSONAL_RECORD: 50,
  STREAK_DAY: (streak: number) => 5 * Math.min(streak, 10),
};

export type StreakState = {
  streakCount: number;
  streakLastActive: Date | null;
  streakFreezes: number;
};

function dateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function updateStreak(state: StreakState, now: Date = new Date()): StreakState & { xpAwarded: number; usedFreeze: boolean } {
  const today = dateOnly(now);
  if (!state.streakLastActive) {
    return { streakCount: 1, streakLastActive: now, streakFreezes: state.streakFreezes, xpAwarded: XP.STREAK_DAY(1), usedFreeze: false };
  }
  const last = dateOnly(state.streakLastActive);
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);

  if (diffDays === 0) {
    return { ...state, xpAwarded: 0, usedFreeze: false };
  }
  if (diffDays === 1) {
    const newFreezes = state.streakCount > 0 && state.streakCount % 7 === 0 ? state.streakFreezes + 1 : state.streakFreezes;
    return {
      streakCount: state.streakCount + 1,
      streakLastActive: now,
      streakFreezes: newFreezes,
      xpAwarded: XP.STREAK_DAY(state.streakCount + 1),
      usedFreeze: false,
    };
  }
  if (diffDays === 2 && state.streakFreezes > 0) {
    return {
      streakCount: state.streakCount + 1,
      streakLastActive: now,
      streakFreezes: state.streakFreezes - 1,
      xpAwarded: XP.STREAK_DAY(state.streakCount + 1),
      usedFreeze: true,
    };
  }
  return { streakCount: 1, streakLastActive: now, streakFreezes: state.streakFreezes, xpAwarded: XP.STREAK_DAY(1), usedFreeze: false };
}

export const ACHIEVEMENTS = [
  { code: "first_session", name: "Första passet", description: "Slutför din första träningssession", icon: "🎯" },
  { code: "first_test", name: "Första provet", description: "Genomför ditt första fulla prov", icon: "🏆" },
  { code: "questions_100", name: "100 frågor", description: "Besvara 100 frågor totalt", icon: "💯" },
  { code: "questions_1000", name: "1000 frågor", description: "Besvara 1000 frågor totalt", icon: "🔥" },
  { code: "streak_7", name: "En vecka i rad", description: "7 dagars streak", icon: "🔥" },
  { code: "streak_30", name: "Månadsstark", description: "30 dagars streak", icon: "⚡" },
  { code: "first_pr", name: "Nytt personbästa", description: "Sätt ditt första personliga rekord", icon: "📈" },
  { code: "perfect_section", name: "Perfekt delprov", description: "100% rätt på ett helt delprov", icon: "🎯" },
  { code: "improve_020", name: "Rejäl förbättring", description: "Förbättra din prognos med 0,20", icon: "🚀" },
  { code: "night_owl", name: "Nattuggla", description: "Träna efter kl 22", icon: "🦉" },
  { code: "early_bird", name: "Morgonpigg", description: "Träna innan kl 07", icon: "🌅" },
  { code: "all_rounder", name: "Allroundare", description: "Träna alla åtta delprov minst en gång", icon: "🧩" },
] as const;
