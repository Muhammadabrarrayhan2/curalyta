import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { logger } from '../../lib/logger';

/**
 * Health News module — aggregates RSS feeds from trusted Indonesian health sources.
 * Results are cached in-memory for 30 minutes to avoid hitting sources too often.
 */

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string | null;
  source: string;
  publishedAt: string;
}

const RSS_SOURCES: { name: string; url: string }[] = [
  { name: 'Detik Health', url: 'https://health.detik.com/rss' },
  { name: 'Kompas Health', url: 'https://health.kompas.com/rss' },
  { name: 'CNN Indonesia Gaya Hidup', url: 'https://www.cnnindonesia.com/gaya-hidup/rss' },
];

let cache: { data: NewsArticle[]; ts: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Minimal XML/RSS parser — extracts items without external libraries.
 */
function parseRss(xml: string, sourceName: string): NewsArticle[] {
  const items: NewsArticle[] = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRe.exec(xml)) !== null) {
    const itemBody = match[1];
    const title = extractTag(itemBody, 'title');
    const link = extractTag(itemBody, 'link');
    const description = extractTag(itemBody, 'description');
    const pubDate = extractTag(itemBody, 'pubDate');
    const enclosureMatch = /<enclosure\b[^>]*url="([^"]+)"/i.exec(itemBody);
    const mediaMatch = /<media:content\b[^>]*url="([^"]+)"/i.exec(itemBody);
    const imgMatch = /<img\b[^>]*src="([^"]+)"/i.exec(description || '');

    if (!title || !link) continue;

    const imageUrl = enclosureMatch?.[1] || mediaMatch?.[1] || imgMatch?.[1] || null;
    const cleanDesc = cleanHtml(description || '').slice(0, 280);

    items.push({
      id: hash(link),
      title: cleanHtml(title).trim(),
      description: cleanDesc,
      link: link.trim(),
      imageUrl,
      source: sourceName,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    });
  }

  return items;
}

function extractTag(body: string, tag: string): string {
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = cdataRe.exec(body) || plainRe.exec(body);
  return m ? m[1].trim() : '';
}

function cleanHtml(input: string): string {
  return input
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

async function fetchFeed(source: { name: string; url: string }, timeoutMs = 8000): Promise<NewsArticle[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Curalyta/1.0 (+https://curalyta.app)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    if (!res.ok) {
      logger.warn(`RSS ${source.name} returned ${res.status}`);
      return [];
    }
    const xml = await res.text();
    return parseRss(xml, source.name);
  } catch (err) {
    logger.warn(`RSS ${source.name} fetch failed`, {
      message: err instanceof Error ? err.message : String(err),
    });
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function getAggregatedNews(): Promise<NewsArticle[]> {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL_MS) {
    return cache.data;
  }

  const results = await Promise.all(RSS_SOURCES.map((s) => fetchFeed(s)));
  const all = results.flat();

  // Dedupe by title
  const seen = new Set<string>();
  const deduped = all.filter((a) => {
    const key = a.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by publishedAt desc
  deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const limited = deduped.slice(0, 30);
  cache = { data: limited, ts: now };
  return limited;
}

export const newsRouter = Router();

newsRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const articles = await getAggregatedNews();
    res.json({
      articles,
      cached: cache ? { ts: cache.ts, age: Date.now() - cache.ts } : null,
    });
  })
);
