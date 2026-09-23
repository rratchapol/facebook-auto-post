import type { SourceTier, SourceType } from "@/modules/sources/types";

export type IngestibleSource = {
  id: string;
  name: string;
  source_type: SourceType;
  tier: SourceTier;
  feed_url: string | null;
};

export type ParsedSourceItem = {
  canonicalUrl: string;
  externalId: string | null;
  title: string;
  excerpt: string | null;
  publisherPublishedAt: string | null;
};

export type IngestionResult = {
  attemptedSources: number;
  successfulSources: number;
  failedSources: number;
  newItems: number;
  groupedStories: number;
  errors: Array<{ sourceName: string; message: string }>;
};
