export default function ChatHeader() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
      <div className="w-9 h-9 rounded-full bg-atome flex items-center justify-center shrink-0">
        <span className="text-black text-xs font-black">A</span>
      </div>
      <div>
        <p className="text-white font-semibold text-sm leading-tight">
          Atome Card Support
        </p>
        <p className="text-green-400 text-xs">Online</p>
      </div>
    </div>
  );
}
