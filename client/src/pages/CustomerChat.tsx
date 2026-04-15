import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStream } from "@/hooks/useChatStream";
import type { ConversationTurn } from "@/types/MistakeTypes";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import ReportMistakeModal from "@/components/chat/ReportMistakeModal";
import MistakeConfirmation from "@/components/chat/MistakeConfirmation";

interface ReportTarget {
  botMessage: string;
  history: ConversationTurn[];
}

function buildConversationHistory(
  messages: ReturnType<typeof useChatStream>["messages"],
  upToIndex: number
): ConversationTurn[] {
  return messages.slice(0, upToIndex + 1).map((m) => ({
    role: m.role as "user" | "assistant",
    content: typeof m.content === "string" ? m.content : "[Generative response]",
  }));
}

export default function CustomerChat() {
  const { messages, isStreaming, sendMessage } = useChatStream();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleReport = useCallback((botMessage: string, history: ConversationTurn[]) => {
    setReportTarget({ botMessage, history });
    setShowConfirmation(false);
  }, []);

  const handleReportClose = useCallback(() => setReportTarget(null), []);

  const handleReportSubmitted = useCallback(() => {
    setReportTarget(null);
    setShowConfirmation(true);
  }, []);

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
        {messages.length === 0 ? (
          <WelcomeScreen onSend={sendMessage} />
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id} className="animate-slideup">
              <ChatBubble
                message={msg}
                conversationHistory={buildConversationHistory(messages, idx)}
                onReport={handleReport}
              />
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} disabled={isStreaming} />

      {/* Modal and confirmation are rendered here — outside the scroll container
          and outside any transform context — so fixed positioning works correctly */}
      {reportTarget && (
        <ReportMistakeModal
          botMessage={reportTarget.botMessage}
          conversationHistory={reportTarget.history}
          isOpen={true}
          onClose={handleReportClose}
          onSubmitted={handleReportSubmitted}
        />
      )}

      {showConfirmation && (
        <MistakeConfirmation onContinue={() => setShowConfirmation(false)} />
      )}
    </div>
  );
}
