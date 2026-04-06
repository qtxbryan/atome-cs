import { useEffect } from "react";
import { useMistakes } from "@/context/MistakesContext";
import MistakeCard from "./MistakeCard";
import ResolvedMistakes from "./ResolvedMistakes";

function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
        >
          <div className="h-5 bg-zinc-800 rounded animate-pulse w-1/3" />
          <div className="h-4 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 bg-zinc-800 rounded animate-pulse w-4/5" />
        </div>
      ))}
    </div>
  );
}

export default function MistakeDashboard() {
  const { mistakes, loading, error, fetchMistakes } = useMistakes();

  useEffect(() => {
    fetchMistakes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Mistake Review</h2>
        <button
          onClick={fetchMistakes}
          className="text-zinc-400 hover:text-white text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && !mistakes ? (
        <Skeleton />
      ) : (
        <>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Pending Review
              </h3>
              {mistakes && mistakes.pending_review.length > 0 && (
                <span className="bg-atome text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {mistakes.pending_review.length}
                </span>
              )}
            </div>

            {!mistakes || mistakes.pending_review.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-8 text-center">
                <p className="text-zinc-500 text-sm">
                  No pending mistakes — the bot is doing great!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {mistakes.pending_review.map((m) => (
                  <MistakeCard key={m.id} mistake={m} />
                ))}
              </div>
            )}
          </div>

          {mistakes && (
            <ResolvedMistakes
              applied={mistakes.applied}
              dismissed={mistakes.dismissed}
            />
          )}
        </>
      )}
    </div>
  );
}
