import { Flag } from "lucide-react";

interface Props {
  onClick: () => void;
}

export default function ReportMistakeButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      title="Report a problem with this response"
      className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-700/60"
    >
      <Flag size={13} />
    </button>
  );
}
