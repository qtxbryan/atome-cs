import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";

function ConfigSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-2.5 w-24 bg-zinc-800 rounded-full" />
        <div className="h-28 bg-zinc-800 rounded-xl" />
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-28 bg-zinc-800 rounded-full" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-zinc-800 rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-20 bg-zinc-800 rounded-full" />
        <div className="h-4 w-36 bg-zinc-800 rounded-full" />
        <div className="h-4 w-44 bg-zinc-800 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-32 bg-zinc-800 rounded-full" />
        <div className="h-9 bg-zinc-800 rounded-xl" />
      </div>
    </div>
  );
}
import { toast } from "sonner";
import type { BotConfig } from "@/types/BotConfigTypes";
import type { MetaAgentMessage } from "@/api/metaAgentApi";
import { useBotConfig } from "@/context/BotConfigContext";
import { generateConfig, publishConfig } from "@/api/metaAgentApi";
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

interface Props {
  messages: MetaAgentMessage[];
  setMessages: React.Dispatch<React.SetStateAction<MetaAgentMessage[]>>;
  generatedConfig: BotConfig | null;
  setGeneratedConfig: React.Dispatch<React.SetStateAction<BotConfig | null>>;
}

function isPublishable(config: BotConfig): boolean {
  return (
    config.system_prompt.trim() !== "" &&
    config.guidelines.length > 0 &&
    config.guidelines.some((g) => g.trim() !== "")
  );
}

export default function MetaAgentPanel({
  messages,
  setMessages,
  generatedConfig,
  setGeneratedConfig,
}: Props) {
  const { config, fetchConfig } = useBotConfig();
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [documentFilename, setDocumentFilename] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [generatingConfig, setGeneratingConfig] = useState(false);

  // Use the in-progress draft as the base for the next generation
  const currentConfig = generatedConfig ?? config ?? DEFAULT_CONFIG;

  function handleClearChat() {
    setMessages([]);
    setGeneratedConfig(null);
  }

  async function handleGenerateConfig() {
    if (messages.length === 0 || generatingConfig) return;
    setGeneratingConfig(true);
    try {
      const result = await generateConfig(messages, documentContent, currentConfig);
      setGeneratedConfig(result);
    } catch {
      toast.error("Failed to generate configuration.");
    } finally {
      setGeneratingConfig(false);
    }
  }

  async function handlePublish() {
    if (!generatedConfig || !isPublishable(generatedConfig)) return;
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

  const canGenerate = messages.length > 0 && !generatingConfig;
  const canPublish = !!generatedConfig && isPublishable(generatedConfig) && !publishing;

  return (
    <div className="h-full grid grid-cols-2 divide-x divide-zinc-800">
      {/* Left: Chat + document upload */}
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">Meta-Agent</h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            Have a conversation to design your bot, then generate the config when ready.
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
            messages={messages}
            setMessages={setMessages}
            documentContent={documentContent}
            currentConfig={currentConfig}
            onRequestGenerate={handleGenerateConfig}
            onClearChat={handleClearChat}
          />
        </div>
      </div>

      {/* Right: Generated config */}
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-4 pt-4 pb-2 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Generated Config</h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              Review, edit, and publish the configuration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Generate / Regenerate button */}
            <button
              onClick={handleGenerateConfig}
              disabled={!canGenerate}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {generatingConfig ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Wand2 size={14} />
              )}
              {generatingConfig
                ? "Generating…"
                : generatedConfig
                  ? "Regenerate"
                  : "Generate Config"}
            </button>

            {/* Publish button — only shown when config exists */}
            {generatedConfig && (
              <button
                onClick={handlePublish}
                disabled={!canPublish}
                title={
                  !isPublishable(generatedConfig)
                    ? "System prompt and at least one guideline are required"
                    : undefined
                }
                className="bg-atome text-black font-bold text-sm px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity whitespace-nowrap"
              >
                {publishing ? "Publishing…" : "Publish Bot"}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {generatingConfig ? (
            <ConfigSkeleton />
          ) : generatedConfig ? (
            <GeneratedConfigPreview
              config={generatedConfig}
              onChange={setGeneratedConfig}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <p className="text-zinc-600 text-sm text-center">
                Chat with the agent to describe your bot, then click{" "}
                <span className="text-zinc-400">Generate Config</span> to create
                a configuration.
              </p>
              {canGenerate && (
                <button
                  onClick={handleGenerateConfig}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Wand2 size={15} />
                  Generate Config
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
