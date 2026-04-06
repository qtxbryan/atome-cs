import type { TransactionStatusData } from "@/types/ChatTypes";

const statusColors: Record<string, string> = {
  success: "bg-green-700 text-green-100",
  failed: "bg-red-700 text-red-100",
  processing: "bg-yellow-700 text-yellow-100",
  refunded: "bg-blue-700 text-blue-100",
};

const failureLabels: Record<string, string> = {
  insufficient_funds: "Insufficient funds",
  card_expired: "Card expired",
  network_error: "Network error",
  daily_limit_exceeded: "Daily limit exceeded",
};

interface Props {
  data: TransactionStatusData;
}

export default function TransactionStatusWidget({ data }: Props) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 space-y-3 min-w-[260px]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
          Transaction
        </span>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            statusColors[data.status] ?? "bg-zinc-600 text-zinc-200"
          }`}
        >
          {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
        </span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">Transaction ID</span>
          <span className="text-white font-mono">{data.transaction_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Amount</span>
          <span className="text-white font-semibold">
            {data.currency} {data.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Merchant</span>
          <span className="text-white">{data.merchant}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Date</span>
          <span className="text-white">{data.date}</span>
        </div>
        {data.failure_reason && (
          <div className="flex justify-between">
            <span className="text-zinc-400">Reason</span>
            <span className="text-red-400 font-medium">
              {failureLabels[data.failure_reason] ?? data.failure_reason}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
