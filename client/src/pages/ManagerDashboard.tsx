import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Tabs } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import type { MetaAgentMessage } from "@/api/metaAgentApi";
import type { BotConfig } from "@/types/BotConfigTypes";

const BotConfigPanel = lazy(() => import("@/components/manager/BotConfigPanel"));
const MetaAgentPanel = lazy(() => import("@/components/manager/MetaAgentPanel"));
const MistakeDashboard = lazy(() => import("@/components/mistakes/MistakeDashboard"));

function PanelSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-10 bg-zinc-800 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export default function ManagerDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Lifted here so state persists across tab switches
  const [metaMessages, setMetaMessages] = useState<MetaAgentMessage[]>([]);
  const [metaGeneratedConfig, setMetaGeneratedConfig] = useState<BotConfig | null>(null);

  function handleLogout() {
    logout();
    navigate("/manager");
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <Tabs
        variant="secondary"
        defaultSelectedKey="config"
        className="flex flex-col flex-1 min-h-0"
      >
        {/* Nav bar: tabs on left, logout on right */}
        <div className="flex items-center border-b border-zinc-800 bg-zinc-900 px-4 shrink-0">
          <Tabs.ListContainer className="flex-1">
            <Tabs.List aria-label="Manager sections" className="flex items-center gap-1 h-full">
              <Tabs.Tab
                id="config"
                className="px-4 py-3 text-sm font-medium transition-colors cursor-pointer
                  text-zinc-400 hover:text-white
                  aria-selected:text-white"
              >
                Bot Config
                <Tabs.Indicator className="bg-atome h-0.5 bottom-0" />
              </Tabs.Tab>
              <Tabs.Tab
                id="meta"
                className="px-4 py-3 text-sm font-medium transition-colors cursor-pointer
                  text-zinc-400 hover:text-white
                  aria-selected:text-white"
              >
                Meta-Agent
                <Tabs.Indicator className="bg-atome h-0.5 bottom-0" />
              </Tabs.Tab>
              <Tabs.Tab
                id="mistakes"
                className="px-4 py-3 text-sm font-medium transition-colors cursor-pointer
                  text-zinc-400 hover:text-white
                  aria-selected:text-white"
              >
                Mistakes
                <Tabs.Indicator className="bg-atome h-0.5 bottom-0" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors py-2 px-2"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>

        {/* Tab panels */}
        <div className="flex-1 min-h-0 overflow-hidden animate-fadein">
          <Tabs.Panel id="config" className="h-full overflow-y-auto">
            <Suspense fallback={<PanelSkeleton />}>
              <BotConfigPanel />
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel id="meta" className="h-full overflow-hidden">
            <Suspense fallback={<PanelSkeleton />}>
              <MetaAgentPanel
                messages={metaMessages}
                setMessages={setMetaMessages}
                generatedConfig={metaGeneratedConfig}
                setGeneratedConfig={setMetaGeneratedConfig}
              />
            </Suspense>
          </Tabs.Panel>
          <Tabs.Panel id="mistakes" className="h-full overflow-y-auto">
            <Suspense fallback={<PanelSkeleton />}>
              <MistakeDashboard />
            </Suspense>
          </Tabs.Panel>
        </div>
      </Tabs>
    </div>
  );
}
