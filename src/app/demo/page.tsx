"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Check, X, Sparkles } from "lucide-react";
import { getDemoQuestions, checkDemoAnswer } from "@/lib/actions/demo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { QuestionVisual } from "@/components/question/question-visual";
import { cn, subtestLabel } from "@/lib/utils";

type Q = {
  id: string;
  subtest: string;
  concept: string;
  stem: string;
  options: string[];
  visualType: string | null;
  visualData: string | null;
};

export default function DemoPage() {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctIndex: number; explanationShort: string } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getDemoQuestions().then((qs) => {
      setQuestions(qs);
      setLoading(false);
    });
  }, []);

  async function submit() {
    if (selected === null) return;
    const res = await checkDemoAnswer(questions[index].id, selected);
    setFeedback(res);
    if (res.correct) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (index + 1 >= questions.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setFeedback(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-muted">
        <Loader2 className="animate-spin" /> Laddar demofrågor...
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <Sparkles className="mb-3 text-primary" size={32} />
        <h1 className="text-2xl font-semibold">{correctCount} av {questions.length} rätt</h1>
        <p className="mt-2 max-w-sm text-muted">
          Vill du spara din progression, låsa upp adaptiv träning och se din prognos utvecklas över tid?
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/register">
            <Button size="lg">Skapa gratis konto</Button>
          </Link>
          <Link href="/">
            <Button size="lg" variant="outline">
              Till startsidan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const q = questions[index];

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Progress value={(index / questions.length) * 100} className="flex-1" />
        <span className="text-xs text-muted">
          {index + 1} / {questions.length}
        </span>
      </div>

      <Card>
        <CardContent className="p-6">
          <Badge variant="primary">{subtestLabel(q.subtest)}</Badge>
          <p className="mt-3 whitespace-pre-line text-lg font-medium leading-relaxed">{q.stem}</p>
          <QuestionVisual visualType={q.visualType} visualData={q.visualData} />

          <div className="mt-5 flex flex-col gap-2.5">
            {q.options.map((opt, i) => {
              const isCorrectOpt = feedback && i === feedback.correctIndex;
              const isWrong = feedback && i === selected && !feedback.correct;
              return (
                <button
                  key={i}
                  disabled={!!feedback}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "flex items-center justify-between rounded-[var(--radius-sm)] border px-4 py-3 text-left text-sm transition-all",
                    !feedback && selected === i && "border-primary bg-primary-soft",
                    !feedback && selected !== i && "border-border hover:border-primary/50",
                    isCorrectOpt && "border-success bg-success-soft text-success",
                    isWrong && "border-danger bg-danger-soft text-danger"
                  )}
                >
                  <span>{opt}</span>
                  {isCorrectOpt && <Check size={16} />}
                  {isWrong && <X size={16} />}
                </button>
              );
            })}
          </div>

          {!feedback ? (
            <div className="mt-5 flex justify-end">
              <Button disabled={selected === null} onClick={submit}>
                Svara
              </Button>
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-sm text-muted">{feedback.explanationShort}</p>
              <div className="mt-4 flex justify-end">
                <Button onClick={next}>{index + 1 >= questions.length ? "Se resultat" : "Nästa fråga"}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
