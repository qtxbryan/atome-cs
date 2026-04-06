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
