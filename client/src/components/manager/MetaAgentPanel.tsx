import { useState } from "react";
import { toast } from "sonner";
import type { BotConfig } from "@/types/BotConfigTypes";
import { useBotConfig } from "@/context/BotConfigContext";
import { publishConfig } from "@/api/metaAgentApi";
import DocumentUpload from "./DocumentUpload";
import MetaAgentChat from "./MetaAgentChat";
import GeneratedConfigPreview from "./GeneratedConfigPreview";

const DEFAULT_CONFIG: BotConfig = {
  kb_url: "",
  kb_scraped_at: null,
  kb_pages_scraped: 0,
  system_prompt: "",
  guidelines: [],
  tools_enabled: ["getCardStatus", "getTransactionStatus"],
};

export default function MetaAgentPanel() {
  const { config, fetchConfig } = useBotConfig();
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [documentFilename, setDocumentFilename] = useState<string | null>(null);
  const [generatedConfig, setGeneratedConfig] = useState<BotConfig | null>(null);
  const [publishing, setPublishing] = useState(false);

  const currentConfig = config ?? DEFAULT_CONFIG;

  async function handlePublish() {
    if (!generatedConfig) return;
    setPublishing(true);
    try {
      await publishConfig(generatedConfig);
      await fetchConfig();
      toast.success("Bot configuration published!");
    } catch {
      toast.error("Failed to publish configuration.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="h-full grid grid-cols-2 divide-x divide-zinc-800">
      {/* Left: Chat + document upload */}
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">Meta-Agent</h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            Describe the bot you want — the AI will generate a complete configuration.
          </p>
        </div>

        <div className="px-4 py-3 border-b border-zinc-800">
          <DocumentUpload
            onContentLoaded={(content, name) => {
              setDocumentContent(content);
              setDocumentFilename(name);
            }}
            onClear={() => {
              setDocumentContent(null);
              setDocumentFilename(null);
            }}
            filename={documentFilename}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <MetaAgentChat
            documentContent={documentContent}
            currentConfig={currentConfig}
            onConfigGenerated={setGeneratedConfig}
          />
        </div>
      </div>

      {/* Right: Generated config preview */}
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="px-4 pt-4 pb-2 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Generated Config</h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              Review and publish the generated configuration.
            </p>
          </div>
          {generatedConfig && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="bg-atome text-black font-bold text-sm px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
            >
              {publishing ? "Publishing…" : "Publish Bot"}
            </button>
          )}
        </div>

        <div className="flex-1 p-4">
          {generatedConfig ? (
            <GeneratedConfigPreview
              config={generatedConfig}
              onChange={setGeneratedConfig}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-zinc-600 text-sm text-center italic">
                Generated configuration will appear here after you send a message.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
