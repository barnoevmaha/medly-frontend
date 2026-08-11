import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, ShieldAlert, Loader2, Info, Maximize2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api, type ChatResponse, type RiskLevel } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* The fixed-corner study assistant.
   Every reply arrives already carrying its disclaimer from the server — the
   client cannot strip it, and a refusal renders differently on purpose. */

interface Message {
  role: "user" | "assistant";
  content: string;
  blocked?: boolean;
  riskLevel?: RiskLevel;
}

const GREETING: Message = {
  role: "assistant",
  content:
    "I'm your study assistant. I explain how medical AI works and where it fails — " +
    "automation bias, calibration, dataset shift, saliency maps, ethics and regulation.\n\n" +
    "I won't diagnose or give treatment advice, and I'll refuse anything containing " +
    "patient identifiers. That's by design, not a limitation I'm apologising for.",
};

function riskChip(risk: RiskLevel) {
  const map: Record<RiskLevel, string> = {
    none: "bg-muted text-muted-foreground",
    low: "bg-success/10 text-success",
    medium: "bg-warning/10 text-warning",
    high: "bg-destructive/10 text-destructive",
  };
  return map[risk];
}

/** Minimal markdown: **bold**, `code`, and paragraph breaks. */
function renderText(text: string) {
  return text.split("\n").map((line, index) => {
    if (line.trim() === "---") return <hr key={index} className="my-2 border-border" />;
    const html = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-[0.85em]">$1</code>')
      .replace(/_(.+?)_/g, "<em>$1</em>");
    return (
      <p
        key={index}
        className={cn("min-h-[0.5rem]", line.startsWith("- ") && "pl-3")}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  });
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || suggestions.length) return;
    api.suggestions().then(setSuggestions).catch(() => setSuggestions([]));
  }, [open, suggestions.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setBusy(true);

    try {
      const reply: ChatResponse = await api.chat(question, sessionId);
      setSessionId(reply.session_id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply.reply,
          blocked: reply.blocked,
          riskLevel: reply.risk_level,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error && error.message
              ? `Could not reach the assistant: ${error.message}`
              : "Could not reach the assistant. Check that the API is running and reachable.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close study assistant" : "Open study assistant"}
        className={cn(
          "fixed bottom-24 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-2xl",
          "gradient-primary text-primary-foreground shadow-glow transition-transform",
          "hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {open && (
        <div
          className={cn(
            "fixed bottom-44 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col",
            "overflow-hidden rounded-2xl border border-border bg-card shadow-medium",
            "md:bottom-24 md:right-6",
            "h-[min(32rem,calc(100vh-16rem))] md:h-[min(34rem,calc(100vh-10rem))]"
          )}
        >
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-bold">Medly AI</div>
              <div className="text-xs text-muted-foreground">Educational use · every reply logged</div>
            </div>
            {/* Same conversation, more room. */}
            <Link
              to="/ai"
              onClick={() => setOpen(false)}
              aria-label="Open Medly AI full page"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </Link>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "gradient-primary text-primary-foreground"
                      : message.blocked
                        ? "border border-destructive/30 bg-destructive/5"
                        : "bg-muted"
                  )}
                >
                  {message.blocked && (
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-destructive">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Blocked by safety rules
                    </div>
                  )}
                  <div className="space-y-1.5">{renderText(message.content)}</div>
                  {message.role === "assistant" && message.riskLevel && !message.blocked && (
                    <span
                      className={cn(
                        "mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        riskChip(message.riskLevel)
                      )}
                    >
                      {message.riskLevel} risk
                    </span>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            )}

            {messages.length === 1 && suggestions.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  Try one of these
                </div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => send(suggestion)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about AI in medicine…"
              className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
