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

  return (
    <>
      <div className="flex justify-start">
        <div className="relative group max-w-[75%]">
          <div className="bg-zinc-800 text-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
            {message.isStreaming ? (
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
