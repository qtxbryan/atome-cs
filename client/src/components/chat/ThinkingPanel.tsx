interface Props {
  statusSteps: string[];
  activeToolCall: string | undefined;
  isStreaming: boolean;
  hasContent: boolean;
}

const TOOL_LABELS: Record<string, string> = {
  getCardStatus: "Looking up card status",
  getTransactionStatus: "Looking up transaction",
};

function resolveLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName.replace(/([A-Z])/g, " $1").trim();
}

export default function ThinkingPanel({
  statusSteps,
  activeToolCall,
  isStreaming,
  hasContent,
}: Props) {
  const isThinking = activeToolCall !== undefined || (isStreaming && !hasContent);

  if (statusSteps.length === 0 && !isThinking) return null;

  return (
    <div className="mb-2 rounded-xl overflow-hidden border border-zinc-700/60 bg-zinc-900 text-xs font-mono w-fit max-w-85">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 border-b border-zinc-700/60">
        <svg
          className="w-3.5 h-3.5 text-atome shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
        </svg>
        <span className="text-atome font-bold tracking-widest uppercase text-[10px]">
          Atome AI
        </span>
        <span className="text-zinc-500 text-[10px]">•</span>
        <span className="text-zinc-400 font-bold tracking-widest uppercase text-[10px]">
          Thinking
        </span>
      </div>

      {/* Steps */}
      {statusSteps.length > 0 && (
        <div className="px-3 py-2 space-y-1.5">
          <p className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold mb-2">
            Thought Process
          </p>
          {statusSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-atome/70 text-[10px] tabular-nums shrink-0 mt-px">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-zinc-300 text-[11px] leading-snug">{step}</span>
            </div>
          ))}
          {activeToolCall && (
            <div className="flex items-start gap-2 opacity-50">
              <span className="text-zinc-500 text-[10px] tabular-nums shrink-0 mt-px">
                {String(statusSteps.length + 1).padStart(2, "0")}
              </span>
              <span className="text-zinc-500 text-[11px] leading-snug italic">
                {resolveLabel(activeToolCall)}…
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer — shown while generating the text response */}
      {isStreaming && (
        <div className="flex items-center gap-1.5 px-3 py-2 border-t border-zinc-700/60 text-zinc-500">
          <span className="flex gap-0.5">
            <span
              className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </span>
          <span className="text-[10px] tracking-wide">
            Generating secure response...
          </span>
        </div>
      )}
    </div>
  );
}
