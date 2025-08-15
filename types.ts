export type CategoryKey =
  | "violence" | "language" | "sexual_content"
  | "substances" | "sensitive_topics" | "commercial_pressure";

export type PerVideoScore = {
  videoId: string;
  url: string;
  title: string;
  publishedAt: string;
  viewCount?: number;
  categoryScores: Record<CategoryKey, 0|1|2|3|4>;
  riskNote: string;
};

export type Aggregate = {
  scores: Record<CategoryKey, number>;
  ageBand: "E" | "E10+" | "T" | "16+";
  verdict: string;
  bullets: string[];
};

export type AnalyseResponse = {
  query: string;
  channel?: {
    id?: string;
    title?: string;
    handle?: string;
    thumbnail?: string;
  };
  videos: PerVideoScore[];
  aggregate: Aggregate;
  warnings?: string[];
};

export type HistoryItem = {
  q: string;
  ageBand: "E" | "E10+" | "T" | "16+";
  verdict: string;
  ts: number;
};