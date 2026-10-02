import { createHash } from "node:crypto";

import { XMLParser } from "fast-xml-parser";

import type { ParsedSourceItem } from "./types";

const parser = new XMLParser({
  attributeNamePrefix: "",
  ignoreAttributes: false,
  parseTagValue: true,
  trimValues: true,
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function text(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim() || null;
  }

  if (value && typeof value === "object" && "#text" in value) {
    return text(value["#text"]);
  }

  return null;
}

function cleanExcerpt(value: unknown) {
  const raw = text(value);
  if (!raw) {
    return null;
  }

  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000) || null;
}

function canonicalizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach((key) => {
    url.searchParams.delete(key);
  });
  url.hash = "";
  return url.toString();
}

function parseDate(value: unknown) {
  const raw = text(value);
  if (!raw) {
    return null;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function linkFromAtom(value: unknown) {
  type AtomLink = { href?: string; rel?: string };
  const links = asArray<AtomLink>(value as AtomLink | AtomLink[] | undefined);
  const preferred = links.find((link) => !link.rel || link.rel === "alternate") ?? links[0];
  return preferred?.href ?? null;
}

function normalizeItem(input: {
  url: unknown;
  id: unknown;
  title: unknown;
  excerpt: unknown;
  publishedAt: unknown;
}): ParsedSourceItem | null {
  const url = text(input.url);
  const title = text(input.title);

  if (!url || !title) {
    return null;
  }

  try {
    return {
      canonicalUrl: canonicalizeUrl(url),
      externalId: text(input.id),
      title: title.slice(0, 1000),
      excerpt: cleanExcerpt(input.excerpt),
      publisherPublishedAt: parseDate(input.publishedAt),
    };
  } catch {
    return null;
  }
}

export function sourceItemFingerprint(item: ParsedSourceItem) {
  return createHash("sha256")
    .update([item.canonicalUrl, item.title, item.publisherPublishedAt ?? ""].join("|"))
    .digest("hex");
}

export function parseRssOrAtom(xml: string): ParsedSourceItem[] {
  const document = parser.parse(xml) as Record<string, unknown>;
  const rssChannel = (document.rss as { channel?: { item?: unknown } } | undefined)?.channel;
  const atomFeed = document.feed as { entry?: unknown } | undefined;

  if (!rssChannel && !atomFeed) {
    throw new Error("URL นี้ไม่ได้ส่งข้อมูล RSS หรือ Atom feed");
  }

  const rssItems = asArray(rssChannel?.item).map((item) => {
    const entry = item as Record<string, unknown>;
    return normalizeItem({
      url: entry.link,
      id: entry.guid ?? entry.link,
      title: entry.title,
      excerpt: entry.description ?? entry["content:encoded"],
      publishedAt: entry.pubDate ?? entry.date,
    });
  });

  const atomEntries = asArray(atomFeed?.entry).map((item) => {
    const entry = item as Record<string, unknown>;
    return normalizeItem({
      url: linkFromAtom(entry.link),
      id: entry.id ?? entry.link,
      title: entry.title,
      excerpt: entry.summary ?? entry.content,
      publishedAt: entry.published ?? entry.updated,
    });
  });

  const unique = new Map<string, ParsedSourceItem>();
  [...rssItems, ...atomEntries]
    .filter((item): item is ParsedSourceItem => item !== null)
    .forEach((item) => unique.set(item.canonicalUrl, item));
  return [...unique.values()];
}

function parseJsonFeed(payload: string): ParsedSourceItem[] {
  const document = JSON.parse(payload) as {
    version?: string;
    items?: Array<{
      id?: string;
      url?: string;
      external_url?: string;
      title?: string;
      summary?: string;
      content_text?: string;
      content_html?: string;
      date_published?: string;
      date_modified?: string;
    }>;
  };

  if (!document.version || !Array.isArray(document.items)) {
    throw new Error("URL นี้ไม่ได้ส่งข้อมูล JSON Feed");
  }

  return document.items
    .map((item) =>
      normalizeItem({
        url: item.url ?? item.external_url,
        id: item.id ?? item.url,
        title: item.title,
        excerpt: item.summary ?? item.content_text ?? item.content_html,
        publishedAt: item.date_published ?? item.date_modified,
      }),
    )
    .filter((item): item is ParsedSourceItem => item !== null);
}

export function parseFeedPayload(payload: string, contentType: string | null): ParsedSourceItem[] {
  const looksLikeJson = contentType?.includes("json") || payload.trimStart().startsWith("{");
  return looksLikeJson ? parseJsonFeed(payload) : parseRssOrAtom(payload);
}
