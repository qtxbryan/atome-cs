import { Flag } from "lucide-react";

interface Props {
  onClick: () => void;
}

export default function ReportMistakeButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      title="Report a problem with this response"
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 active:scale-95 text-xs"
      style={{ transition: "color 0.15s ease, background-color 0.15s ease, transform 0.1s ease" }}
    >
      <Flag size={11} />
      <span>Report</span>
    </button>
  );
}
