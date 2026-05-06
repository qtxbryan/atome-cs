import {
  ChatMessage,
  isCardStatusData,
  isTransactionStatusData,
} from "@/types/ChatTypes";

export function formatToolLabel(name: string): string {
  const label = name.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1) + "…";
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Converts structured generative content to a meaningful text for LLM history. */
export function contentToHistoryText(content: ChatMessage["content"]): string {
  if (typeof content === "string") return content;
  if (isCardStatusData(content)) {
    return (
      `Card application ${content.application_id}: status is ${content.status}, ` +
      `applied on ${content.applied_date}, estimated ${content.estimated_days} day(s) remaining.`
    );
  }
  if (isTransactionStatusData(content)) {
    const base =
      `Transaction ${content.transaction_id}: status is ${content.status}, ` +
      `amount ${content.currency} ${content.amount}, merchant ${content.merchant}, date ${content.date}`;
    return content.failure_reason
      ? `${base}, reason: ${content.failure_reason}.`
      : `${base}.`;
  }
  return "";
}
