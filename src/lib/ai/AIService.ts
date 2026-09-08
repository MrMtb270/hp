import { subtestLabel } from "@/lib/utils";
import { AnthropicProvider } from "./providers/anthropic";
import {
  AIProvider,
  ExplainRequest,
  HintRequest,
  InsightInput,
  MotivationInput,
  TestAnalysisInput,
} from "./types";

const COACH_SYSTEM = `Du är en varm, konkret och kunnig studiecoach för svenska Högskoleprovet.
Du skriver kort, mänskligt och peppande - aldrig corporate eller robotaktigt.
Du undviker klyschor. Du är specifik och använder siffror när de finns.
Svara alltid på svenska, i högst 3-4 meningar om inget annat anges.`;

class AIService {
  private provider: AIProvider | null;

  constructor() {
    const key = process.env.ANTHROPIC_API_KEY;
    this.provider = key ? new AnthropicProvider(key) : null;
  }

  get isLive() {
    return this.provider !== null;
  }

  private async tryComplete(prompt: string, maxTokens = 300, fallback: () => string): Promise<string> {
    if (!this.provider) return fallback();
    try {
      return await this.provider.complete({ system: COACH_SYSTEM, prompt, maxTokens });
    } catch (e) {
      console.error("[AIService] provider error, using fallback:", e);
      return fallback();
    }
  }

