"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn, subtestLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HintButton, ExplainPanel } from "@/components/question/explain-panel";
import { ErrorReasonPicker } from "@/components/question/error-reason-picker";
import type { SanitizedQuestion } from "@/lib/actions/session";
import type { ErrorReason } from "@prisma/client";

export type Feedback = {
  correct: boolean;
  correctIndex: number;
  explanationShort: string;
  xpEarned: number;
};

export function QuestionCard({
  question,
  onSubmit,
  feedback,
  onErrorReason,
  errorReason,
  onNext,
  isLast,
  answering = false,
}: {
  question: SanitizedQuestion;
  onSubmit: (selectedIndex: number) => void;
  feedback: Feedback | null;
  onErrorReason: (r: ErrorReason) => void;
  errorReason: ErrorReason | null;
  onNext: () => void;
  isLast: boolean;
  answering?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplain, setShowExplain] = useState(false);

  const submitted = feedback !== null;
  const needsErrorReason = submitted && !feedback.correct && !errorReason;

  return (
    <div className="animate-fade-up">
      <div className="mb-3 flex items-center gap-2">
        <Badge variant="primary">{subtestLabel(question.subtest)}</Badge>
        <Badge>{question.concept}</Badge>
      </div>

      <p className="whitespace-pre-line text-lg font-medium leading-relaxed">{question.stem}</p>

      <div className="mt-5 flex flex-col gap-2.5">
        {question.options.map((opt, i) => {
          const isCorrectOpt = submitted && i === feedback.correctIndex;
          const isSelectedWrong = submitted && i === selected && !feedback.correct;
          return (
            <button
              key={i}
              disabled={submitted}
              onClick={() => setSelected(i)}
              className={cn(
                "flex items-center justify-between rounded-[var(--radius-sm)] border px-4 py-3 text-left text-sm transition-all",
                !submitted && selected === i && "border-primary bg-primary-soft",
                !submitted && selected !== i && "border-border hover:border-primary/50",
                isCorrectOpt && "border-success bg-success-soft text-success",
                isSelectedWrong && "border-danger bg-danger-soft text-danger",
                submitted && !isCorrectOpt && !isSelectedWrong && "border-border opacity-60"
              )}
            >
              <span>{opt}</span>
              {isCorrectOpt && <Check size={16} />}
              {isSelectedWrong && <X size={16} />}
            </button>
          );
        })}
      </div>

      {!submitted && (
        <div className="mt-4 flex items-center justify-between">
          <HintButton questionId={question.id} />
          <Button disabled={selected === null || answering} onClick={() => selected !== null && onSubmit(selected)}>
            {answering ? "Svarar..." : "Svara"}
          </Button>
        </div>
      )}

      {submitted && (
        <div className="mt-4">
          <div
            className={cn(
              "flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium",
              feedback.correct ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
            )}
          >
            {feedback.correct ? <Check size={16} /> : <X size={16} />}
            {feedback.correct ? `Rätt! +${feedback.xpEarned} XP` : "Fel svar"}
          </div>
          {!needsErrorReason && <p className="mt-2 text-sm text-muted">{feedback.explanationShort}</p>}

          {needsErrorReason && <ErrorReasonPicker selected={errorReason} onSelect={onErrorReason} />}

          {!needsErrorReason && (
            <>
              <button onClick={() => setShowExplain((s) => !s)} className="mt-3 text-xs font-medium text-primary hover:underline">
                {showExplain ? "Dölj förklaring" : "Vill du förstå bättre? Förklara"}
              </button>
              {showExplain && <ExplainPanel questionId={question.id} selectedIndex={selected} />}

              <div className="mt-5 flex justify-end">
                <Button onClick={onNext}>{isLast ? "Avsluta pass" : "Nästa fråga"}</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
