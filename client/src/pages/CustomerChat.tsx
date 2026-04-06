import { useEffect, useRef } from "react";
import { useChatStream } from "@/hooks/useChatStream";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";


export default function CustomerChat() {
  const { messages, isStreaming, sendMessage } = useChatStream();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-black">
      <ChatHeader />

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.map((msg, idx) => {
          const prevUserMsg = idx > 0
            ? messages
                .slice(0, idx)
                .reverse()
                .find((m) => m.role === "user")
            : undefined;

          return (
            <ChatBubble
              key={msg.id}
              message={msg}
              previousUserMessage={
                typeof prevUserMsg?.content === "string"
                  ? prevUserMsg.content
                  : undefined
              }
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
