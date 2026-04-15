export type MessageRole = "user" | "assistant";

export interface CardStatusData {
  type: "card_status";
  application_id: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  applied_date: string;
  estimated_days: number;
}

export interface TransactionStatusData {
  type: "transaction_status";
  transaction_id: string;
  status: "success" | "failed" | "processing" | "refunded";
  amount: number;
  currency: string;
  merchant: string;
  date: string;
  failure_reason?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string | CardStatusData | TransactionStatusData;
  /** Brief intro text shown above a generative UI widget */
  textContent?: string;
  isStreaming?: boolean;
  statusSteps?: string[];
  activeToolCall?: string;
}

export interface ChatRequest {
  message: string;
  history: Array<{ role: MessageRole; content: string }>;
}

export function isCardStatusData(
  content: ChatMessage["content"]
): content is CardStatusData {
  return (
    typeof content === "object" &&
    "type" in content &&
    content.type === "card_status"
  );
}

export function isTransactionStatusData(
  content: ChatMessage["content"]
): content is TransactionStatusData {
  return (
    typeof content === "object" &&
    "type" in content &&
    content.type === "transaction_status"
  );
}
