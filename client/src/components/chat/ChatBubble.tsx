import { memo, useState } from "react";
import type { ChatMessage } from "@/types/ChatTypes";
import { isCardStatusData, isTransactionStatusData } from "@/types/ChatTypes";
import CardStatusWidget from "@/components/generative/CardStatusWidget";
import TransactionStatusWidget from "@/components/generative/TransactionStatusWidget";
import TypingIndicator from "./TypingIndicator";
import ReportMistakeButton from "./ReportMistakeButton";
import ReportMistakeModal from "./ReportMistakeModal";
import MistakeConfirmation from "./MistakeConfirmation";

interface Props {
  message: ChatMessage;
  previousUserMessage?: string;
}

const ChatBubble = memo(function ChatBubble({ message, previousUserMessage }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-atome text-black rounded-2xl rounded-tr-sm px-4 py-3 text-sm font-medium">
          {typeof message.content === "string" ? message.content : ""}
        </div>
      </div>
    );
  }

  const TOOL_LABELS: Record<string, string> = {
    getCardStatus: "Looking up card status",
    getTransactionStatus: "Looking up transaction",
  };

  return (
    <>
      <div className="flex justify-start">
        <div className="relative group max-w-[75%]">
          {message.activeToolCall && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-zinc-700 rounded-xl w-fit text-xs text-zinc-300">
              <svg
                className="w-3.5 h-3.5 animate-spin text-atome shrink-0"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <span>{TOOL_LABELS[message.activeToolCall] ?? message.activeToolCall}</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          )}
          <div className="bg-zinc-800 text-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
            {message.isStreaming && !message.content ? (
              <TypingIndicator />
            ) : isCardStatusData(message.content) ? (
              <CardStatusWidget data={message.content} />
            ) : isTransactionStatusData(message.content) ? (
              <TransactionStatusWidget data={message.content} />
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">
                {typeof message.content === "string" ? message.content : ""}
              </p>
            )}
          </div>

          {!message.isStreaming && typeof message.content === "string" && (
            <ReportMistakeButton onClick={() => setModalOpen(true)} />
          )}
        </div>
      </div>

      {modalOpen && !confirmed && (
        <ReportMistakeModal
          botMessage={typeof message.content === "string" ? message.content : ""}
          customerMessage={previousUserMessage ?? ""}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmitted={() => {
            setModalOpen(false);
            setConfirmed(true);
          }}
        />
      )}

      {confirmed && (
        <MistakeConfirmation onContinue={() => setConfirmed(false)} />
      )}
    </>
  );
});

export default ChatBubble;
