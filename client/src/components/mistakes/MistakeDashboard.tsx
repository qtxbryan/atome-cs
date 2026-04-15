import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useMistakes } from "@/context/MistakesContext";
import { useDebounce } from "@/hooks/useDebounce";
import MistakeCard from "./MistakeCard";
import ResolvedMistakes from "./ResolvedMistakes";
import type { Mistake } from "@/types/MistakeTypes";

const COMPLAINT_LABELS: Record<string, string> = {
  wrong_info: "Wrong info",
  didnt_understand: "Didn't understand",
  missing_info: "Missing info",
  other: "Other",
};

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "wrong_info", label: "Wrong info" },
  { id: "didnt_understand", label: "Didn't understand" },
  { id: "missing_info", label: "Missing info" },
  { id: "other", label: "Other" },
];

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

function sortByLatest(list: Mistake[]): Mistake[] {
  return [...list].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export default function MistakeDashboard() {
  const { mistakes, loading, error, fetchMistakes } = useMistakes();

  const [searchRaw, setSearchRaw] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const search = useDebounce(searchRaw, 300);

  useEffect(() => {
    fetchMistakes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters(list: Mistake[]): Mistake[] {
    let result = sortByLatest(list);

    if (typeFilter !== "all") {
      result = result.filter((m) => m.complaint_type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.customer_message.toLowerCase().includes(q) ||
          m.bot_response.toLowerCase().includes(q) ||
          (COMPLAINT_LABELS[m.complaint_type] ?? m.complaint_type)
            .toLowerCase()
            .includes(q)
      );
    }

    return result;
  }

  const filteredPending = mistakes ? applyFilters(mistakes.pending_review) : [];
  const filteredApplied = mistakes ? applyFilters(mistakes.applied) : [];
  const filteredDismissed = mistakes ? applyFilters(mistakes.dismissed) : [];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Mistake Review</h2>
        <button
          onClick={fetchMistakes}
          className="text-zinc-400 hover:text-white text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Search + filter */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Search mistakes…"
            className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-atome/50 placeholder-zinc-500"
          />
          {searchRaw && (
            <button
              onClick={() => setSearchRaw("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTypeFilter(opt.id)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                typeFilter === opt.id
                  ? "bg-atome text-black border-atome font-semibold"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
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

            {filteredPending.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-8 text-center">
                <p className="text-zinc-500 text-sm">
                  {mistakes && mistakes.pending_review.length === 0
                    ? "No pending mistakes — the bot is doing great!"
                    : "No mistakes match your search."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPending.map((m) => (
                  <MistakeCard key={m.id} mistake={m} />
                ))}
              </div>
            )}
          </div>

          {mistakes && (
            <ResolvedMistakes
              applied={filteredApplied}
              dismissed={filteredDismissed}
            />
          )}
        </>
      )}
    </div>
  );
}
