import { lazy, Suspense, useState } from "react";
import ManagerNav, { type ManagerTab } from "@/components/manager/ManagerNav";

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
  const [activeTab, setActiveTab] = useState<ManagerTab>("config");

  return (
    <div className="flex flex-col h-full bg-black">
      <ManagerNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<PanelSkeleton />}>
          {activeTab === "config" && <BotConfigPanel />}
          {activeTab === "meta" && <MetaAgentPanel />}
          {activeTab === "mistakes" && <MistakeDashboard />}
        </Suspense>
      </div>
    </div>
  );
}
