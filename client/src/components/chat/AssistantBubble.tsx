import { useState } from "react";
import type { ChatMessage } from "@/types/ChatTypes";
import type { ConversationTurn } from "@/types/MistakeTypes";
import { isCardStatusData, isTransactionStatusData } from "@/types/ChatTypes";
import CardStatusWidget from "@/components/generative/CardStatusWidget";
import TransactionStatusWidget from "@/components/generative/TransactionStatusWidget";
import TypingIndicator from "./TypingIndicator";
import ReportMistakeButton from "./ReportMistakeButton";
import ThinkingPanel from "./ThinkingPanel";

interface Props {
  message: ChatMessage;
  conversationHistory: ConversationTurn[];
  onReport: (botMessage: string, history: ConversationTurn[]) => void;
}

export default function AssistantBubble({ message, conversationHistory, onReport }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  const isGenerative =
    isCardStatusData(message.content) || isTransactionStatusData(message.content);

  // Only show while streaming; never shown when the widget already has the answer
  const showThinking =
    !isGenerative &&
    !!message.isStreaming &&
    ((message.statusSteps?.length ?? 0) > 0 ||
      message.activeToolCall !== undefined ||
      !message.content);

  const showReportButton =
    !message.isStreaming && typeof message.content === "string" && message.content !== "";

  return (
    <div
      className="flex justify-start"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-[75%] flex flex-col">
        {showThinking && (
          <ThinkingPanel
            statusSteps={message.statusSteps ?? []}
            activeToolCall={message.activeToolCall}
            isStreaming={!!message.isStreaming}
            hasContent={typeof message.content === "string" && message.content.length > 0}
          />
        )}

        {/* Brief intro text above generative widgets */}
        {isGenerative && message.textContent && (
          <div className="bg-zinc-800 text-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm mb-2">
            <p className="leading-relaxed">{message.textContent}</p>
          </div>
        )}

        {/* Generative UI — no bubble wrapper */}
        {isCardStatusData(message.content) ? (
          <CardStatusWidget data={message.content} />
        ) : isTransactionStatusData(message.content) ? (
          <TransactionStatusWidget data={message.content} />
        ) : (
          <div className="bg-zinc-800 text-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
            {message.isStreaming && !message.content ? (
              <TypingIndicator />
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">
                {typeof message.content === "string" ? message.content : ""}
              </p>
            )}
          </div>
        )}

        {showReportButton && (
          <div
            className="flex justify-end mt-1"
            style={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? "translateY(0px)" : "translateY(-4px)",
              transition: "opacity 0.18s ease, transform 0.18s ease",
              pointerEvents: isHovered ? "auto" : "none",
            }}
          >
            <ReportMistakeButton
              onClick={() =>
                onReport(
                  typeof message.content === "string" ? message.content : "",
                  conversationHistory
                )
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
