import {
  ChatMessage,
  isCardStatusData,
  isTransactionStatusData,
  ChatFormatMode,
} from "@/types/ChatTypes";

export function formatToolLabel(name: string): string {
  const label = name.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1) + "…";
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatStructuredContent(
  content: ChatMessage["content"],
  mode: ChatFormatMode
): string {
  if (typeof content === "string") return content;
  if (isCardStatusData(content)) {
    if (mode === "history") {
      return (
        `Card application ${content.application_id}: status is ${content.status}, ` +
        `applied on ${content.applied_date}, estimated ${content.estimated_days} day(s) remaining.`
      );
    }
    const lines = [
      `Card Application ${content.application_id}: ${content.status}`,
      `Applied: ${content.applied_date}`,
    ];
    if (content.estimated_days != null)
      lines.push(`Estimated: ${content.estimated_days} day(s)`);
    return lines.join("\n");
  }
  if (isTransactionStatusData(content)) {
    if (mode === "history") {
      const base =
        `Transaction ${content.transaction_id}: status is ${content.status}, ` +
        `amount ${content.currency} ${content.amount}, merchant ${content.merchant}, date ${content.date}`;
      return content.failure_reason
        ? `${base}, reason: ${content.failure_reason}.`
        : `${base}.`;
    }
    const lines = [
      `Transaction ${content.transaction_id}: ${content.status}`,
      `Amount: ${content.currency} ${content.amount}`,
      `Merchant: ${content.merchant}`,
      `Date: ${content.date}`,
    ];
    if (content.failure_reason) lines.push(`Reason: ${content.failure_reason}`);
    return lines.join("\n");
  }
  return "";
}

/** Converts structured generative content to a meaningful text for LLM history. */
export function contentToHistoryText(content: ChatMessage["content"]): string {
  return formatStructuredContent(content, "history");
}

/** Returns a plain-text version of the message suitable for clipboard/report. */
export function messageToPlainText(message: ChatMessage): string {
  return formatStructuredContent(message.content, "plain");
}
