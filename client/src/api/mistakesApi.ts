import type { Mistake, MistakesStore, ReportMistakeRequest } from "@/types/MistakeTypes";

const BASE = import.meta.env.VITE_API_URL ?? "";

export async function getMistakes(): Promise<MistakesStore> {
  const res = await fetch(`${BASE}/api/mistakes`);
  if (!res.ok) throw new Error(`Failed to fetch mistakes: ${res.status}`);
  return res.json();
}

export async function getMistakeById(id: string): Promise<Mistake> {
  const res = await fetch(`${BASE}/api/mistakes/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch mistake: ${res.status}`);
  return res.json();
}

export async function reportMistake(req: ReportMistakeRequest): Promise<Mistake> {
  const res = await fetch(`${BASE}/api/mistakes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Failed to report mistake: ${res.status}`);
  return res.json();
}

export async function applyFix(
  id: string,
  editedAfter: string | null
): Promise<Mistake> {
  const res = await fetch(`${BASE}/api/mistakes/${id}/apply`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ edited_after: editedAfter }),
  });
  if (!res.ok) throw new Error(`Failed to apply fix: ${res.status}`);
  return res.json();
}

export async function dismissMistake(id: string): Promise<Mistake> {
  const res = await fetch(`${BASE}/api/mistakes/${id}/dismiss`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error(`Failed to dismiss mistake: ${res.status}`);
  return res.json();
}
