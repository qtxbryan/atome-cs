import { useState } from "react";
import type { Mistake } from "@/types/MistakeTypes";
import { ChevronDown, ChevronRight } from "lucide-react";

const COMPLAINT_LABELS: Record<string, string> = {
  wrong_info: "Wrong info",
  didnt_understand: "Didn't understand",
  missing_info: "Missing info",
  other: "Other",
};

interface RowProps {
  mistake: Mistake;
}

function ResolvedRow({ mistake }: RowProps) {
  const [expanded, setExpanded] = useState(false);

  const isApplied = mistake.status === "applied";
  const timestamp = new Date(mistake.timestamp).toLocaleString();

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-zinc-500 shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-zinc-500 shrink-0" />
        )}

        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
            isApplied
              ? "bg-green-900/60 text-green-300"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {isApplied ? "Applied" : "Dismissed"}
        </span>

        <span className="text-zinc-400 text-xs shrink-0">
          {COMPLAINT_LABELS[mistake.complaint_type] ?? mistake.complaint_type}
        </span>

        <span className="text-zinc-300 text-sm truncate flex-1">
          {mistake.customer_message}
        </span>

        <span className="text-zinc-600 text-xs shrink-0">{timestamp}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800">
          <div className="pt-3 text-sm text-zinc-400">
            <span className="font-medium text-zinc-300">Bot reply: </span>
            {mistake.bot_response}
          </div>

          {mistake.fix_diff && (
            <div className="space-y-1.5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Applied fix
              </p>
              <div className="border-l-4 border-green-600 bg-green-950/20 rounded-r-lg px-3 py-2">
                <p className="text-green-200 text-sm">{mistake.fix_diff.after}</p>
              </div>
              {mistake.fix_diff.explanation && (
                <p className="text-zinc-600 text-xs italic">
                  {mistake.fix_diff.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  applied: Mistake[];
  dismissed: Mistake[];
}

export default function ResolvedMistakes({ applied, dismissed }: Props) {
  const total = applied.length + dismissed.length;
  const [open, setOpen] = useState(false);

  if (total === 0) return null;

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800/60 transition-colors"
      >
        {open ? (
          <ChevronDown size={16} className="text-zinc-400" />
        ) : (
          <ChevronRight size={16} className="text-zinc-400" />
        )}
        <span className="text-zinc-300 font-medium text-sm">
          Resolved ({total})
        </span>
        <div className="flex gap-1.5 ml-1">
          {applied.length > 0 && (
            <span className="bg-green-900/60 text-green-300 text-xs px-2 py-0.5 rounded-full">
              {applied.length} applied
            </span>
          )}
          {dismissed.length > 0 && (
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full">
              {dismissed.length} dismissed
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="p-4 space-y-2 bg-zinc-950">
          {[...applied, ...dismissed].map((m) => (
            <ResolvedRow key={m.id} mistake={m} />
          ))}
        </div>
      )}
    </div>
  );
}
