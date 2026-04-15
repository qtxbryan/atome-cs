import type { BotConfig } from "@/types/BotConfigTypes";

const BASE = import.meta.env.VITE_API_URL ?? "";

export interface MetaAgentMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamMetaMessage(
  messages: MetaAgentMessage[],
  documentContent: string | null,
  currentConfig: BotConfig,
  onToken: (token: string) => void,
  onConfig: (config: BotConfig) => void,
): Promise<void> {
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
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by double newlines
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      if (!event.trim()) continue;

      let eventType = "";
      let data = "";

      for (const line of event.split("\n")) {
        if (line.startsWith("event: ")) eventType = line.slice(7).trim();
        else if (line.startsWith("data: ")) data = line.slice(6);
      }

      if (!data) continue;

      if (eventType === "text") {
        onToken(JSON.parse(data) as string);
      } else if (eventType === "config") {
        onConfig(JSON.parse(data) as BotConfig);
      } else if (eventType === "error") {
        throw new Error(JSON.parse(data) as string);
      }
    }
  }
}

export async function generateConfig(
  messages: MetaAgentMessage[],
  documentContent: string | null,
  currentConfig: BotConfig,
): Promise<BotConfig> {
  const res = await fetch(`${BASE}/api/meta-agent/generate-config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      document_content: documentContent,
      current_config: currentConfig,
    }),
  });
  if (!res.ok) throw new Error(`Config generation error: ${res.status}`);
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
