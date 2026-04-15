import { memo, useState } from "react";
import { Copy, Check } from "lucide-react";
import type { ChatMessage } from "@/types/ChatTypes";
import type { ConversationTurn } from "@/types/MistakeTypes";
import AssistantBubble from "./AssistantBubble";

interface Props {
  message: ChatMessage;
  conversationHistory: ConversationTurn[];
  onReport: (botMessage: string, history: ConversationTurn[]) => void;
}

function UserBubble({ content }: { content: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="flex justify-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col items-end max-w-[75%]">
        <div className="bg-atome text-black rounded-2xl rounded-tr-sm px-4 py-3 text-sm font-medium">
          {content}
        </div>

        <div
          className="flex items-center gap-0.5 mt-1"
          style={{
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? "translateY(0px)" : "translateY(-4px)",
            transition: "opacity 0.15s ease, transform 0.15s ease",
            pointerEvents: isHovered ? "auto" : "none",
          }}
        >
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 active:scale-95 text-xs"
            style={{ transition: "color 0.15s ease, background-color 0.15s ease, transform 0.1s ease" }}
            title="Copy message"
          >
            {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            <span className={copied ? "text-green-400" : ""}>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const ChatBubble = memo(function ChatBubble({ message, conversationHistory, onReport }: Props) {
  if (message.role === "user") {
    return (
      <UserBubble
        content={typeof message.content === "string" ? message.content : ""}
      />
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
