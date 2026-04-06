import type { BotConfig } from "@/types/BotConfigTypes";

interface Props {
  config: BotConfig;
  onChange: (config: BotConfig) => void;
}

export default function GeneratedConfigPreview({ config, onChange }: Props) {
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
    <div className="space-y-5">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          System Prompt
        </p>
        <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
          {config.system_prompt || "(empty)"}
        </pre>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Guidelines ({config.guidelines.length})
        </p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {config.guidelines.map((g, i) => (
            <div
              key={i}
              className="flex gap-2 bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2"
            >
              <span className="text-zinc-500 text-xs font-mono shrink-0 pt-0.5">
                {i + 1}.
              </span>
              <p className="text-zinc-200 text-sm">{g}</p>
            </div>
          ))}
          {config.guidelines.length === 0 && (
            <p className="text-zinc-600 text-sm italic">No guidelines generated.</p>
          )}
        </div>
      </div>

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

      {config.kb_url && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Knowledge Base URL
          </p>
          <p className="text-zinc-300 text-sm break-all">{config.kb_url}</p>
        </div>
      )}
    </div>
  );
}
