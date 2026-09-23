import type { SourceTier } from "@/modules/sources/types";

const tierScores: Record<SourceTier, number> = {
  tier_1_official: 70,
  tier_2_established_media: 55,
  tier_3_discovery: 20,
};

export function normalizeTitle(value: string) {
  return value
    .toLocaleLowerCase("th-TH")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

export function titleSimilarity(left: string, right: string) {
  const leftTokens = new Set(normalizeTitle(left).split(" ").filter(Boolean));
  const rightTokens = new Set(normalizeTitle(right).split(" ").filter(Boolean));
  const union = new Set([...leftTokens, ...rightTokens]);

  if (union.size === 0) {
    return 0;
  }

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return intersection / union.size;
}

function recencyScore(publishedAt: string | null, now: Date) {
  if (!publishedAt) {
    return 3;
  }

  const hours = Math.max(0, (now.getTime() - new Date(publishedAt).getTime()) / 3_600_000);
  if (hours <= 2) return 20;
  if (hours <= 12) return 15;
  if (hours <= 24) return 10;
  if (hours <= 72) return 5;
  return 0;
}

export function scoreStory(input: {
  tier: SourceTier;
  publishedAt: string | null;
  evidenceCount: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const tier = tierScores[input.tier];
  const recency = recencyScore(input.publishedAt, now);
  const corroboration = Math.min(Math.max(input.evidenceCount - 1, 0) * 5, 10);
  const score = Math.min(tier + recency + corroboration, 100);

  return {
    score,
    explanation: `Tier ${input.tier === "tier_1_official" ? "1" : input.tier === "tier_2_established_media" ? "2" : "3"} ${tier} คะแนน + ความสดใหม่ ${recency} คะแนน + หลักฐาน ${corroboration} คะแนน`,
  };
}

export function categorizeStory(title: string) {
  const normalized = normalizeTitle(title);
  if (/(thai league|ไทยลีก|ทีมชาติไทย|ช้างศึก)/u.test(normalized)) return "thai_football";
  if (/(football|พรีเมียร์|พรีเมียร์ลีก|champions league|ลา ลีกา|บุนเดสลีกา|serie a|ฟุตบอล)/u.test(normalized)) return "football";
  if (/(nba|basketball|บาสเกตบอล)/u.test(normalized)) return "basketball";
  if (/(f1|formula 1|motogp|moto gp)/u.test(normalized)) return "motorsport";
  return "other";
}
