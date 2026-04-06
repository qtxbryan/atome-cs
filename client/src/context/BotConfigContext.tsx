import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { BotConfig } from "@/types/BotConfigTypes";
import { getConfig, updateConfig } from "@/api/configApi";

interface BotConfigContextValue {
  config: BotConfig | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  saveConfig: (config: BotConfig) => Promise<BotConfig>;
}

const BotConfigContext = createContext<BotConfigContextValue | null>(null);

export function BotConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchConfig() {
    setLoading(true);
    setError(null);
    try {
      const data = await getConfig();
      setConfig(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load config");
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig(newConfig: BotConfig): Promise<BotConfig> {
    setError(null);
    try {
      const updated = await updateConfig(newConfig);
      setConfig(updated);
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save config");
      throw e;
    }
  }

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <BotConfigContext.Provider
      value={{ config, loading, error, fetchConfig, saveConfig }}
    >
      {children}
    </BotConfigContext.Provider>
  );
}

export function useBotConfig(): BotConfigContextValue {
  const ctx = useContext(BotConfigContext);
  if (!ctx) throw new Error("useBotConfig must be used within BotConfigProvider");
  return ctx;
}
