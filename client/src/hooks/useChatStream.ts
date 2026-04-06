import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessage, ChatHistoryItem } from "@/types/ChatTypes";
import { streamChat } from "@/api/botApi";
import { parseGeminiResponse } from "@/utils/parseGeminiResponse";

const GREETING: ChatMessage = {
  id: "greeting",
  role: "bot",
  content:
    "Hi! I'm the Atome Card Support assistant. I can help you with card applications, transaction inquiries, and more. How can I help you today?",
};

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming) return;

      const userMsg: ChatMessage = { id: uuidv4(), role: "user", content: text };
      const botMsgId = uuidv4();
      const botMsg: ChatMessage = {
        id: botMsgId,
        role: "bot",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setIsStreaming(true);

      const history: ChatHistoryItem[] = messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
        }));

      let accumulated = "";

      await streamChat(
        text,
        history,
        (chunk) => {
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, content: accumulated } : m
            )
          );
        },
        () => {
          const parsed = parseGeminiResponse(accumulated);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? { ...m, content: parsed, isStreaming: false, activeToolCall: undefined }
                : m
            )
          );
          setIsStreaming(false);
        },
        (errMsg) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    content: `Sorry, something went wrong: ${errMsg}`,
                    isStreaming: false,
                    activeToolCall: undefined,
                  }
                : m
            )
          );
          setIsStreaming(false);
        },
        (toolName) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, activeToolCall: toolName } : m
            )
          );
        },
        () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, activeToolCall: undefined } : m
            )
          );
        }
      );
    },
    [messages, isStreaming]
  );

  return { messages, isStreaming, sendMessage };
}
