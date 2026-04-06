import { useEffect, useRef } from "react";
import { getMistakeById } from "@/api/mistakesApi";
import { useMistakes } from "@/context/MistakesContext";

export function useMistakePolling(mistakeId: string, isGenerating: boolean) {
  const { updateMistakeLocally } = useMistakes();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isGenerating) return;

    intervalRef.current = setInterval(async () => {
      try {
        const updated = await getMistakeById(mistakeId);
        if (!updated.fix_generating) {
          updateMistakeLocally(mistakeId, {
            fix_generating: false,
            fix_diff: updated.fix_diff,
          });
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // silently retry on next interval
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mistakeId, isGenerating, updateMistakeLocally]);
}
