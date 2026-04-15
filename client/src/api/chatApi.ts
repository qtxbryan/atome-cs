import type { ChatRequest } from "@/types/ChatTypes";

const API_URL = (import.meta as any).env.VITE_API_URL ?? "";

export async function streamChat(request: ChatRequest): Promise<Response> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw new Error(`Failed to stream chat: ${res.status}`);

  return res;
}
