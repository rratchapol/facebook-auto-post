export type SourceType = "rss" | "api" | "google_news_discovery" | "x_api";
export type SourceTier = "tier_1_official" | "tier_2_established_media" | "tier_3_discovery";

export type Source = {
  id: string;
  name: string;
  source_type: SourceType;
  tier: SourceTier;
  base_url: string;
  feed_url: string | null;
  enabled: boolean;
  last_success_at: string | null;
  last_failure_at: string | null;
  created_at: string;
};

export const sourceTypeLabels: Record<SourceType, string> = {
  rss: "RSS",
  api: "API",
  google_news_discovery: "Google News Discovery",
  x_api: "X API",
};

export const sourceTierLabels: Record<SourceTier, string> = {
  tier_1_official: "Tier 1 · ทางการ",
  tier_2_established_media: "Tier 2 · สื่อหลัก",
  tier_3_discovery: "Tier 3 · Discovery",
};
