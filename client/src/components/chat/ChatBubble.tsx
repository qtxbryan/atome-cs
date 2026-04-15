import { memo } from "react";
import type { ChatMessage } from "@/types/ChatTypes";
import type { ConversationTurn } from "@/types/MistakeTypes";
import AssistantBubble from "./AssistantBubble";

interface Props {
  message: ChatMessage;
  conversationHistory: ConversationTurn[];
  onReport: (botMessage: string, history: ConversationTurn[]) => void;
}

const ChatBubble = memo(function ChatBubble({ message, conversationHistory, onReport }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-atome text-black rounded-2xl rounded-tr-sm px-4 py-3 text-sm font-medium">
          {typeof message.content === "string" ? message.content : ""}
        </div>
      </div>
    );
  }

  return (
    <AssistantBubble
      message={message}
      conversationHistory={conversationHistory}
      onReport={onReport}
    />
  );
});

export default ChatBubble;
