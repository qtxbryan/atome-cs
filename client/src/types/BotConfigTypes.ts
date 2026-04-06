export interface BotConfig {
  kb_url: string;
  kb_scraped_at: string | null;
  kb_pages_scraped: number;
  system_prompt: string;
  guidelines: string[];
  tools_enabled: string[];
}
