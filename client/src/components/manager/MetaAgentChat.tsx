import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import type { BotConfig } from "@/types/BotConfigTypes";
import type { MetaAgentMessage } from "@/api/metaAgentApi";
import { sendMetaMessage } from "@/api/metaAgentApi";

interface Props {
  documentContent: string | null;
  currentConfig: BotConfig;
  onConfigGenerated: (config: BotConfig) => void;
}

export default function MetaAgentChat({
  documentContent,
  currentConfig,
  onConfigGenerated,
}: Props) {
  const [messages, setMessages] = useState<MetaAgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages: MetaAgentMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const generated = await sendMetaMessage(
        newMessages,
        documentContent,
        currentConfig
      );
      onConfigGenerated(generated);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I've generated a new bot configuration based on your description. Review it on the right and click **Publish Bot** when you're ready.",
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate config");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-[200px]">
        {messages.length === 0 && (
          <p className="text-zinc-500 text-sm italic">
            Describe the bot you want to create. You can also upload a document
            for context.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-atome text-black font-medium"
                  : "bg-zinc-800 text-zinc-200"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-xl px-3 py-2.5">
              <Loader2 size={16} className="text-zinc-400 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="px-4 py-2 text-red-400 text-xs bg-red-950/30 border-t border-red-900">
          {error}
        </p>
      )}

      <div className="flex items-end gap-2 p-3 border-t border-zinc-800">
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
          placeholder="Describe your bot…"
          className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-atome/50 placeholder-zinc-500 resize-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="shrink-0 bg-atome text-black p-2.5 rounded-xl hover:opacity-90 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
