"use client";

import { useCallback, useMemo, useState } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

type ChatHistoryItem = {
  id: number;
  title: string;
  createdAt: string;
};

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatVersion, setChatVersion] = useState(1);
  const [activeChatId, setActiveChatId] = useState(1);
  const [history, setHistory] = useState<ChatHistoryItem[]>([
    { id: 1, title: "New chat", createdAt: "Now" },
  ]);

  const activeChat = useMemo(
    () => history.find((item) => item.id === activeChatId),
    [history, activeChatId]
  );

  const handleNewChat = useCallback(() => {
    const id = Date.now();
    setHistory((prev) => [{ id, title: "New chat", createdAt: "Now" }, ...prev]);
    setActiveChatId(id);
    setChatVersion((prev) => prev + 1);
  }, []);

  const handleConversationTitle = useCallback((title: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === activeChatId ? { ...item, title: title || "New chat" } : item
      )
    );
  }, [activeChatId]);

  return (
    <div className="flex h-[100dvh] bg-background text-foreground">
      <aside
        className={cn(
          "shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
          isSidebarOpen ? "w-[260px]" : "w-0 overflow-hidden md:w-[72px]"
        )}
      >
        <div className="flex h-full flex-col px-2.5 py-3">
          <div className="mb-4 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-10 flex-1 justify-start gap-2 rounded-xl border-sidebar-border bg-sidebar-accent px-3 text-[15px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/80",
                !isSidebarOpen && "justify-center px-0"
              )}
              onClick={handleNewChat}
            >
              <Plus className="h-4 w-4" />
              {isSidebarOpen && <span>New chat</span>}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {isSidebarOpen && (
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/90">
                Recent
              </p>
              <div className="space-y-1.5">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveChatId(item.id)}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 text-left transition-colors",
                      item.id === activeChatId
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70"
                    )}
                  >
                    <p className="truncate text-[14px] font-medium leading-5">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{item.createdAt}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-center border-b border-border/80 px-6">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {activeChat?.title ?? "Tom Panos AI"} <span className="ml-1">▾</span>
          </p>
        </div>

        <div className="min-h-0 flex-1">
          <ChatInterface
            key={chatVersion}
            onConversationTitleChange={handleConversationTitle}
          />
        </div>
      </main>
    </div>
  );
}
