"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saveOnboardingStep1to4, skipOnboarding, type OnboardingData } from "@/lib/actions/onboarding";
import { cn, subtestLabel } from "@/lib/utils";

const GOALS = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
const SUBTESTS = ["ORD", "LAS", "MEK", "ELF", "XYZ", "KVA", "NOG", "DTK"];

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goalScore, setGoalScore] = useState<number | null>(null);
  const [goalUnknown, setGoalUnknown] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [previousAttempts, setPreviousAttempts] = useState<OnboardingData["previousAttempts"]>("NONE");
  const [previousScore, setPreviousScore] = useState("");
  const [selfAssessment, setSelfAssessment] = useState<Record<string, number>>(
    Object.fromEntries(SUBTESTS.map((s) => [s, 3]))
  );
  const [saving, setSaving] = useState(false);

  const weeksLeft = examDate ? Math.max(0, Math.round((new Date(examDate).getTime() - Date.now()) / (7 * 86400000))) : null;

  async function goNext() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
  }

  async function persistAndStartDiagnostic() {
    setSaving(true);
    await saveOnboardingStep1to4({
      goalScore: goalUnknown ? null : goalScore,
      examDate: examDate || null,
      previousAttempts,
      previousScore: previousScore ? Number(previousScore) : null,
      selfAssessment,
    });
    router.push("/practice/run?mode=diagnostic&onboarding=1");
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < step ? "bg-primary" : "bg-surface-2")} />
          ))}
        </div>

        <div key={step} className="animate-fade-up">
            <Card>
              <CardContent className="p-6">
                {step === 1 && (
                  <>
                    <h1 className="text-xl font-semibold">Vad vill du få på Högskoleprovet?</h1>
                    <p className="mt-1 text-sm text-muted">Vi anpassar din plan efter målet.</p>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {GOALS.map((g) => (
                        <button
                          key={g}
                          onClick={() => {
                            setGoalScore(g);
                            setGoalUnknown(false);
                          }}
                          aria-pressed={!goalUnknown && goalScore === g}
                          className={cn(
                            "rounded-[var(--radius-sm)] border py-3 text-sm font-medium transition-all",
                            !goalUnknown && goalScore === g
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {g.toFixed(1)}+
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setGoalUnknown(true)}
                      aria-pressed={goalUnknown}
                      className={cn(
                        "mt-2 w-full rounded-[var(--radius-sm)] border py-3 text-sm font-medium transition-all",
                        goalUnknown ? "border-primary bg-primary-soft text-primary" : "border-border hover:border-primary/50"
                      )}
                    >
                      Jag vet inte än
                    </button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h1 className="text-xl font-semibold">När skriver du provet?</h1>
                    <p className="mt-1 text-sm text-muted">Vi räknar ut din studietakt automatiskt.</p>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="mt-5 h-11 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    {weeksLeft !== null && (
                      <p className="mt-3 text-sm text-primary">
                        {weeksLeft} veckor kvar - vi lägger upp en plan som passar det.
                      </p>
                    )}
                    <button onClick={() => setExamDate("")} className="mt-3 text-xs text-muted hover:underline">
                      Vet inte än, hoppa över
                    </button>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h1 className="text-xl font-semibold">Har du gjort Högskoleprovet tidigare?</h1>
                    <div className="mt-5 flex flex-col gap-2">
                      {[
                        { v: "NONE", label: "Nej" },
                        { v: "ONCE", label: "Ja, en gång" },
                        { v: "MULTIPLE", label: "Ja, flera gånger" },
                      ].map((o) => (
                        <button
                          key={o.v}
                          onClick={() => setPreviousAttempts(o.v as OnboardingData["previousAttempts"])}
                          aria-pressed={previousAttempts === o.v}
                          className={cn(
                            "rounded-[var(--radius-sm)] border px-4 py-3 text-left text-sm font-medium transition-all",
                            previousAttempts === o.v ? "border-primary bg-primary-soft text-primary" : "border-border hover:border-primary/50"
                          )}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    {previousAttempts !== "NONE" && (
                      <div className="mt-4">
                        <label className="text-sm text-muted">Ditt senaste resultat (valfritt)</label>
                        <input
                          type="number"
                          step="0.05"
                          min={0}
                          max={2}
                          value={previousScore}
                          onChange={(e) => setPreviousScore(e.target.value)}
                          placeholder="t.ex. 1.20"
                          className="mt-1.5 h-11 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    )}
                  </>
                )}

                {step === 4 && (
                  <>
                    <h1 className="text-xl font-semibold">Hur känns de olika delproven?</h1>
                    <p className="mt-1 text-sm text-muted">En snabb självskattning - vi mäter din faktiska nivå strax.</p>
                    <div className="mt-5 flex flex-col gap-4">
                      {SUBTESTS.map((s) => (
                        <div key={s}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{subtestLabel(s)}</span>
                            <span className="text-muted">{selfAssessment[s]}/5</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={5}
                            value={selfAssessment[s]}
                            onChange={(e) => setSelfAssessment((prev) => ({ ...prev, [s]: Number(e.target.value) }))}
                            className="mt-1 w-full accent-[var(--primary)]"
                            aria-label={`Självskattning för ${subtestLabel(s)}, 1 till 5`}
                            aria-valuetext={`${selfAssessment[s]} av 5`}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {step === 5 && (
                  <div className="text-center">
                    <Sparkles className="mx-auto mb-3 text-primary" size={28} />
                    <h1 className="text-xl font-semibold">Nu tar vi reda på var du faktiskt ligger</h1>
                    <p className="mt-2 text-sm text-muted">
                      16 korta frågor från alla delprov. Tar cirka 10-12 minuter och ger dig din första riktiga studieprofil.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>

        <div className="mt-5 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={16} /> Tillbaka
            </Button>
          ) : (
            <button onClick={() => skipOnboarding()} className="text-sm text-muted hover:underline">
              Hoppa över allt
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <Button onClick={goNext}>
              Fortsätt <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={persistAndStartDiagnostic} disabled={saving}>
              {saving ? "Förbereder..." : "Starta diagnostiskt test"} <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
