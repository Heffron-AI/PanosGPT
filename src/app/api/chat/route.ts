import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, UIMessage } from "ai";
import { searchKnowledge } from "@/lib/knowledge-base";
import { buildSystemPromptWithContext } from "@/lib/system-prompt";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Get the last user message for RAG context retrieval
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  // Extract text content from UIMessage parts
  const queryText = lastUserMessage?.parts
    ?.filter((p) => p.type === "text")
    .map((p) => ("text" in p ? p.text : ""))
    .join(" ") ?? "";

  // Retrieve relevant knowledge chunks via keyword search
  const knowledgeChunks = searchKnowledge(queryText, 4);

  // Build system prompt with injected context
  const systemPrompt = buildSystemPromptWithContext(
    knowledgeChunks.map((c) => ({
      title: c.title,
      content: c.content,
      url: c.url,
    }))
  );

  // Convert UIMessages to model messages
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: modelMessages,
    temperature: 0.85,
  });

  return result.toUIMessageStreamResponse();
}
