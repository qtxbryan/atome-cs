import type { CardStatusData } from "@/types/ChatTypes";

const statusColors: Record<string, string> = {
  pending: "bg-zinc-600 text-zinc-200",
  under_review: "bg-blue-700 text-blue-100",
  approved: "bg-green-700 text-green-100",
  rejected: "bg-red-700 text-red-100",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
};

interface Props {
  data: CardStatusData;
}

export default function CardStatusWidget({ data }: Props) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 space-y-3 min-w-[260px]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
          Card Application
        </span>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            statusColors[data.status] ?? "bg-zinc-600 text-zinc-200"
          }`}
        >
          {statusLabels[data.status] ?? data.status}
        </span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">Application ID</span>
          <span className="text-white font-mono">{data.application_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Applied Date</span>
          <span className="text-white">{data.applied_date}</span>
        </div>
        {data.status !== "approved" && data.status !== "rejected" && (
          <div className="flex justify-between">
            <span className="text-zinc-400">Estimated Days</span>
            <span className="text-white">{data.estimated_days} days</span>
          </div>
        )}
      </div>
    </div>
  );
}
