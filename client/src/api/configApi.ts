import type { BotConfig } from "@/types/BotConfigTypes";

const BASE = import.meta.env.VITE_API_URL ?? "";

export async function getConfig(): Promise<BotConfig> {
  const res = await fetch(`${BASE}/api/config`);
  if (!res.ok) throw new Error(`Failed to fetch config: ${res.status}`);
  return res.json();
}

export async function updateConfig(config: BotConfig): Promise<BotConfig> {
  const res = await fetch(`${BASE}/api/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(`Failed to update config: ${res.status}`);
  return res.json();
}

export async function scrapeKb(
  url: string
): Promise<{ pages_scraped: number; scraped_at: string }> {
  const res = await fetch(`${BASE}/api/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail ?? `Request failed (${res.status})`;
    throw new Error(detail);
  }
  return res.json();
}

export async function getKb(): Promise<{ content: string }> {
  const res = await fetch(`${BASE}/api/kb`);
  if (!res.ok) throw new Error(`Failed to fetch KB content: ${res.status}`);
  return res.json();
}

export async function saveKb(content: string): Promise<void> {
  const res = await fetch(`${BASE}/api/kb`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Failed to save KB content: ${res.status}`);
}
