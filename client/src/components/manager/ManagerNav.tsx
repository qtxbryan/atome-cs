import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

export type ManagerTab = "config" | "meta" | "mistakes";

interface Props {
  activeTab: ManagerTab;
  onTabChange: (tab: ManagerTab) => void;
}

const TABS: { id: ManagerTab; label: string }[] = [
  { id: "config", label: "Bot Config" },
  { id: "meta", label: "Meta-Agent" },
  { id: "mistakes", label: "Mistakes" },
];

export default function ManagerNav({ activeTab, onTabChange }: Props) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/manager");
  }

  return (
    <nav className="flex items-center border-b border-zinc-800 bg-zinc-900 px-4">
      <div className="flex items-center gap-1 flex-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-atome text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors py-2 px-2"
      >
        <LogOut size={15} />
        Logout
      </button>
    </nav>
  );
}
