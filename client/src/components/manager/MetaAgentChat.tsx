import { useRef, useEffect, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import type { BotConfig } from "@/types/BotConfigTypes";
import type { MetaAgentMessage } from "@/api/metaAgentApi";
import { streamMetaMessage } from "@/api/metaAgentApi";

// Detect explicit config-generation intent from the user's message
function hasConfigGenIntent(message: string): boolean {
  const lower = message.toLowerCase();
  const action = ["generate", "create", "build", "make", "produce"].some((w) =>
    lower.includes(w),
  );
  const target = ["config", "configuration", "the bot"].some((w) =>
    lower.includes(w),
  );
  return action && target;
}

interface Props {
  messages: MetaAgentMessage[];
  setMessages: React.Dispatch<React.SetStateAction<MetaAgentMessage[]>>;
  documentContent: string | null;
  currentConfig: BotConfig;
  onRequestGenerate: () => void;
  onClearChat: () => void;
}

export default function MetaAgentChat({
  messages,
  setMessages,
  documentContent,
  currentConfig,
  onRequestGenerate,
  onClearChat,
}: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const wantsConfig = hasConfigGenIntent(trimmed);
    const userMessage: MetaAgentMessage = { role: "user", content: trimmed };
    const assistantPlaceholder: MetaAgentMessage = { role: "assistant", content: "" };

    const messagesWithUser = [...messages, userMessage];
    setMessages([...messagesWithUser, assistantPlaceholder]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      await streamMetaMessage(
        messagesWithUser,
        documentContent,
        currentConfig,
        (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, content: last.content + token };
            return updated;
          });
        },
        // No config callback — config generation is explicit only
        () => {},
      );

      // Trigger config generation if the user's message asked for it
      if (wantsConfig) {
        onRequestGenerate();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reach meta-agent");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.length === 0 && (
          <p className="text-zinc-500 text-sm italic">
            Describe the bot you want to build. Ask follow-up questions to refine
            it, then click <span className="text-zinc-400 not-italic">Generate Config</span> when ready.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-atome text-black font-medium"
                  : "bg-zinc-800 text-zinc-200"
              }`}
            >
              {m.content || (
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-4 py-2 text-red-400 text-xs bg-red-950/30 border-t border-red-900">
          {error}
        </p>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 p-3 border-t border-zinc-800">
        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            disabled={loading}
            title="Clear conversation"
            className="shrink-0 text-zinc-500 hover:text-zinc-300 p-2 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            <Trash2 size={16} />
          </button>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
          rows={2}
          placeholder="Describe your bot or ask for a change…"
          className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-atome/50 placeholder-zinc-500 resize-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="shrink-0 bg-atome text-black p-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
