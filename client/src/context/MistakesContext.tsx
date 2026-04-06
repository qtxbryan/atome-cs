import { createContext, useContext, useState, type ReactNode } from "react";
import type { Mistake, MistakesStore, ReportMistakeRequest } from "@/types/MistakeTypes";
import * as mistakesApi from "@/api/mistakesApi";

interface MistakesContextValue {
  mistakes: MistakesStore | null;
  loading: boolean;
  error: string | null;
  fetchMistakes: () => Promise<void>;
  reportMistake: (req: ReportMistakeRequest) => Promise<Mistake>;
  applyFix: (id: string, editedAfter: string | null) => Promise<void>;
  dismissMistake: (id: string) => Promise<void>;
  updateMistakeLocally: (id: string, updates: Partial<Mistake>) => void;
}

const MistakesContext = createContext<MistakesContextValue | null>(null);

export function MistakesProvider({ children }: { children: ReactNode }) {
  const [mistakes, setMistakes] = useState<MistakesStore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchMistakes() {
    setLoading(true);
    setError(null);
    try {
      const data = await mistakesApi.getMistakes();
      setMistakes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch mistakes");
    } finally {
      setLoading(false);
    }
  }

  async function reportMistake(req: ReportMistakeRequest): Promise<Mistake> {
    const created = await mistakesApi.reportMistake(req);
    setMistakes((prev) => {
      if (!prev) return { pending_review: [created], applied: [], dismissed: [] };
      return { ...prev, pending_review: [...prev.pending_review, created] };
    });
    return created;
  }

  async function applyFix(id: string, editedAfter: string | null) {
    const updated = await mistakesApi.applyFix(id, editedAfter);
    setMistakes((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pending_review: prev.pending_review.filter((m) => m.id !== id),
        applied: [...prev.applied, updated],
      };
    });
  }

  async function dismissMistake(id: string) {
    const updated = await mistakesApi.dismissMistake(id);
    setMistakes((prev) => {
      if (!prev) return prev;
      return {
        pending_review: prev.pending_review.filter((m) => m.id !== id),
        applied: prev.applied.filter((m) => m.id !== id),
        dismissed: [...prev.dismissed, updated],
      };
    });
  }

  function updateMistakeLocally(id: string, updates: Partial<Mistake>) {
    setMistakes((prev) => {
      if (!prev) return prev;
      const updateIn = (list: Mistake[]) =>
        list.map((m) => (m.id === id ? { ...m, ...updates } : m));
      return {
        pending_review: updateIn(prev.pending_review),
        applied: updateIn(prev.applied),
        dismissed: updateIn(prev.dismissed),
      };
    });
  }

  return (
    <MistakesContext.Provider
      value={{
        mistakes,
        loading,
        error,
        fetchMistakes,
        reportMistake,
        applyFix,
        dismissMistake,
        updateMistakeLocally,
      }}
    >
      {children}
    </MistakesContext.Provider>
  );
}

export function useMistakes(): MistakesContextValue {
  const ctx = useContext(MistakesContext);
  if (!ctx) throw new Error("useMistakes must be used within MistakesProvider");
  return ctx;
}
