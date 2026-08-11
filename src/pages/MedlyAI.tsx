import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen, Bot, Check, Copy, FileText, Loader2, Plus, RotateCcw,
  Send, ShieldAlert, Sparkles, Square,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Markdown } from "@/components/ui/markdown";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/lib/session";
import { api, ApiError, type ChatResponse, type QuickAction, type RiskLevel } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Medly AI — the full-page medical learning assistant.
 *
 * The floating widget stays for quick questions; this is where a study session
 * happens. Both hit the same guarded endpoint, so the safety screen, the
 * disclaimer and the audit entry are identical either way.
 */

interface Turn {
  id: number;
  role: "user" | "assistant";
  content: string;
  blocked?: boolean;
  riskLevel?: RiskLevel;
  model?: string | null;
  /** The question that produced this answer, so Retry can resend it. */
  source?: { text?: string; action?: QuickAction };
}

const EXAMPLES = [
  "Explain the pathophysiology of myocardial infarction",
  "Compare Type 1 and Type 2 diabetes",
  "Create 10 MCQs about pharmacology",
  "Explain nephrotic vs nephritic syndrome",
  "Give me a clinical case about pneumonia",
  "Explain this topic as if I am preparing for an exam",
];

const FOLLOW_UPS: Array<{ action: QuickAction; label: string }> = [
  { action: "simpler", label: "Explain simpler" },
  { action: "deeper", label: "Explain deeper" },
  { action: "example", label: "Give an example" },
  { action: "mcq", label: "Create MCQs" },
  { action: "case", label: "Clinical case" },
  { action: "summary", label: "Summarise" },
  { action: "quiz", label: "Quiz me" },
];

