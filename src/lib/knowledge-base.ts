import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";

export interface VideoRecord {
  video_id: string;
  title: string;
  url: string;
  publish_date: string;
  duration_minutes: string;
  views: string;
  description: string;
  guest: string;
  topic_tags: string;
  transcript: string;
}

export interface KnowledgeChunk {
  title: string;
  url: string;
  publish_date: string;
  topic_tags: string;
  content: string;
  score?: number;
}

let cachedRecords: VideoRecord[] | null = null;

function loadRecords(): VideoRecord[] {
  if (cachedRecords) return cachedRecords;

  const csvPath = path.join(process.cwd(), "tom_panos_videos.csv");
  const content = fs.readFileSync(csvPath, "utf-8");

  cachedRecords = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as VideoRecord[];

  return cachedRecords;
}

/**
 * Score a record against a query using simple TF-IDF-like keyword matching.
 * Looks at title, topic_tags, and transcript.
 */
function scoreRecord(record: VideoRecord, queryTerms: string[]): number {
  const titleLower = record.title.toLowerCase();
  const tagsLower = record.topic_tags.toLowerCase();
  const transcriptLower = record.transcript.toLowerCase();

  let score = 0;

  for (const term of queryTerms) {
    const tl = term.toLowerCase();
    // Title match = high weight
    if (titleLower.includes(tl)) score += 10;
    // Tags match = medium weight
    if (tagsLower.includes(tl)) score += 5;
    // Count occurrences in transcript
    const transcriptMatches = (
      transcriptLower.match(new RegExp(tl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []
    ).length;
    score += Math.min(transcriptMatches, 20); // cap at 20 to avoid flooding
  }

  // Boost for coaching/training content vs pure auction
  if (
    tagsLower.includes("prospecting") ||
    tagsLower.includes("listing") ||
    tagsLower.includes("commission") ||
    tagsLower.includes("real estate training")
  ) {
    score += 2;
  }

  return score;
}

function extractRelevantSnippet(transcript: string, queryTerms: string[], maxLength = 1500): string {
  const lower = transcript.toLowerCase();
  let bestStart = 0;
  let bestScore = 0;

  // Slide a window to find the most relevant chunk
  const windowSize = 1500;
  const step = 500;

  for (let i = 0; i < transcript.length - windowSize; i += step) {
    const window = lower.slice(i, i + windowSize);
    let windowScore = 0;
    for (const term of queryTerms) {
      const matches = (
        window.match(
          new RegExp(term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
        ) || []
      ).length;
      windowScore += matches;
    }
    if (windowScore > bestScore) {
      bestScore = windowScore;
      bestStart = i;
    }
  }

  // Find a clean sentence boundary
  const raw = transcript.slice(bestStart, bestStart + maxLength);
  const firstPeriod = raw.indexOf(". ");
  const cleanStart = firstPeriod > 0 && firstPeriod < 200 ? firstPeriod + 2 : 0;
  return raw.slice(cleanStart).trim() + "...";
}

export function searchKnowledge(query: string, topK = 5): KnowledgeChunk[] {
  const records = loadRecords();

  // Extract meaningful query terms (filter stop words)
  const stopWords = new Set([
    "a","an","the","is","it","in","on","at","to","for","of","and","or","but",
    "how","what","why","when","where","who","can","do","does","did","have","has",
    "i","me","my","you","your","we","our","they","their","this","that","with","from",
    "be","are","was","were","will","would","could","should","tell","me","about",
  ]);

  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopWords.has(t));

  if (queryTerms.length === 0) {
    // Return a selection of popular/diverse records
    return records.slice(0, topK).map((r) => ({
      title: r.title,
      url: r.url,
      publish_date: r.publish_date,
      topic_tags: r.topic_tags,
      content: r.transcript.slice(0, 1000) + "...",
    }));
  }

  // Score all records
  const scored = records
    .filter((r) => r.transcript && r.transcript.length > 100)
    .map((r) => ({ record: r, score: scoreRecord(r, queryTerms) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(({ record, score }) => ({
    title: record.title,
    url: record.url,
    publish_date: record.publish_date,
    topic_tags: record.topic_tags,
    content: extractRelevantSnippet(record.transcript, queryTerms),
    score,
  }));
}
