export interface BotConfig {
  kb_url: string;
  kb_content: string;
  system_prompt: string;
  guidelines: string[];
  tools_enabled: string[];
}