let nextId = 1;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked — the button simply does not confirm */
        }
      }}
      aria-label={copied ? "Copied" : "Copy answer"}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function MedlyAI() {
  const toast = useToast();
  const { me } = useSession();
  const [params, setParams] = useSearchParams();
  const articleSlug = params.get("article") ?? undefined;

  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Lets Stop abandon an in-flight answer without cancelling the audit entry
  // the server has already written.
  const abandoned = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  const lastQuestion = useMemo(
    () => [...turns].reverse().find((turn) => turn.role === "assistant")?.source,
    [turns]
  );

  const ask = useCallback(
    async (payload: { text?: string; action?: QuickAction }) => {
      const question = payload.text?.trim();
      if (busy || (!question && !payload.action)) return;

      abandoned.current = false;
      setError(null);
      if (question) {
        setTurns((prev) => [...prev, { id: nextId++, role: "user", content: question }]);
        setInput("");
      }
      setBusy(true);

      try {
        const reply: ChatResponse = await api.chat(question ?? "", {
          sessionId,
          articleSlug,
          action: payload.action,
        });
        if (abandoned.current) return;
        setSessionId(reply.session_id);
        setTurns((prev) => [
          ...prev,
          {
            id: nextId++,
            role: "assistant",
            content: reply.reply,
            blocked: reply.blocked,
            riskLevel: reply.risk_level,
            model: reply.model,
            source: payload,
          },
        ]);
      } catch (e) {
        if (abandoned.current) return;
        // The server already turned provider failures into safe copy.
        setError(
          e instanceof ApiError && e.message
            ? e.message
            : "Medly AI could not be reached. Check your connection and try again."
        );
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, sessionId, articleSlug]
  );

  function newConversation() {
    abandoned.current = true;
    setTurns([]);
    setSessionId(undefined);
    setError(null);
    setBusy(false);
    setInput("");
    if (articleSlug) {
      params.delete("article");
      setParams(params, { replace: true });
    }
    inputRef.current?.focus();
  }

  async function clearHistory() {
    try {
      await api.clearAssistantHistory();
      newConversation();
      toast("Conversation history deleted");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not clear your history", "error");
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter breaks the line — the convention people expect.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void ask({ text: input });
    }
  }

  const empty = turns.length === 0;

  return (
    <>
      <PageHeader
        title="Medly AI"
        subtitle="Your medical learning assistant"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={newConversation} disabled={empty && !busy}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New chat
            </Button>
            <Button variant="ghost" onClick={() => void clearHistory()}>
              Clear history
            </Button>
          </div>
        }
      />

      {articleSlug && (
        <Card className="mb-4 flex flex-wrap items-center gap-3 border-primary/30 bg-primary/5 p-4">
          <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-sm">
            Answering with the article <span className="font-semibold">{articleSlug}</span> as
            context.
          </span>
          <Link
            to={`/feed/${articleSlug}`}
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            Open the article
          </Link>
        </Card>
      )}

      <Card className="flex h-[min(70vh,44rem)] flex-col overflow-hidden p-0">
        {/* ---------------- transcript ---------------- */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6"
          role="log"
          aria-live="polite"
          aria-label="Conversation with Medly AI"
        >
          {empty && (
            <div className="flex h-full flex-col items-center justify-center px-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
                <Bot className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold">
                What are we studying today?
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Ask about a mechanism, a comparison, a drug class or a case. Medly AI explains
                for learning — it does not diagnose or treat.
              </p>
              <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setInput(example);
                      inputRef.current?.focus();
                    }}
                    className="flex items-start gap-2 rounded-xl border border-border bg-background p-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-muted"
                  >
                    <Sparkles
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn) =>
            turn.role === "user" ? (
              <div key={turn.id} className="flex justify-end gap-3">
                <div className="max-w-[85%] rounded-2xl gradient-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                  {turn.content}
                </div>
                <Avatar
                  src={me?.avatar_url || undefined}
                  name={me?.full_name ?? "You"}
                  className="h-8 w-8 shrink-0 text-[11px]"
                />
              </div>
            ) : (
              <div key={turn.id} className="flex gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                    turn.blocked ? "bg-destructive/10" : "gradient-primary"
                  )}
                >
                  {turn.blocked ? (
                    <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden="true" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3",
                      turn.blocked
                        ? "border border-destructive/30 bg-destructive/5"
                        : "border border-border bg-muted/40"
                    )}
                  >
                    {turn.blocked && (
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-destructive">
                        <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                        Blocked by safety rules
                      </div>
                    )}
                    <Markdown>{turn.content}</Markdown>
                  </div>

                  {!turn.blocked && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <CopyButton text={turn.content} />
                      <button
                        type="button"
                        onClick={() => void ask(turn.source ?? {})}
                        disabled={busy || !turn.source}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        Retry
                      </button>
                      {turn.model && (
                        <Badge variant="muted" className="ml-1">
                          {turn.model}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {busy && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl gradient-primary">
                <Bot className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Medly AI</span>
                  <span className="flex gap-1" aria-label="Thinking">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{error}</p>
                {lastQuestion && (
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    onClick={() => void ask(lastQuestion)}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Try again
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ---------------- follow-ups ---------------- */}
        {!empty && !busy && (
          <div className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2.5 scrollbar-hide sm:px-6">
            {FOLLOW_UPS.map(({ action, label }) => (
              <button
                key={action}
                type="button"
                onClick={() => void ask({ action })}
                className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ---------------- composer ---------------- */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void ask({ text: input });
          }}
          className="border-t border-border p-3 sm:p-4"
        >
          <div className="flex items-end gap-2">
            <label htmlFor="medly-ai-input" className="sr-only">
              Ask Medly AI a question
            </label>
            <textarea
              id="medly-ai-input"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              maxLength={4000}
              placeholder="Ask about a mechanism, a comparison, a drug, a case…"
              className="max-h-40 min-h-[2.75rem] flex-1 resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
            />
            {busy ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  abandoned.current = true;
                  setBusy(false);
                }}
              >
                <Square className="h-4 w-4" aria-hidden="true" />
                Stop
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim()}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Send</span>
              </Button>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3 shrink-0" aria-hidden="true" />
            Educational use only. Medly AI is not a clinician and does not diagnose or treat.
            Enter sends · Shift + Enter for a new line.
          </p>
        </form>
      </Card>
    </>
  );
}
