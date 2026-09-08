"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Trophy, ArrowRight, Home, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { startSession, submitAnswer, completeSession, type SanitizedQuestion } from "@/lib/actions/session";
import { completeOnboarding } from "@/lib/actions/onboarding";
import { QuestionCard, type Feedback } from "@/components/question/question-card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatScore } from "@/lib/utils";
import type { ErrorReason, SessionType } from "@prisma/client";

type CompleteResult = Awaited<ReturnType<typeof completeSession>>;

export default function PracticeRunPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted">
          <Loader2 className="animate-spin" />
          Laddar...
        </div>
      }
    >
      <PracticeRunInner />
    </Suspense>
  );
}

function PracticeRunInner() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode");
  const isOnboarding = params.get("onboarding") === "1";
  const minutes = params.get("minutes") ? Number(params.get("minutes")) : undefined;
  const subtestsParam = params.get("subtests");

  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SanitizedQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [errorReason, setErrorReason] = useState<ErrorReason | null>(null);
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [initError, setInitError] = useState(false);
  const [answering, setAnswering] = useState(false);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    setLoading(true);
    setInitError(false);
    try {
      const type: SessionType = mode === "diagnostic" ? "DIAGNOSTIC" : "QUICK";
      const res = await startSession({
        type,
        subtests: subtestsParam ? subtestsParam.split(",") : null,
        plannedMinutes: minutes,
        questionCount: mode === "diagnostic" ? 16 : undefined,
        onlyDue: mode === "review",
      });
      setSessionId(res.sessionId);
      setQuestions(res.questions);
      startedAt.current = Date.now();
    } catch {
      setInitError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(selectedIndex: number) {
    if (!sessionId || answering) return;
    setAnswering(true);
    const q = questions[index];
    const timeSpentSec = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    try {
      const res = await submitAnswer({ sessionId, questionId: q.id, selectedIndex, timeSpentSec });
      setFeedback({ correct: res.correct, correctIndex: res.correctIndex, explanationShort: res.explanationShort, xpEarned: res.xpEarned });
    } catch {
      toast.error("Kunde inte spara svaret. Kontrollera din uppkoppling och försök igen.");
    } finally {
      setAnswering(false);
    }
  }

  async function handleErrorReason(reason: ErrorReason) {
    setErrorReason(reason);
  }

  async function handleNext() {
    if (index + 1 >= questions.length) {
      await finish();
      return;
    }
    setIndex((i) => i + 1);
    setFeedback(null);
    setErrorReason(null);
    startedAt.current = Date.now();
  }

  async function finish() {
    if (!sessionId) return;
    setFinishing(true);
    try {
      const res = await completeSession(sessionId);
      setResult(res);
      if (isOnboarding) {
        await completeOnboarding();
      }
    } catch {
      toast.error("Kunde inte räkna ihop resultatet. Försök igen.");
    } finally {
      setFinishing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted">
        <Loader2 className="animate-spin" />
        Bygger din session...
      </div>
    );
  }

  if (initError) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <AlertTriangle className="mb-3 text-danger" size={24} />
        <p className="text-muted">Kunde inte starta sessionen. Kontrollera din uppkoppling.</p>
        <Button className="mt-4" onClick={init}>
          Försök igen
        </Button>
      </div>
    );
  }

  if (result) {
    return <SessionSummary result={result} onDone={() => router.push("/dashboard")} onAgain={() => router.push("/practice")} />;
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-muted">Inga frågor tillgängliga just nu för det här urvalet.</p>
        <Button className="mt-4" onClick={() => router.push("/practice")}>
          Tillbaka
        </Button>
      </div>
    );
  }

  const current = questions[index];
  const pct = Math.round((index / questions.length) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Progress value={pct} className="flex-1" />
        <span className="shrink-0 text-xs font-medium text-muted">
          {index + 1} / {questions.length}
        </span>
      </div>

      <Card>
        <CardContent className="p-6">
          <QuestionCard
            question={current}
            onSubmit={handleSubmit}
            feedback={feedback}
            errorReason={errorReason}
            onErrorReason={handleErrorReason}
            onNext={handleNext}
            isLast={index + 1 >= questions.length}
            answering={answering}
          />
        </CardContent>
      </Card>

      {finishing && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> Räknar ihop resultatet...
        </div>
      )}
    </div>
  );
}

function SessionSummary({ result, onDone, onAgain }: { result: CompleteResult; onDone: () => void; onAgain: () => void }) {
  const delta = Math.round((result.newEstimate - result.previousEstimate) * 100) / 100;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-md text-center"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft animate-pop">
        <Trophy className="text-primary" size={28} />
      </div>
      <h1 className="text-xl font-semibold">Pass klart!</h1>
      <p className="mt-1 text-muted">
        {result.questionsCorrect} av {result.questionsTotal} rätt · +{result.xpEarned} XP
      </p>

      <Card className="mt-6 text-left">
        <CardContent className="p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Ny prognos</span>
            <span className="font-medium">
              {formatScore(result.newEstimate)}{" "}
              {delta !== 0 && (
                <span className={delta > 0 ? "text-success" : "text-danger"}>
                  ({delta > 0 ? "+" : ""}
                  {formatScore(delta)})
                </span>
              )}
            </span>
          </div>
          {result.isPersonalRecord && <p className="mt-2 text-sm text-accent">📈 Nytt personligt rekord!</p>}
          {result.dailyGoalReached && <p className="mt-2 text-sm text-success">🎯 Dagens mål uppnått!</p>}
        </CardContent>
      </Card>

      {result.newAchievements.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {result.newAchievements.map((a) => (
            <motion.div
              key={a.code}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-accent/30 bg-accent-soft p-3 text-left"
            >
              <span className="text-2xl">{a.icon}</span>
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted">{a.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-center gap-3">
        <Button variant="outline" onClick={onDone}>
          <Home size={16} /> Till dashboard
        </Button>
        <Button onClick={onAgain}>
          Ett pass till <ArrowRight size={16} />
        </Button>
      </div>
    </motion.div>
  );
}
