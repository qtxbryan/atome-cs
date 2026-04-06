import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useBotConfig } from "@/context/BotConfigContext";
import type { BotConfig } from "@/types/BotConfigTypes";
import GuidelinesEditor from "./GuidelinesEditor";

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

  if (config.kb_content.trim()) {
    parts.push(`## Knowledge Base\n${config.kb_content.trim()}`);
  }

  return parts.join("\n\n");
}

export default function BotConfigPanel() {
  const { config, loading, error, saveConfig } = useBotConfig();
  const [localConfig, setLocalConfig] = useState<BotConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) setLocalConfig({ ...config });
  }, [config]);

  if (loading) {
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

  async function handleSave() {
    if (!localConfig) return;
    setSaving(true);
    try {
      await saveConfig(localConfig);
      toast.success("Configuration saved!");
    } catch {
      toast.error("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h2 className="text-xl font-bold text-white">Bot Configuration</h2>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Knowledge Base URL
        </label>
        <input
          type="url"
          value={localConfig.kb_url}
          onChange={(e) =>
            setLocalConfig({ ...localConfig, kb_url: e.target.value })
          }
          placeholder="https://help.atome.ph/..."
          className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-atome/50 placeholder-zinc-500"
        />
        <p className="text-zinc-600 text-xs">
          Reference only — content is not automatically scraped.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Knowledge Base Content
        </label>
        <textarea
          value={localConfig.kb_content}
          onChange={(e) =>
            setLocalConfig({ ...localConfig, kb_content: e.target.value })
          }
          rows={8}
          placeholder="Paste the knowledge base content here…"
          className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-atome/50 placeholder-zinc-500 resize-y"
        />
        {!localConfig.kb_content.trim() && (
          <p className="text-yellow-600 text-xs">
            Warning: knowledge base is empty — the bot will rely on general knowledge only.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
          System Prompt
        </label>
        <textarea
          value={localConfig.system_prompt}
          onChange={(e) =>
            setLocalConfig({ ...localConfig, system_prompt: e.target.value })
          }
          rows={3}
          placeholder="Describe how the bot should behave…"
          className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-atome/50 placeholder-zinc-500 resize-y"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Guidelines
        </label>
        <GuidelinesEditor
          guidelines={localConfig.guidelines}
          onChange={(guidelines) => setLocalConfig({ ...localConfig, guidelines })}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
          System Prompt Preview
        </label>
        <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
          {buildPromptPreview(localConfig)}
        </pre>
        <p className="text-zinc-600 text-xs">
          Live preview — reflects what the bot will receive as context.
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-atome text-black font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Configuration"}
      </button>
    </div>
  );
}
