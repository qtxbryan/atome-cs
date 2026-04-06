import type { ChatHistoryItem } from "@/types/ChatTypes";
import { parseSSEStream } from "@/utils/parseSSEStream";

const BASE = import.meta.env.VITE_API_URL ?? "";

export async function streamChat(
  message: string,
  history: ChatHistoryItem[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
): Promise<void> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    onError(`Server error: ${res.status}`);
    return;
  }

  await parseSSEStream(res, onChunk, onDone, onError);
}
