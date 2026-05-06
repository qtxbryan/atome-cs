import { MessageRole } from "@/types/ChatTypes";

export interface FixDiff {
  guideline_index: number;
  before: string;
  after: string;
  explanation: string;
}

export enum MistakeStatus {
  PendingReview = "pending_review",
  Applied = "applied",
  Dismissed = "dismissed",
}

export enum ComplaintType {
  WrongInfo = "wrong_info",
  DidntUnderstand = "didnt_understand",
  MissingInfo = "missing_info",
  Other = "other",
}

export interface ConversationTurn {
  role: MessageRole;
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
