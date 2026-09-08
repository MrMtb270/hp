"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Clock, ChevronLeft, ChevronRight, Trophy, Home, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { startTestAttempt, submitTestAnswer, completeTestAttempt } from "@/lib/actions/test";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatScore, subtestLabel } from "@/lib/utils";

type TestQuestion = { id: string; subtest: string; concept: string; stem: string; options: string[] };
type CompleteResult = Awaited<ReturnType<typeof completeTestAttempt>>;

export default function TestRunPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center gap-3 text-muted">
          <Loader2 className="animate-spin" /> Laddar provet...
        </div>
      }
    >
      <TestRunInner />
    </Suspense>
  );
}

function TestRunInner() {
  const router = useRouter();
  const params = useSearchParams();
  const testId = params.get("testId");

  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initError, setInitError] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const questionStart = useRef<number>(Date.now());

  const startAttempt = useCallback(() => {
    if (!testId) return;
    setLoading(true);
    setInitError(false);
    startTestAttempt(testId)
      .then((res) => {
        setAttemptId(res.attemptId);
        setQuestions(res.questions);
        setSecondsLeft(res.durationSec);
        startedAt.current = Date.now();
        questionStart.current = Date.now();
      })
      .catch(() => setInitError(true))
      .finally(() => setLoading(false));
  }, [testId]);

  useEffect(() => {
    startAttempt();
  }, [startAttempt]);

  const finish = useCallback(async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const res = await completeTestAttempt(attemptId, secondsLeft);
      setResult(res);
    } catch {
      toast.error("Kunde inte räkna ihop provresultatet. Försök lämna in igen.");
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, secondsLeft, submitting]);

  useEffect(() => {
    if (loading || result) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, result, finish]);

  async function selectAnswer(questionId: string, selectedIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedIndex }));
    const timeSpentSec = Math.max(1, Math.round((Date.now() - questionStart.current) / 1000));
    if (attemptId) {
      try {
        await submitTestAnswer({ attemptId, questionId, selectedIndex, timeSpentSec });
      } catch {
        toast.error("Kunde inte spara svaret - kontrollera din uppkoppling.");
      }
    }
  }

  function goTo(i: number) {
    setIndex(i);
    questionStart.current = Date.now();
  }

  if (!testId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Inget prov valt.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-muted">
        <Loader2 className="animate-spin" /> Förbereder provet...
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <AlertTriangle className="text-danger" size={24} />
        <p className="text-muted">Kunde inte starta provet. Kontrollera din uppkoppling.</p>
        <Button onClick={startAttempt}>Försök igen</Button>
      </div>
    );
  }

  if (result) {
    return <TestResult result={result} onDone={() => router.push("/dashboard")} />;
  }

  const q = questions[index];
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const lowTime = secondsLeft < 120;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <Badge variant="primary">{subtestLabel(q.subtest)}</Badge>
        <div className={cn("flex items-center gap-1.5 text-sm font-medium tabular-nums", lowTime && "text-danger")}>
          <Clock size={15} />
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8">
        <div className="w-full max-w-2xl">
          <p className="whitespace-pre-line text-lg font-medium leading-relaxed">{q.stem}</p>
          <div className="mt-5 flex flex-col gap-2.5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(q.id, i)}
                className={cn(
                  "rounded-[var(--radius-sm)] border px-4 py-3 text-left text-sm transition-all",
                  answers[q.id] === i ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50"
                )}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" disabled={index === 0} onClick={() => goTo(index - 1)}>
              <ChevronLeft size={16} /> Föregående
            </Button>
            {index + 1 < questions.length ? (
              <Button onClick={() => goTo(index + 1)}>
                Nästa <ChevronRight size={16} />
              </Button>
            ) : (
              <Button onClick={finish} disabled={submitting}>
                {submitting ? "Rättar..." : "Lämna in provet"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="scrollbar-none flex gap-1.5 overflow-x-auto border-t border-border px-4 py-3">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            onClick={() => goTo(i)}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
              i === index && "bg-primary text-primary-foreground",
              i !== index && answers[qq.id] !== undefined && "bg-success-soft text-success",
              i !== index && answers[qq.id] === undefined && "bg-surface-2 text-muted"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function TestResult({ result, onDone }: { result: CompleteResult; onDone: () => void }) {
  const delta = Math.round((result.newEstimate - result.previousEstimate) * 100) / 100;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft animate-pop">
            <Trophy className="text-primary" size={28} />
          </div>
          <h1 className="text-2xl font-semibold">Ditt resultat</h1>
          <p className="mt-1 text-4xl font-semibold text-primary">{formatScore(result.scoreTotal)}</p>
          {delta !== 0 && (
            <p className={cn("mt-1 text-sm", delta > 0 ? "text-success" : "text-danger")}>
              {delta > 0 ? "+" : ""}
              {formatScore(delta)} sedan senast
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted">Verbal</p>
              <p className="mt-1 text-xl font-semibold text-verbal">{formatScore(result.scoreVerbal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted">Kvantitativ</p>
              <p className="mt-1 text-xl font-semibold text-quant">{formatScore(result.scoreQuant)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardContent className="flex flex-col gap-2 p-5 text-sm">
            {result.strongestSubtest && (
              <p>
                <span className="text-muted">Största styrka: </span>
                <strong>{result.strongestSubtest.label}</strong> ({Math.round(result.strongestSubtest.accuracy * 100)}%)
              </p>
            )}
            {result.weakestSubtest && (
              <p>
                <span className="text-muted">Största möjlighet: </span>
                <strong>{result.weakestSubtest.label}</strong> ({Math.round(result.weakestSubtest.accuracy * 100)}%)
              </p>
            )}
            {result.timeRemainingSec !== null && (
              <p>
                <span className="text-muted">Tid vid slut: </span>
                {result.timeRemainingSec > 0 ? `${Math.round(result.timeRemainingSec / 60)} min kvar` : "Tiden tog slut"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4 border-primary/30 bg-primary-soft">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-primary">Rekommendation</p>
            <p className="mt-1 text-sm">{result.recommendation}</p>
          </CardContent>
        </Card>

        {result.newAchievements.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {result.newAchievements.map((a) => (
              <div key={a.code} className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-accent/30 bg-accent-soft p-3">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button onClick={onDone}>
            <Home size={16} /> Till dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
