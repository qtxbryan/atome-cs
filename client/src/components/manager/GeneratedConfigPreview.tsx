import { Plus, Trash2 } from "lucide-react";
import type { BotConfig } from "@/types/BotConfigTypes";

interface Props {
  config: BotConfig;
  onChange: (config: BotConfig) => void;
}

export default function GeneratedConfigPreview({ config, onChange }: Props) {
  function updateGuideline(index: number, value: string) {
    const updated = [...config.guidelines];
    updated[index] = value;
    onChange({ ...config, guidelines: updated });
  }

  function removeGuideline(index: number) {
    onChange({
      ...config,
      guidelines: config.guidelines.filter((_, i) => i !== index),
    });
  }

  function addGuideline() {
    onChange({ ...config, guidelines: [...config.guidelines, ""] });
  }

  function toggleTool(tool: string) {
    const enabled = config.tools_enabled.includes(tool);
    onChange({
      ...config,
      tools_enabled: enabled
        ? config.tools_enabled.filter((t) => t !== tool)
        : [...config.tools_enabled, tool],
    });
  }

  return (
    <div className="space-y-6">
      {/* System Prompt */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          System Prompt
        </p>
        <textarea
          value={config.system_prompt}
          onChange={(e) => onChange({ ...config, system_prompt: e.target.value })}
          rows={5}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-atome/40 placeholder-zinc-600"
          placeholder="System prompt…"
        />
      </div>

      {/* Guidelines */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Guidelines ({config.guidelines.length})
          </p>
          <button
            onClick={addGuideline}
            className="flex items-center gap-1 text-xs text-atome hover:text-atome/80 transition-colors"
          >
            <Plus size={13} />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {config.guidelines.map((g, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-zinc-600 text-xs font-mono shrink-0 pt-2.5 w-5 text-right">
                {i + 1}.
              </span>
              <textarea
                value={g}
                onChange={(e) => updateGuideline(i, e.target.value)}
                rows={2}
                className="flex-1 bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm leading-snug resize-none focus:outline-none focus:ring-1 focus:ring-atome/40"
              />
              <button
                onClick={() => removeGuideline(i)}
                className="shrink-0 mt-2 text-zinc-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {config.guidelines.length === 0 && (
            <p className="text-zinc-600 text-sm italic">
              No guidelines yet. Click "Add" to create one.
            </p>
          )}
        </div>
      </div>

      {/* Enabled Tools */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Enabled Tools
        </p>
        <div className="space-y-1.5">
          {["getCardStatus", "getTransactionStatus"].map((tool) => (
            <label key={tool} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.tools_enabled.includes(tool)}
                onChange={() => toggleTool(tool)}
                className="accent-atome w-4 h-4"
              />
              <span className="text-zinc-200 text-sm font-mono">{tool}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Knowledge Base URL */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Knowledge Base URL
        </p>
        <input
          type="url"
          value={config.kb_url}
          onChange={(e) => onChange({ ...config, kb_url: e.target.value })}
          placeholder="https://…"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-atome/40 placeholder-zinc-600"
        />
      </div>
    </div>
  );
}
