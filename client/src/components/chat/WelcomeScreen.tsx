import { CreditCard, Shield, Receipt, Headphones } from "lucide-react";

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <CreditCard size={18} />,
    title: "Check Credit Limit",
    description: "View your available balance and upcoming payments.",
    prompt: "What is my current credit limit and available balance?",
  },
  {
    icon: <Shield size={18} />,
    title: "Security & Access",
    description: "Freeze your card or reset your secure transaction PIN.",
    prompt: "I need help with my card security settings.",
  },
  {
    icon: <Receipt size={18} />,
    title: "Transaction Inquiry",
    description: "Dispute a charge or get details on a specific purchase.",
    prompt: "I have a question about a recent transaction.",
  },
  {
    icon: <Headphones size={18} />,
    title: "Talk to Human",
    description: "Transfer this session to a specialist concierge.",
    prompt: "I would like to speak with a human agent.",
  },
];

interface Props {
  onSend: (text: string) => void;
}

export default function WelcomeScreen({ onSend }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center animate-fadein">
      {/* App icon */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <span className="text-white text-2xl font-black">A</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-atome flex items-center justify-center">
          <span className="text-black text-[10px] font-black leading-none">!</span>
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-white text-2xl font-bold leading-snug mb-3 max-w-xs">
        How can we help with your Atome Card today?
      </h1>

      {/* Subtitle */}
      <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-70">
        Ask about your limit, recent transactions, or request a card
        replacement. Our AI concierge is ready to assist you.
      </p>

      {/* Quick action grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.title}
            onClick={() => onSend(action.prompt)}
            className="flex flex-col items-start gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 text-left transition-colors duration-150 active:scale-[0.98]"
          >
            <span className="text-atome">{action.icon}</span>
            <div>
              <p className="text-white text-xs font-semibold leading-tight mb-0.5">
                {action.title}
              </p>
              <p className="text-zinc-500 text-[11px] leading-snug">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
