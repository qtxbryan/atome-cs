import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBotConfig } from "@/context/BotConfigContext";
import { scrapeKb, getKb, saveKb } from "@/api/configApi";
import type { BotConfig } from "@/types/BotConfigTypes";
import GuidelinesEditor from "./GuidelinesEditor";

// KB content is injected at runtime by the backend — do not include it here
// so the preview stays readable and accurately reflects only the authored prompt.
function buildPromptPreview(config: BotConfig): string {
  const parts: string[] = [];

  const base = config.system_prompt.trim();
  if (base) parts.push(base);
  else parts.push("You are a helpful customer service assistant for Atome Card.");

  if (config.guidelines.length > 0) {
    const numbered = config.guidelines
      .map((g, i) => `${i + 1}. ${g}`)
      .join("\n");
    parts.push(`## Guidelines\n${numbered}`);
  }

  return parts.join("\n\n");
}

function formatScrapedAt(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString();
}

export default function BotConfigPanel() {
  const { config, loading, error, saveConfig, fetchConfig } = useBotConfig();

  const [localConfig, setLocalConfig] = useState<BotConfig | null>(() =>
    config ? { ...config } : null
  );
  const [saving, setSaving] = useState(false);

  // Tracks the last state that was saved to the server — used for hasChanges detection
  const savedConfig = useRef<BotConfig | null>(config ? { ...config } : null);

  // KB content lives in its own state — loaded from /api/kb, saved to /api/kb
  const [kbContent, setKbContent] = useState("");
  const [kbLoading, setKbLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [savingKb, setSavingKb] = useState(false);

  // Re-fetch config on every mount so changes from other tabs (e.g. apply fix
  // in Mistakes) are reflected immediately without a full page refresh.
  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (config) {
      setLocalConfig({ ...config });
      // Pin the saved baseline only on the first load — subsequent context
      // updates happen after explicit saves (handled in handleSave directly).
      if (savedConfig.current === null) {
        savedConfig.current = { ...config };
      }
    }
  }, [config]);

  useEffect(() => {
    getKb()
      .then(({ content }) => setKbContent(content))
      .catch(() => setKbContent(""))
      .finally(() => setKbLoading(false));
  }, []);

  // Show skeleton only on the very first load — not on background re-fetches
  // (localConfig is initialised synchronously from context on re-mount)
  if (!localConfig && loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-zinc-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !localConfig) {
    return (
      <div className="p-6">
        <div className="bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error ?? "Failed to load config"}
        </div>
      </div>
    );
  }

  // Determine whether anything has changed since the last save
  const hasChanges =
    savedConfig.current !== null
      ? JSON.stringify(localConfig) !== JSON.stringify(savedConfig.current)
      : false;

  const canSave =
    hasChanges &&
    !saving &&
    !scraping &&
    localConfig.system_prompt.trim().length > 0;

  async function handleScrape() {
    if (!localConfig?.kb_url.trim()) {
      toast.error("Enter a knowledge base URL first.");
      return;
    }
    setScraping(true);
    try {
      const { pages_scraped, scraped_at } = await scrapeKb(localConfig.kb_url.trim());
      const { content } = await getKb();
      setKbContent(content);
      setLocalConfig((prev) =>
        prev
          ? { ...prev, kb_scraped_at: scraped_at, kb_pages_scraped: pages_scraped }
          : prev
      );
      toast.success(
        `Scraped ${pages_scraped} article${pages_scraped !== 1 ? "s" : ""} from the knowledge base.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to scrape knowledge base.");
    } finally {
      setScraping(false);
    }
  }

  async function handleSaveKb() {
    setSavingKb(true);
    try {
      await saveKb(kbContent);
      toast.success("Knowledge base content saved.");
    } catch {
      toast.error("Failed to save knowledge base content.");
    } finally {
      setSavingKb(false);
    }
  }

  async function handleSave() {
    if (!localConfig) return;
    setSaving(true);
    try {
      const updated = await saveConfig(localConfig);
      if (updated) {
        setLocalConfig({ ...updated });
        savedConfig.current = { ...updated };
      }
      toast.success("Configuration saved!");
    } catch {
      toast.error("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  }

  const systemPromptEmpty = localConfig.system_prompt.trim().length === 0;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Bot Configuration</h2>

      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 space-y-8 lg:space-y-0">
        {/* ── Left column: all form inputs ── */}
        <div className="space-y-8">
          {/* Knowledge Base — URL + Scrape */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Knowledge Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={localConfig.kb_url}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, kb_url: e.target.value })
                }
                placeholder="https://help.atome.ph/hc/en-gb/…"
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-atome/50 placeholder-zinc-500"
              />
              <button
                onClick={handleScrape}
                disabled={scraping || !localConfig.kb_url.trim()}
                className="shrink-0 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                {scraping ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scraping…
                  </>
                ) : (
                  "Scrape & Load"
                )}
              </button>
            </div>
            {scraping && (
              <p className="text-zinc-400 text-xs animate-pulse">
                Fetching articles from Zendesk API — this may take a moment…
              </p>
            )}
            <p className="text-zinc-600 text-xs">
              Last scraped: {formatScrapedAt(localConfig.kb_scraped_at)}
              {localConfig.kb_pages_scraped > 0 &&
                ` · ${localConfig.kb_pages_scraped} article${localConfig.kb_pages_scraped !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Knowledge Base — Content editor */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Knowledge Base Content
            </label>
            {kbLoading ? (
              <div className="h-40 bg-zinc-800 rounded-lg animate-pulse" />
            ) : (
              <textarea
                value={kbContent}
                onChange={(e) => setKbContent(e.target.value)}
                rows={10}
                placeholder="Scraped knowledge base content will appear here. You can also paste or edit content manually."
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-atome/50 placeholder-zinc-500 resize-y font-mono"
              />
            )}
            <div className="flex items-center justify-between">
              {!kbContent.trim() ? (
                <p className="text-yellow-600 text-xs">
                  Warning: knowledge base is empty — the bot will rely on general knowledge only.
                </p>
              ) : (
                <p className="text-zinc-600 text-xs">
                  {kbContent.length.toLocaleString()} characters
                </p>
              )}
              <button
                onClick={handleSaveKb}
                disabled={savingKb || kbLoading}
                className="shrink-0 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {savingKb ? "Saving…" : "Save KB"}
              </button>
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
              System Prompt
            </label>
            <textarea
              value={localConfig.system_prompt}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, system_prompt: e.target.value })
              }
              rows={4}
              placeholder="Describe how the bot should behave…"
              className={`w-full bg-zinc-800 border text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-atome/50 placeholder-zinc-500 resize-y transition-colors ${
                systemPromptEmpty ? "border-red-700/60" : "border-zinc-700"
              }`}
            />
            {systemPromptEmpty && (
              <p className="text-red-400 text-xs">
                System prompt is required before saving.
              </p>
            )}
          </div>

          {/* Guidelines */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Guidelines
            </label>
            <GuidelinesEditor
              guidelines={localConfig.guidelines}
              onChange={(guidelines) => setLocalConfig({ ...localConfig, guidelines })}
            />
          </div>
        </div>

        {/* ── Right column: sticky preview + save ── */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
              System Prompt Preview
            </label>
            <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {buildPromptPreview(localConfig)}
            </pre>
            <p className="text-zinc-600 text-xs">
              Live preview of the authored prompt. Knowledge base content is appended
              automatically at runtime and not shown here.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {scraping && (
              <p className="text-zinc-500 text-xs text-center">
                Scraping in progress — save is locked until complete.
              </p>
            )}
            {!hasChanges && !scraping && (
              <p className="text-zinc-600 text-xs text-center">No unsaved changes.</p>
            )}
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="w-full bg-atome text-black font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
