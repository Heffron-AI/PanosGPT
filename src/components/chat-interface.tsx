"use client";

import { useChat } from "@ai-sdk/react";
import { isTextUIPart, UIMessage, DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Square,
  RotateCcw,
  Zap,
  ChevronDown,
  Trophy,
  DollarSign,
  Hammer,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const SUGGESTED_QUESTIONS = [
  "How do I win more listings?",
  "What's your best prospecting script?",
  "How do I handle the 'I'll think about it' objection?",
  "How do I justify my commission?",
  "What makes an Attraction Agent?",
  "How do I build a strong database farm?",
];

export function ChatInterface() {
  const { messages, sendMessage, status, setMessages, stop, error, clearError, regenerate } =
    useChat({
      transport: new DefaultChatTransport({ api: "/api/chat" }),
    });

  const [input, setInput] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "submitted" || status === "streaming";
  const isStreaming = status === "streaming";

  // Auto-resize textarea as content grows
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  // Smart auto-scroll: only hijack if user is already at the bottom
  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Track whether user is near the bottom
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const threshold = 80;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isLoading) return;
      if (error) clearError();
      sendMessage({ text: input.trim() });
      setInput("");
      setIsAtBottom(true);
    },
    [input, isLoading, sendMessage, error, clearError]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleSuggestedQuestion = useCallback(
    (question: string) => {
      if (isLoading) return;
      if (error) clearError();
      sendMessage({ text: question });
      setIsAtBottom(true);
    },
    [isLoading, sendMessage, error, clearError]
  );

  const handleReset = useCallback(() => {
    setMessages([]);
    setInput("");
    if (error) clearError();
  }, [setMessages, error, clearError]);

  const handleRetry = useCallback(() => {
    clearError();
    regenerate();
  }, [clearError, regenerate]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto px-4 py-6"
          onScroll={handleScroll}
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <WelcomeScreen onSuggestedQuestion={handleSuggestedQuestion} />
            ) : (
              <>
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isStreaming={
                      isStreaming &&
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                  />
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <TypingIndicator />
                )}
                {error && <ErrorMessage onRetry={handleRetry} />}
              </>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Floating scroll-to-bottom button */}
        {!isAtBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border shadow-md text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-150 animate-message-in"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            Scroll to bottom
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background/95 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {messages.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Quick:</span>
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="text-xs px-3 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors bg-background text-muted-foreground disabled:opacity-40"
                  disabled={isLoading}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            {messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="shrink-0 mb-0.5"
                title="New conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Tom anything about real estate…"
              rows={1}
              className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[38px] max-h-[140px] leading-relaxed"
              disabled={isLoading}
              autoFocus
            />

            {isLoading ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => stop()}
                className="shrink-0 mb-0.5 border-destructive/40 hover:border-destructive hover:text-destructive transition-colors"
                title="Stop generation"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim()}
                className="shrink-0 mb-0.5"
                title="Send (Enter)"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>

          <p className="text-center text-xs text-muted-foreground mt-2">
            Enter to send · Shift+Enter for new line · 613 transcripts indexed
          </p>
          <p className="text-center text-xs text-muted-foreground/50 mt-1">
            Not affiliated with or endorsed by Tom Panos. AI responses are based on publicly available teachings.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const WelcomeScreen = memo(function WelcomeScreen({
  onSuggestedQuestion,
}: {
  onSuggestedQuestion: (q: string) => void;
}) {
  const badges = [
    { icon: Trophy, label: "Real Estate Gym" },
    { icon: Zap, label: "Attraction Agent" },
    { icon: DollarSign, label: "Million Dollar Agent" },
    { icon: Hammer, label: "Auction Specialist" },
  ];

  return (
    <div className="text-center py-8 space-y-8">
      {/* Hero */}
      <div className="space-y-3 animate-message-in">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              TP
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tom Panos AI</h2>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">
            An unofficial AI trained on Tom Panos&apos; public teachings. Ask anything about
            listings, prospecting, auctions, mindset, or building your real estate career.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Not affiliated with or endorsed by Tom Panos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {badges.map(({ icon: Icon, label }) => (
            <Badge key={label} variant="secondary" className="gap-1.5 px-2.5 py-1">
              <Icon className="w-3 h-3" />
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Suggested questions */}
      <div className="space-y-3">
        <p
          className="text-sm font-medium text-muted-foreground uppercase tracking-wide animate-message-in"
          style={{ animationDelay: "80ms" }}
        >
          What do you want to work on?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
          {SUGGESTED_QUESTIONS.map((question, i) => (
            <button
              key={question}
              onClick={() => onSuggestedQuestion(question)}
              className="animate-message-in text-left px-4 py-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:shadow-none transition-all duration-150 text-sm font-medium group"
              style={{ animationDelay: `${120 + i * 50}ms` }}
            >
              <span className="text-primary group-hover:translate-x-0.5 inline-block transition-transform duration-150">
                →
              </span>{" "}
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

const MessageBubble = memo(function MessageBubble({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  const textContent = message.parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join("");

  if (!textContent) return null;

  return (
    <div className={cn("flex gap-3 animate-message-in", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="w-8 h-8 shrink-0 mt-1">
        {isUser ? (
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            YOU
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white text-xs font-bold">
            TP
          </AvatarFallback>
        )}
      </Avatar>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{textContent}</p>
        ) : (
          <div
            className={cn(
              "prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5",
              isStreaming && "streaming-cursor"
            )}
          >
            <ReactMarkdown>{textContent}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
});

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-message-in">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white text-xs font-bold">
          TP
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex gap-3 animate-message-in">
      <div className="w-8 h-8 shrink-0 mt-1 flex items-center justify-center">
        <AlertCircle className="w-5 h-5 text-destructive" />
      </div>
      <div className="bg-destructive/10 border border-destructive/20 rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex items-center gap-3">
        <span className="text-destructive/80">Something went wrong. Please try again.</span>
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/70 transition-colors shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    </div>
  );
}