  async generateExplanation(req: ExplainRequest): Promise<string> {
    const fallback = () => ruleBasedExplanation(req);
    const styleInstruction: Record<string, string> = {
      short: "Ge en mycket kort förklaring (1-2 meningar) av varför rätt svar är rätt.",
      steps: "Förklara steg för steg hur man löser uppgiften, numrerade steg.",
      eli5: "Förklara som om jag aldrig sett den här typen av uppgift förut - enkelt och grundläggande, utan att vara nedlåtande.",
      similar: "Beskriv kort en liknande men enklare uppgift och hur den löses, för att bygga förståelse innan man går tillbaka till originalfrågan.",
      hint: "Ge bara en ledtråd, inte hela lösningen - hjälp mig komma på det själv.",
    };
    const prompt = `Fråga (${subtestLabel(req.subtest)}, koncept: ${req.concept}):
"${req.questionStem}"
Alternativ: ${req.options.map((o, i) => `${i + 1}) ${o}`).join(", ")}
Rätt svar: alternativ ${req.correctIndex + 1}.
Jag svarade: ${req.selectedIndex === null ? "inget" : `alternativ ${req.selectedIndex + 1}`}.
Facit-underlag: ${req.explanationShort} ${req.explanationSteps.join(" ")}

${styleInstruction[req.style]}`;
    return this.tryComplete(prompt, 350, fallback);
  }

  async generateHint(req: HintRequest): Promise<string> {
    const fallback = () => ruleBasedHint(req);
    const existing = req.hints.filter(Boolean);
    if (req.level <= existing.length && existing[req.level - 1]) {
      return existing[req.level - 1] as string;
    }
    const prompt = `Fråga (${subtestLabel(req.subtest)}, koncept ${req.concept}): "${req.questionStem}"
Ge ledtrådsnivå ${req.level} av 4 (1=väldigt liten knuff, 4=nästan hela metoden men inte facit-siffran).
Avslöja INTE svaret. Max 2 meningar.`;
    return this.tryComplete(prompt, 150, fallback);
  }

  async generateInsight(input: InsightInput): Promise<string[]> {
    const fallback = () => ruleBasedInsights(input);
    if (!this.provider) return fallback();
    const prompt = `Användardata:
Namn: ${input.name ?? "okänt"}
Nuvarande prognos: ${input.currentEstimate.toFixed(2)} (mål: ${input.goalScore?.toFixed(2) ?? "ej satt"})
Förändring senaste veckan: ${input.weeklyDelta !== null ? input.weeklyDelta.toFixed(2) : "okänd"}
Styrkor: ${input.strengths.map((s) => `${s.subtest}/${s.concept}`).join(", ") || "inga ännu"}
Svagheter: ${input.weaknesses.map((s) => `${s.subtest}/${s.concept}`).join(", ") || "inga ännu"}
Andel slarvfel: ${input.carelessRate !== null ? Math.round(input.carelessRate * 100) + "%" : "okänt"}
Bästa studietimme: ${input.bestHour ?? "okänt"}
Totalt antal besvarade frågor: ${input.totalAttempts}

Skriv 2-3 korta, konkreta insikter (en per rad, ingen numrering) om hur personen studerar och presterar. Var specifik med siffror. Ingen inledning eller avslutning.`;
    const text = await this.tryComplete(prompt, 300, () => fallback().join("\n"));
    return text
      .split("\n")
      .map((l) => l.replace(/^[-•\d.]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  async generateMotivation(input: MotivationInput): Promise<string> {
    const fallback = () => ruleBasedMotivation(input);
    const prompt = `Namn: ${input.name ?? "där"}. Streak: ${input.streak} dagar. Klart idag: ${input.todayDone}/${input.todayGoal} frågor.
Veckoförändring i prognos: ${input.weeklyDelta !== null ? (input.weeklyDelta >= 0 ? "+" : "") + input.weeklyDelta.toFixed(2) : "okänd"}.
Dagar kvar till prov: ${input.daysUntilExam ?? "ej satt"}. Andel mot mål: ${input.progressToGoalPct !== null ? Math.round(input.progressToGoalPct) + "%" : "okänt"}.

Skriv en kort (max 2 meningar), personlig, peppande hälsning för dashboarden. Inget "Hej [namn]!" i början om det redan känns som en hälsning - gör den naturlig.`;
    return this.tryComplete(prompt, 100, fallback);
  }

  async analyzeTest(input: TestAnalysisInput): Promise<string> {
    const fallback = () => ruleBasedTestAnalysis(input);
    const prompt = `Provresultat: totalt ${input.scoreTotal.toFixed(2)}, verbal ${input.scoreVerbal.toFixed(2)}, kvantitativ ${input.scoreQuant.toFixed(2)}.
Svagaste delprov: ${input.weakestSubtest ? `${subtestLabel(input.weakestSubtest.subtest)} (${Math.round(input.weakestSubtest.accuracy * 100)}% rätt)` : "okänt"}.
Starkaste delprov: ${input.strongestSubtest ? `${subtestLabel(input.strongestSubtest.subtest)} (${Math.round(input.strongestSubtest.accuracy * 100)}% rätt)` : "okänt"}.
Svagaste koncept: ${input.weakestConcept ? `${input.weakestConcept.concept} inom ${subtestLabel(input.weakestConcept.subtest)}` : "okänt"}.
Tid kvar vid slut: ${input.timeRemainingSec !== null ? Math.round(input.timeRemainingSec / 60) + " min" : "okänt"}.

Ge en kort rekommendation (2-3 meningar) för vad personen bör fokusera på näst.`;
    return this.tryComplete(prompt, 200, fallback);
  }
}

function ruleBasedExplanation(req: ExplainRequest): string {
  const base = req.explanationShort;
  const steps = req.explanationSteps;
  switch (req.style) {
    case "short":
      return base;
    case "steps":
      return steps.length ? steps.map((s, i) => `${i + 1}. ${s}`).join("\n") : base;
    case "eli5":
      return `Låt oss ta det från grunden: ${base} Tänk på det som en enkel regel du kan applicera varje gång du ser den här typen av uppgift inom ${req.concept}.`;
    case "similar":
      return `En liknande, enklare uppgift inom ${req.concept} hade löst du med samma metod: ${base} Gå tillbaka till originalfrågan och applicera samma tankesätt.`;
    case "hint":
      return steps[0] ?? `Fundera på vad ${req.concept} egentligen kräver av dig här - vad är första steget?`;
    default:
      return base;
  }
}

function ruleBasedHint(req: HintRequest): string {
  const generic = [
    "Läs frågan en gång till och identifiera vad den faktiskt frågar efter.",
    `Tänk på grundprincipen inom ${req.concept} - vilken metod brukar du använda?`,
    "Skriv ner vad du vet och vad du söker. Vilket samband kopplar ihop dem?",
    "Du är nära - dubbelkolla uträkningen eller läsningen en gång till innan du svarar.",
  ];
  return generic[req.level - 1] ?? generic[0];
}

function ruleBasedInsights(input: InsightInput): string[] {
  const out: string[] = [];
  if (input.weeklyDelta !== null) {
    if (input.weeklyDelta > 0.01) {
      out.push(`Din prognos har gått upp med ${input.weeklyDelta.toFixed(2)} den senaste veckan. Det är riktig utveckling.`);
    } else if (input.weeklyDelta < -0.01) {
      out.push(`Din prognos har sjunkit något (${input.weeklyDelta.toFixed(2)}) senaste veckan - kan bero på svårare frågor, inte nödvändigtvis sämre nivå.`);
    } else {
      out.push("Din nivå har legat stabilt den senaste veckan.");
    }
  }
  if (input.weaknesses.length) {
    const w = input.weaknesses[0];
    out.push(`${subtestLabel(w.subtest)} - särskilt ${w.concept} - ger dig störst potential att plocka fler poäng just nu.`);
  }
  if (input.strengths.length) {
    const s = input.strengths[0];
    out.push(`Du är stark på ${s.concept} inom ${subtestLabel(s.subtest)}. Håll den vid liv med enstaka repetitioner.`);
  }
  if (input.carelessRate !== null && input.carelessRate > 0.25) {
    out.push(`${Math.round(input.carelessRate * 100)}% av dina fel är slarvfel - att sakta ner några sekunder extra kan ge snabba poäng.`);
  }
  if (input.bestHour !== null) {
    out.push(`Du presterar som bäst runt kl ${input.bestHour}:00 - lägg gärna tyngre pass då.`);
  }
  return out.slice(0, 3);
}

function ruleBasedMotivation(input: MotivationInput): string {
  if (input.todayDone >= input.todayGoal && input.todayGoal > 0) {
    return `Dagens mål är klart. ${input.streak > 0 ? `${input.streak} dagar i rad nu 🔥` : "Snyggt jobbat."}`;
  }
  const remaining = Math.max(input.todayGoal - input.todayDone, 0);
  if (input.streak > 0) {
    return `${remaining} frågor kvar för att hålla din ${input.streak}-dagarsstreak vid liv. Du fixar det.`;
  }
  if (input.daysUntilExam !== null && input.daysUntilExam <= 14) {
    return `${input.daysUntilExam} dagar kvar till provet - varje pass räknas nu. Kör igång.`;
  }
  return "Redo för dagens pass? Även 10 minuter för dig framåt.";
}

function ruleBasedTestAnalysis(input: TestAnalysisInput): string {
  const parts: string[] = [];
  if (input.weakestSubtest) {
    parts.push(`Fokusera på ${subtestLabel(input.weakestSubtest.subtest)} nästa vecka (${Math.round(input.weakestSubtest.accuracy * 100)}% rätt just nu).`);
  }
  if (input.weakestConcept) {
    parts.push(`Djupdyk särskilt i ${input.weakestConcept.concept}.`);
  }
  if (input.timeRemainingSec !== null && input.timeRemainingSec < 60) {
    parts.push("Du låg tight på tid - träna gärna tempo, inte bara träffsäkerhet.");
  }
  return parts.join(" ") || "Bra jobbat! Fortsätt träna jämnt över alla delprov.";
}

export const aiService = new AIService();
