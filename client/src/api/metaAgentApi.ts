import type { BotConfig } from "@/types/BotConfigTypes";

const BASE = import.meta.env.VITE_API_URL ?? "";

export interface MetaAgentMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendMetaMessage(
  messages: MetaAgentMessage[],
  documentContent: string | null,
  currentConfig: BotConfig
): Promise<BotConfig> {
  const res = await fetch(`${BASE}/api/meta-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      document_content: documentContent,
      current_config: currentConfig,
    }),
  });
  if (!res.ok) throw new Error(`Meta-agent error: ${res.status}`);
  return res.json();
}

export async function publishConfig(config: BotConfig): Promise<BotConfig> {
  const res = await fetch(`${BASE}/api/meta-agent/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(`Failed to publish config: ${res.status}`);
  return res.json();
}

export async function uploadDocument(file: File): Promise<{ content: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}
