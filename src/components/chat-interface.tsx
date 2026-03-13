"use client";

import { useChat } from "@ai-sdk/react";
import { isTextUIPart, UIMessage, DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, RotateCcw, Zap } from "lucide-react";
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
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleSuggestedQuestion = (question: string) => {
    if (isLoading) return;
    sendMessage({ text: question });
  };

  const handleReset = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestedQuestion={handleSuggestedQuestion} />
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <TypingIndicator />
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-background/95 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {messages.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Quick questions:</span>
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="text-xs px-3 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors bg-background text-muted-foreground"
                  disabled={isLoading}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            {messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="shrink-0"
                title="New conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Tom anything about real estate..."
              className="flex-1 bg-background"
              disabled={isLoading}
              autoFocus
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0 bg-primary"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Powered by 613 Tom Panos video transcripts · Real Estate Gym knowledge base
          </p>
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onSuggestedQuestion }: { onSuggestedQuestion: (q: string) => void }) {
  return (
    <div className="text-center py-8 space-y-8">
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              TP
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            G&apos;day, I&apos;m Tom Panos
          </h2>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">
            Australia&apos;s #1 real estate coach. Ask me anything about listings,
            prospecting, auctions, mindset, or building your real estate career.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="secondary">🏆 Real Estate Gym</Badge>
          <Badge variant="secondary">⚡ Attraction Agent</Badge>
          <Badge variant="secondary">💰 Million Dollar Agent</Badge>
          <Badge variant="secondary">🔨 Auction Specialist</Badge>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          What do you want to work on?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
          {SUGGESTED_QUESTIONS.map((question) => (
            <button
              key={question}
              onClick={() => onSuggestedQuestion(question)}
              className="text-left px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium group"
            >
              <span className="text-primary group-hover:translate-x-0.5 inline-block transition-transform">
                →
              </span>{" "}
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  // Extract text content from UIMessage parts
  const textContent = message.parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join("");

  if (!textContent) return null;

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
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
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown>{textContent}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
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
