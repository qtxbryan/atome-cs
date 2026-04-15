import { useState } from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check, Flag } from "lucide-react";
import type { ChatMessage } from "@/types/ChatTypes";
import type { ConversationTurn } from "@/types/MistakeTypes";
import { isCardStatusData, isTransactionStatusData } from "@/types/ChatTypes";
import CardStatusWidget from "@/components/generative/CardStatusWidget";
import TransactionStatusWidget from "@/components/generative/TransactionStatusWidget";
import TypingIndicator from "./TypingIndicator";
import ThinkingPanel from "./ThinkingPanel";

interface Props {
  message: ChatMessage;
  conversationHistory: ConversationTurn[];
  onReport: (botMessage: string, history: ConversationTurn[]) => void;
}

/** Returns a plain-text version of the message suitable for clipboard/report. */
function getTextContent(message: ChatMessage): string {
  if (typeof message.content === "string") return message.content;
  if (isCardStatusData(message.content)) {
    const d = message.content;
    const lines = [
      `Card Application ${d.application_id}: ${d.status}`,
      `Applied: ${d.applied_date}`,
    ];
    if (d.estimated_days != null) lines.push(`Estimated: ${d.estimated_days} day(s)`);
    return lines.join("\n");
  }
  if (isTransactionStatusData(message.content)) {
    const d = message.content;
    const lines = [
      `Transaction ${d.transaction_id}: ${d.status}`,
      `Amount: ${d.currency} ${d.amount}`,
      `Merchant: ${d.merchant}`,
      `Date: ${d.date}`,
    ];
    if (d.failure_reason) lines.push(`Reason: ${d.failure_reason}`);
    return lines.join("\n");
  }
  return "";
}

/** Markdown component overrides for chat-style rendering. */
const markdownComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => {
    // Detect a paragraph whose sole non-whitespace child is a <strong> — treat as a section header.
    const kids = React.Children.toArray(children).filter(
      (c) => !(typeof c === "string" && c.trim() === "")
    );
    const isSectionHeader =
      kids.length === 1 &&
      React.isValidElement(kids[0]) &&
      (kids[0] as React.ReactElement).type === "strong";

    if (isSectionHeader) {
      return (
        <p className="font-semibold text-white mt-3.5 mb-1 pb-1 border-b border-zinc-700/50 first:mt-0">
          {children}
        </p>
      );
    }
    return <p className="leading-relaxed my-1.5 text-zinc-200">{children}</p>;
  },
  ul: ({ children }) => (
    <ul className="list-disc pl-5 my-1.5 space-y-1 text-zinc-200">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 my-1.5 space-y-1 text-zinc-200">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
  h1: ({ children }) => (
    <h1 className="font-bold text-white text-base mt-4 mb-1.5 pb-1 border-b border-zinc-700/50 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-semibold text-white text-sm mt-3.5 mb-1 pb-1 border-b border-zinc-700/50 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-semibold text-white text-sm mt-3 mb-0.5 first:mt-0">{children}</h3>
  ),
  code: ({ children }) => (
    <code className="bg-zinc-700 text-zinc-200 rounded px-1 py-0.5 text-xs font-mono">
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-zinc-600 pl-3 my-1.5 text-zinc-400 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-zinc-700 my-3" />,
};

export default function AssistantBubble({ message, conversationHistory, onReport }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const isGenerative =
    isCardStatusData(message.content) || isTransactionStatusData(message.content);

  const showThinking =
    !isGenerative &&
    !!message.isStreaming &&
    ((message.statusSteps?.length ?? 0) > 0 ||
      message.activeToolCall !== undefined ||
      !message.content);

  const showActions =
    !message.isStreaming &&
    (typeof message.content === "string" ? message.content !== "" : isGenerative);

  function handleCopy() {
    const text = getTextContent(message);
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReport() {
    const text = getTextContent(message);
    const label = isGenerative
      ? `[${isCardStatusData(message.content) ? "Card status" : "Transaction status"} widget] ${message.textContent ?? ""}`.trim()
      : text;
    onReport(label, conversationHistory);
  }

  const hoverStyle: React.CSSProperties = {
    opacity: isHovered ? 1 : 0,
    transform: isHovered ? "translateY(0px)" : "translateY(-4px)",
    transition: "opacity 0.15s ease, transform 0.15s ease",
    pointerEvents: isHovered ? "auto" : "none",
  };

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
              <ReactMarkdown components={markdownComponents}>
                {typeof message.content === "string" ? message.content : ""}
              </ReactMarkdown>
            )}
          </div>
        )}

        {/* Hover action toolbar: Copy + Report */}
        {showActions && (
          <div className="flex items-center gap-0.5 mt-1" style={hoverStyle}>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 active:scale-95 text-xs"
              style={{ transition: "color 0.15s ease, background-color 0.15s ease, transform 0.1s ease" }}
              title="Copy message"
            >
              {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
              <span className={copied ? "text-green-400" : ""}>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={handleReport}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 active:scale-95 text-xs"
              style={{ transition: "color 0.15s ease, background-color 0.15s ease, transform 0.1s ease" }}
              title="Report a problem with this response"
            >
              <Flag size={11} />
              <span>Report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
