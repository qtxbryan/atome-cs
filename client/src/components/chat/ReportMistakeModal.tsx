import { useState } from "react";
import { useMistakes } from "@/context/MistakesContext";
import type { ComplaintType, ConversationTurn } from "@/types/MistakeTypes";

interface Props {
  botMessage: string;
  conversationHistory: ConversationTurn[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

const COMPLAINT_OPTIONS: { value: ComplaintType; label: string }[] = [
  { value: "wrong_info", label: "Wrong information" },
  { value: "didnt_understand", label: "Didn't understand my question" },
  { value: "missing_info", label: "Missing information" },
  { value: "other", label: "Other" },
];

export default function ReportMistakeModal({
  botMessage,
  conversationHistory,
  isOpen,
  onClose,
  onSubmitted,
}: Props) {
  const { reportMistake } = useMistakes();
  const [complaintType, setComplaintType] = useState<ComplaintType>("wrong_info");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const lastUserMessage =
    [...conversationHistory].reverse().find((m) => m.role === "user")?.content ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await reportMistake({
        customer_message: lastUserMessage,
        bot_response: botMessage,
        complaint_type: complaintType,
        comment,
        conversation_history: conversationHistory,
      });
      onSubmitted();
    } catch {
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fadein">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-800 mx-4">
        <h2 className="text-lg font-bold text-white mb-1">Report a Problem</h2>
        <p className="text-zinc-400 text-sm mb-4">
          Help us improve the bot by flagging this response.
        </p>

        <div className="border-l-4 border-atome bg-zinc-800/60 rounded-r-lg px-3 py-2 mb-4">
          <p className="text-zinc-300 text-sm line-clamp-3">{botMessage}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">
              What was wrong?
            </label>
            <select
              value={complaintType}
              onChange={(e) => setComplaintType(e.target.value as ComplaintType)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-atome/50"
            >
              {COMPLAINT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">
              Additional comments (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-atome/50 resize-none"
              placeholder="What should the bot have said?"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-atome text-black font-bold py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
