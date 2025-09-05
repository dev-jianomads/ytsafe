import { z } from 'zod';
import { CategoryKey } from '@/types';

export const CATEGORIES: CategoryKey[] = [
  "violence", "language", "sexual_content", 
  "substances", "gambling", "sensitive_topics", "commercial_pressure"
];

export function ageFromScores(scores: Record<CategoryKey, number>): "E" | "E10+" | "T" | "16+" {
  // GAMBLING OVERRIDE: If gambling > 1.0, minimum age is 16+
  if (scores.gambling > 1.0) {
    return "16+";
  }
  
  const vals = Object.values(scores);
  if (vals.every(v => v <= 1)) return "E";
  if (vals.every(v => v <= 2)) return "E10+";
  if (vals.every(v => v <= 3)) return "T";
  return "16+";
}

export function deriveBullets(scores: Record<CategoryKey, number>): string[] {
  const labels: Record<CategoryKey, string> = {
    violence: "violence",
    language: "language", 
    sexual_content: "sexual content",
    substances: "alcohol/drugs",
    gambling: "gambling",
    sensitive_topics: "sensitive topics",
    commercial_pressure: "sponsorship/ads"
  };
  
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => {
      const label = labels[k as CategoryKey];
      if (v <= 0.5) return `little to no ${label}`;
      if (v <= 1) return `mild ${label}`;
      if (v <= 2) return `moderate ${label}`;
      if (v <= 3) return `frequent ${label}`;
      return `strong ${label}`;
    });
}

export function makeVerdict(ageBand: string, scores: Record<CategoryKey, number>): string {
  // Special gambling verdict override
  if (scores.gambling > 1.0) {
    return "Suitable for 16+ only due to gambling content. Legal gambling is restricted to 18+ in most jurisdictions.";
  }
  
  const head = ageBand === "E" ? "Suitable for ages 6 and under" :
               ageBand === "E10+" ? "Generally OK for 7–10" :
               ageBand === "T" ? "Better for 11–15" : "Suitable for 16+ only";
  
  const maxEntry = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const maxK = maxEntry?.[0];
  
  const noteMap: Record<string, string> = {
    violence: "due to action/violence",
    language: "due to language",
    sexual_content: "due to suggestive themes",
    substances: "due to alcohol/drugs",
    gambling: "due to gambling content",
    sensitive_topics: "due to sensitive topics",
    commercial_pressure: "due to heavy sponsorship"
  };
  
  return `${head}, ${noteMap[maxK ?? "language"]}.`;
}

export const VideoScoreSchema = z.object({
  violence: z.number().min(0).max(4),
  language: z.number().min(0).max(4),
  sexual_content: z.number().min(0).max(4),
  substances: z.number().min(0).max(4),
  gambling: z.number().min(0).max(4),
  sensitive_topics: z.number().min(0).max(4),
  commercial_pressure: z.number().min(0).max(4),
  riskNotes: z.array(z.string().max(32)).min(1).max(3).optional(),
  isEducational: z.boolean().optional()
});