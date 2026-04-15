import { useState, useCallback, useRef } from "react";
import { streamChat } from "@/api/chatApi";
import type { ChatMessage, MessageRole, CardStatusData, TransactionStatusData } from "@/types/ChatTypes";
import { isCardStatusData, isTransactionStatusData } from "@/types/ChatTypes";

function formatToolLabel(name: string): string {
  const label = name.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1) + "…";
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Converts structured generative content to a meaningful text for LLM history. */
function contentToHistoryText(content: ChatMessage["content"]): string {
  if (typeof content === "string") return content;
  if (isCardStatusData(content)) {
    return (
      `Card application ${content.application_id}: status is ${content.status}, ` +
      `applied on ${content.applied_date}, estimated ${content.estimated_days} day(s) remaining.`
    );
  }
  if (isTransactionStatusData(content)) {
    const base =
      `Transaction ${content.transaction_id}: status is ${content.status}, ` +
      `amount ${content.currency} ${content.amount}, merchant ${content.merchant}, date ${content.date}`;
    return content.failure_reason ? `${base}, reason: ${content.failure_reason}.` : `${base}.`;
  }
  return "";
}

/** Returns a brief intro sentence shown above the generative widget. */
function getWidgetIntro(data: CardStatusData | TransactionStatusData): string {
  if (data.type === "card_status") return "Here is the status for your card application:";
  return "Here are the details for your transaction:";
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesRef = useRef<ChatMessage[]>([]);
  const isStreamingRef = useRef(false);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreamingRef.current) return;

    setError(null);

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text.trim(),
    };

    const assistantId = generateId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    // Serialize structured content to meaningful text so the LLM understands history
    const history = messagesRef.current.map((m) => ({
      role: m.role as MessageRole,
      content: contentToHistoryText(m.content),
    }));

    messagesRef.current = [...messagesRef.current, userMessage, assistantMessage];
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    isStreamingRef.current = true;
    setIsStreaming(true);

    try {
      const response = await streamChat({ message: text.trim(), history });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "message";
      let generativeContentReceived = false;

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line === "") {
            currentEvent = "message";
            continue;
          }

          if (line.startsWith("event:")) {
            currentEvent = line.slice("event:".length).trim();
            continue;
          }

          if (line.startsWith("data:")) {
            const raw = line.slice("data:".length);
            const payload = raw.startsWith(" ") ? raw.slice(1) : raw;

            if (currentEvent === "tool_result") {
              try {
                const data = JSON.parse(payload) as CardStatusData | TransactionStatusData;
                if (data.type === "card_status" || data.type === "transaction_status") {
                  const intro = getWidgetIntro(data);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: data, textContent: intro }
                        : m
                    )
                  );
                  generativeContentReceived = true;
                }
              } catch {
                // not structured data — ignore
              }
            } else if (currentEvent === "tool_call") {
              const toolName = payload.trim();
              if (!toolName) continue;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        activeToolCall: toolName,
                        statusSteps: [
                          ...(m.statusSteps ?? []),
                          formatToolLabel(toolName),
                        ],
                      }
                    : m
                )
              );
            } else if (currentEvent === "tool_done") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, activeToolCall: undefined } : m
                )
              );
            } else if (currentEvent === "done") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, activeToolCall: undefined } : m
                )
              );
            } else if (currentEvent === "error") {
              if (payload) setError(payload);
            } else if (currentEvent === "message") {
              if (!payload) continue;
              // Server JSON-encodes chunks so embedded newlines survive SSE line splitting
              let chunk: string;
              try {
                chunk = JSON.parse(payload) as string;
              } catch {
                chunk = payload;
              }
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id === assistantId && typeof m.content === "string") {
                    return { ...m, content: m.content + chunk };
                  }
                  return m;
                })
              );
            }
          }
        }

        // Widget is ready — cancel the stream so the input isn't blocked
        // while the LLM generates a redundant text summary
        if (generativeContentReceived) {
          reader.cancel();
          break outer;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        const isRateLimit = err.message.includes("429");
        const errorText = isRateLimit
          ? "You've reached the rate limit (30 messages/hour). Please wait a while before sending another message."
          : "Something went wrong. Please try again.";

        // Replace the empty assistant bubble with an inline error message
        // rather than silently removing it, so the user understands what happened.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: errorText, isStreaming: false }
              : m
          )
        );
        messagesRef.current = messagesRef.current.map((m) =>
          m.id === assistantId ? { ...m, content: errorText, isStreaming: false } : m
        );
        setError(err.message);
        return;
      }
    } finally {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
      setMessages((prev) => {
        messagesRef.current = prev;
        return prev;
      });
      isStreamingRef.current = false;
      setIsStreaming(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    messagesRef.current = [];
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, clearMessages };
}
