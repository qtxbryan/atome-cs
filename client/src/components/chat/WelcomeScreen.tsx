import { CreditCard, Shield, Receipt } from "lucide-react";
import BorderGlow from "@/components/ui/BorderGlow";
import AtomeLogo from "@/assets/Atome_Logo.svg";

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <CreditCard size={18} />,
    title: "Check Card Status",
    description: "View your card application status.",
    prompt: "What is my card application status?",
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
];

interface Props {
  onSend: (text: string) => void;
}

export default function WelcomeScreen({ onSend }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-5 py-8 text-center animate-fadein">
      {/* App icon */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center p-3">
          <img
            src={AtomeLogo}
            alt="Atome"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-atome flex items-center justify-center">
          <span className="text-black text-[10px] font-black leading-none">
            !
          </span>
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-white text-2xl font-bold leading-snug mb-3 max-w-md">
        How can we help with your concerns?
      </h1>

      {/* Subtitle */}
      <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-md">
        Ask about your card application status, recent transactions, or request
        a card replacement.
      </p>

      {/* Quick action grid — 3 columns */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.title}
            onClick={() => onSend(action.prompt)}
            className="text-left active:scale-[0.98] transition-transform duration-150"
          >
            <BorderGlow
              backgroundColor="#18181b"
              borderRadius={12}
              glowColor="65 95 75"
              glowRadius={30}
              glowIntensity={1.2}
              edgeSensitivity={25}
              coneSpread={20}
              colors={["#F4FF5F", "#a3e635", "#4ade80"]}
              className="h-full"
            >
              <div className="flex flex-col items-start gap-3 p-5 h-full">
                <span className="text-atome">{action.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight mb-1">
                    {action.title}
                  </p>
                  <p className="text-zinc-500 text-xs leading-snug">
                    {action.description}
                  </p>
                </div>
              </div>
            </BorderGlow>
          </button>
        ))}
      </div>
    </div>
  );
}
