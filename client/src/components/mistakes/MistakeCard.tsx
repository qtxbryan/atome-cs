import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Mistake } from "@/types/MistakeTypes";
import { useMistakes } from "@/context/MistakesContext";
import { useMistakePolling } from "@/hooks/useMistakePolling";
import FixDiffView from "./FixDiffView";

const COMPLAINT_LABELS: Record<string, string> = {
  wrong_info: "Wrong information",
  didnt_understand: "Didn't understand",
  missing_info: "Missing information",
  other: "Other",
};

interface Props {
  mistake: Mistake;
}

export default function MistakeCard({ mistake }: Props) {
  const { applyFix, dismissMistake } = useMistakes();
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  useMistakePolling(mistake.id, mistake.fix_generating);

  useEffect(() => {
    setEditedText(mistake.fix_diff?.after ?? "");
  }, [mistake.fix_diff]);

  async function handleApply(text: string | null) {
    setIsApplying(true);
    try {
      await applyFix(mistake.id, text);
      toast.success("Fix applied — guideline updated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to apply fix");
    } finally {
      setIsApplying(false);
    }
  }

  async function handleDismiss() {
    try {
      await dismissMistake(mistake.id);
      toast.success("Mistake dismissed.");
    } catch {
      toast.error("Failed to dismiss mistake.");
    }
  }

  const timestamp = new Date(mistake.timestamp).toLocaleString();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <span className="inline-block bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded-full">
            {COMPLAINT_LABELS[mistake.complaint_type] ?? mistake.complaint_type}
          </span>
          <p className="text-zinc-500 text-xs">{timestamp}</p>
        </div>
      </div>

      {/* Conversation snippet */}
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-0.5">
            Customer asked
          </p>
          <p className="text-zinc-300 bg-zinc-800/50 rounded-lg px-3 py-2">
            {mistake.customer_message}
          </p>
        </div>
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-0.5">
            Bot replied
          </p>
          <p className="text-zinc-300 bg-zinc-800/50 rounded-lg px-3 py-2 border-l-2 border-zinc-600">
            {mistake.bot_response}
          </p>
        </div>
        {mistake.comment && (
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-0.5">
              Customer comment
            </p>
            <p className="text-zinc-400 italic text-xs px-3">{mistake.comment}</p>
          </div>
        )}
      </div>

      {/* Diff area */}
      <div className="border-t border-zinc-800 pt-4">
        {mistake.fix_generating ? (
          <div className="space-y-2">
            <div className="h-4 bg-zinc-800 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-zinc-800 rounded animate-pulse w-1/2" />
            <p className="text-zinc-500 text-xs italic mt-1">
              AI is analysing this mistake…
            </p>
          </div>
        ) : editMode ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Edit Fix
            </p>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-atome/50 resize-none"
            />
            <button
              onClick={() => {
                handleApply(editedText.trim() || null);
                setEditMode(false);
              }}
              disabled={isApplying || !editedText.trim()}
              className="bg-atome text-black text-sm font-bold px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Apply Manual Fix
            </button>
          </div>
        ) : mistake.fix_diff ? (
          <FixDiffView fixDiff={mistake.fix_diff} />
        ) : (
          <p className="text-zinc-500 text-sm italic">
            AI fix unavailable — use "Edit Fix" to write one manually.
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setEditMode((v) => !v)}
          disabled={mistake.fix_generating}
          className="text-sm border border-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          {editMode ? "Cancel Edit" : "Edit Fix"}
        </button>

        <button
          onClick={() => handleApply(null)}
          disabled={
            isApplying || mistake.fix_generating || mistake.fix_diff === null
          }
          className="flex-1 bg-atome text-black font-bold text-sm px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {isApplying ? "Applying…" : "Approve & Apply"}
        </button>

        <button
          onClick={handleDismiss}
          className="text-sm text-zinc-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
