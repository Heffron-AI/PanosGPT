"use client";

import { useChat } from "@ai-sdk/react";
import { isTextUIPart, UIMessage, DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState, memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Send,
  Square,
  ChevronDown,
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

type ChatInterfaceProps = {
  onConversationTitleChange?: (title: string) => void;
};

export function ChatInterface({ onConversationTitleChange }: ChatInterfaceProps) {
  const { messages, sendMessage, status, stop, error, clearError, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [input, setInput] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasSetConversationTitleRef = useRef(false);

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

  const setConversationTitleFromPrompt = useCallback(
    (prompt: string) => {
      if (hasSetConversationTitleRef.current) return;
      const cleanTitle = prompt.trim().replace(/\s+/g, " ").slice(0, 42);
      onConversationTitleChange?.(cleanTitle || "New chat");
      hasSetConversationTitleRef.current = true;
    },
    [onConversationTitleChange]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isLoading) return;
      if (error) clearError();
      setConversationTitleFromPrompt(input.trim());
      sendMessage({ text: input.trim() });
      setInput("");
      setIsAtBottom(true);
    },
    [input, isLoading, sendMessage, error, clearError, setConversationTitleFromPrompt]
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
      setConversationTitleFromPrompt(question);
      sendMessage({ text: question });
      setIsAtBottom(true);
    },
    [isLoading, sendMessage, error, clearError, setConversationTitleFromPrompt]
  );

  const handleRetry = useCallback(() => {
    clearError();
    regenerate();
  }, [clearError, regenerate]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto px-4 py-7 md:px-6"
          onScroll={handleScroll}
        >
          <div className="mx-auto max-w-3xl space-y-8">
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
            className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-popover/95 px-3 py-1.5 text-xs text-muted-foreground shadow-md backdrop-blur-sm transition-all duration-150 hover:text-foreground md:bottom-7 animate-message-in"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            Scroll to bottom
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border/80 bg-background px-4 pb-4 pt-3 md:px-6">
        <div className="mx-auto max-w-3xl">
          {messages.length > 0 && (
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground/90">Suggestions:</span>
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-40"
                  disabled={isLoading}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="relative rounded-[28px] border border-input bg-card">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Tom Panos AI"
                rows={1}
                className="min-h-[56px] w-full resize-none bg-transparent px-5 py-3 pr-16 text-[15px] leading-6 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                autoFocus
              />

              {isLoading ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => stop()}
                  className="absolute bottom-3 right-3 h-8 w-8 rounded-full border border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  title="Stop generation"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:opacity-90"
                  title="Send (Enter)"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </form>

          <p className="mt-2.5 text-center text-xs text-muted-foreground">
            Enter to send · Shift+Enter for new line · 613 transcripts indexed
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground/60">
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
  return (
    <div className="space-y-7 py-16 text-center">
      <div className="space-y-2.5 animate-message-in">
        <h2 className="text-[31px] font-semibold tracking-tight">What do you want to work on?</h2>
        <p className="mx-auto max-w-xl text-[15px] leading-6 text-muted-foreground">
          An unofficial AI trained on Tom Panos&apos; public teachings for listings, prospecting,
          auctions, mindset, and growth.
        </p>
      </div>

      {/* Suggested questions */}
      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTED_QUESTIONS.map((question, i) => (
          <button
            key={question}
            onClick={() => onSuggestedQuestion(question)}
            className="animate-message-in rounded-2xl border border-border bg-card/70 px-4 py-3 text-left text-sm leading-6 text-foreground/90 transition-colors hover:bg-card"
            style={{ animationDelay: `${100 + i * 40}ms` }}
          >
            {question}
          </button>
        ))}
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

  if (isUser) {
    return (
      <div className="flex justify-end animate-message-in">
        <div className="max-w-[78%] rounded-[26px] bg-muted px-4 py-2.5 text-[15px] leading-7 text-foreground">
          <p className="whitespace-pre-wrap">{textContent}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 animate-message-in">
      <div className="mt-1 h-6 w-6 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-[10px] font-semibold text-white grid place-items-center">
        TP
      </div>
      <div
        className={cn(
          "min-w-0 max-w-none flex-1 prose prose-sm dark:prose-invert prose-p:my-2 prose-p:leading-7 prose-headings:my-3 prose-headings:font-semibold prose-ul:my-2 prose-li:my-0.5 prose-strong:text-foreground",
          isStreaming && "streaming-cursor"
        )}
      >
        <ReactMarkdown>{textContent}</ReactMarkdown>
      </div>
    </div>
  );
});

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 animate-message-in">
      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-[10px] font-semibold text-white grid place-items-center">
        TP
      </div>
      <div className="flex h-6 items-center gap-1">
        <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
        <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
        <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function ErrorMessage({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex gap-3 animate-message-in items-start">
      <div className="w-6 h-6 shrink-0 mt-1 flex items-center justify-center">
        <AlertCircle className="w-5 h-5 text-destructive" />
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm">
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
