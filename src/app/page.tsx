import { ChatInterface } from "@/components/chat-interface";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dumbbell } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-sm">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight tracking-tight">
                Tom Panos GPT
              </h1>
              <p className="text-xs text-muted-foreground leading-tight">
                Unofficial AI · Based on Tom Panos&apos; public teachings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                613 videos indexed
              </span>
            </div>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <Badge variant="outline" className="text-xs hidden sm:flex">
              GPT-4o
            </Badge>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  );
}
