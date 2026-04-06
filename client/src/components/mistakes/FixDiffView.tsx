import type { FixDiff } from "@/types/MistakeTypes";

interface Props {
  fixDiff: FixDiff;
}

export default function FixDiffView({ fixDiff }: Props) {
  return (
    <div className="space-y-2">
      <div className="border-l-4 border-red-500 bg-red-950/30 rounded-r-lg px-3 py-2.5">
        <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-1">
          Before
        </p>
        <p className="text-red-200 text-sm">{fixDiff.before}</p>
      </div>

      <div className="border-l-4 border-green-500 bg-green-950/30 rounded-r-lg px-3 py-2.5">
        <p className="text-xs font-medium text-green-400 uppercase tracking-wider mb-1">
          After
        </p>
        <p className="text-green-200 text-sm">{fixDiff.after}</p>
      </div>

      {fixDiff.explanation && (
        <p className="text-zinc-500 text-xs italic px-1">
          AI rationale: {fixDiff.explanation}
        </p>
      )}
    </div>
  );
}
