import type { CardStatusData, TransactionStatusData } from "@/types/ChatTypes";

export function parseGeminiResponse(
  text: string
): CardStatusData | TransactionStatusData | string {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && "type" in parsed) {
      if (parsed.type === "card_status") {
        return parsed as CardStatusData;
      }
      if (parsed.type === "transaction_status") {
        return parsed as TransactionStatusData;
      }
    }
  } catch {
    // not JSON — fall through to return raw string
  }
  return text;
}
