import { useState, useRef, type KeyboardEvent } from "react";
import { Paperclip, ArrowRight } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    // Reset textarea height after send
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }

  return (
    <div className="px-16 pb-6 pt-2">
      {/* Glow wrapper */}
      <div className="relative group">
        {/* Gradient glow layer */}
        <div className="absolute -inset-1 bg-linear-to-r from-[#F4FF5F] to-[#fccc33] rounded-xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200" />

        {/* Input container */}
        <div className="relative flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={disabled}
            rows={1}
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm resize-none focus:outline-none overflow-y-auto disabled:opacity-50"
            style={{ minHeight: "24px", maxHeight: "144px" }}
          />

          <div className="flex items-center gap-1 shrink-0">
            <button
              disabled={disabled}
              title="Attach file (coming soon)"
              className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-md transition-colors disabled:opacity-30"
            >
              <Paperclip size={16} />
            </button>

            <button
              onClick={handleSend}
              disabled={disabled || !value.trim()}
              className="bg-atome text-black p-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
              aria-label="Send message"
            >
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[10px] text-zinc-600 mt-5 tracking-wide uppercase">
        AI may provide inaccurate info.
      </p>
    </div>
  );
}
