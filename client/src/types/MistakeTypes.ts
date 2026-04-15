export interface FixDiff {
  guideline_index: number;
  before: string;
  after: string;
  explanation: string;
}

export type MistakeStatus = "pending_review" | "applied" | "dismissed";
export type ComplaintType =
  | "wrong_info"
  | "didnt_understand"
  | "missing_info"
  | "other";

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface Mistake {
  id: string;
  timestamp: string;
  customer_message: string;
  bot_response: string;
  complaint_type: ComplaintType;
  comment: string;
  status: MistakeStatus;
  fix_diff: FixDiff | null;
  fix_generating: boolean;
  conversation_history: ConversationTurn[];
}

export interface MistakesStore {
  pending_review: Mistake[];
  applied: Mistake[];
  dismissed: Mistake[];
}

export interface ReportMistakeRequest {
  customer_message: string;
  bot_response: string;
  complaint_type: ComplaintType;
  comment: string;
  conversation_history: ConversationTurn[];
}
