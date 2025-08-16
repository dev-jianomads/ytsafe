import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";
import { ageFromScores, deriveBullets, makeVerdict, VideoScoreSchema, CATEGORIES } from "@/lib/rating";
import { resolveChannelId, listRecentVideoIds, getChannelInfo } from "@/lib/youtube";
import type { CategoryKey, PerVideoScore } from "@/types";

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an ESRB-style content rater for family suitability. Input is the title/description/transcript excerpt of a single YouTube video. Output strict JSON with per-category integer scores from 0 (none) to 4 (extreme) for: violence, language, sexual_content, substances, sensitive_topics, commercial_pressure. Consider innuendo, hate slurs, graphic detail, drug instructions, self-harm, and aggressive advertising reads. Prefer conservative ratings for ambiguity. Also include a short "riskNote" (3–6 words). Output ONLY JSON.`;

export async function POST(req: NextRequest) {
  try {
    const { q } = await req.json();
    const YT = process.env.YOUTUBE_API_KEY;
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    
    if (!q || typeof q !== 'string') {
      return NextResponse.json({ error: "MISSING_QUERY" }, { status: 400 });
    }
    
    if (!YT || !OPENAI_KEY) {
      return NextResponse.json({ error: "SERVER_MISCONFIG" }, { status: 500 });
    }

    // Set up abort controller for timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      // Resolve channel ID
      const channelId = await resolveChannelId(q, YT);
      if (!channelId) {
        return NextResponse.json({ error: "CHANNEL_NOT_FOUND" }, { status: 404 });
      }

      // Get channel info and recent videos
      const [channelInfo, videoIds] = await Promise.all([
        getChannelInfo(channelId, YT),
        listRecentVideoIds(channelId, YT, 10)
      ]);

      if (videoIds.length === 0) {
        return NextResponse.json({ error: "NO_VIDEOS_FOUND" }, { status: 404 });
      }

      // Get video details
      const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      detailsUrl.searchParams.set('part', 'snippet,contentDetails,statistics,status');
      detailsUrl.searchParams.set('id', videoIds.join(','));
      detailsUrl.searchParams.set('key', YT);

      const detailsResponse = await fetch(detailsUrl, { signal: controller.signal });
      const detailsData = await detailsResponse.json();

      const openai = new OpenAI({ apiKey: OPENAI_KEY });
      const videos: PerVideoScore[] = [];
      const warnings: string[] = [];
      let transcriptMissing = 0;

      // Process each video
      for (const video of detailsData.items ?? []) {
        const videoId = video.id;
        let transcript = "";
        
        try {
          const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
          transcript = (transcriptData ?? []).map((t: any) => t.text).join(" ");
        } catch (error) {
          transcriptMissing++;
        }

        // Build content bundle for analysis
        const bundle = [
          video.snippet?.title ?? "",
          video.snippet?.description ?? "",
          transcript.slice(0, 6000)
        ].join("\n").trim();

        // Classify with OpenAI
        let categoryScores: Record<CategoryKey, 0|1|2|3|4>;
        let riskNote = "";

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: bundle }
            ],
            temperature: 0.2,
            max_tokens: 200
          });

          const responseText = completion.choices[0]?.message?.content ?? "{}";
          let parsed: any;
          
          try {
            parsed = JSON.parse(responseText);
          } catch {
            // Retry with explicit formatting instruction
            const retryCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: bundle },
                { role: "assistant", content: responseText },
                { role: "user", content: "Please format strictly as JSON with the required fields." }
              ],
              temperature: 0.1,
              max_tokens: 200
            });
            
            const retryText = retryCompletion.choices[0]?.message?.content ?? "{}";
            parsed = JSON.parse(retryText);
          }

          // Validate and sanitize scores
          const result = VideoScoreSchema.safeParse(parsed);
          if (result.success) {
            categoryScores = Object.fromEntries(
              CATEGORIES.map(k => [k, Math.max(0, Math.min(4, Math.round(result.data[k])))])
            ) as Record<CategoryKey, 0|1|2|3|4>;
            riskNote = result.data.riskNote;
          } else {
            throw new Error("Invalid classification response");
          }
        } catch (error) {
          // Fallback to conservative defaults
          categoryScores = Object.fromEntries(
            CATEGORIES.map(k => [k, 1])
          ) as Record<CategoryKey, 0|1|2|3|4>;
          riskNote = "analysis failed";
          warnings.push(`Classification failed for video ${videoId}: ${error instanceof Error ? error.message : 'Unknown error'}. Using conservative fallback ratings.`);
        }

        const maxScore = Math.max(...Object.values(categoryScores));
        if (!riskNote) {
          riskNote = maxScore >= 3 ? "strong content" : 
                    maxScore === 2 ? "moderate content" : "mild content";
        }

        videos.push({
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title: video.snippet?.title ?? "Untitled",
          publishedAt: video.snippet?.publishedAt ?? "",
          viewCount: Number(video.statistics?.viewCount ?? 0),
          categoryScores,
          riskNote: riskNote.slice(0, 64)
        });
      }

      if (transcriptMissing > 3) {
        const transcriptAvailable = videos.length - transcriptMissing;
        const availablePercent = Math.round((transcriptAvailable / videos.length) * 100);
        warnings.push(`${transcriptMissing} transcripts missing (out of ${videos.length} videos analyzed). Only ${availablePercent}% of videos had transcripts available, which may result in less accurate content analysis since spoken content couldn't be evaluated.`);
      }

      // Aggregate scores
      const weighted: Record<CategoryKey, { sum: number; w: number }> =
        Object.fromEntries(CATEGORIES.map(k => [k, { sum: 0, w: 0 }])) as any;

      videos.forEach((video, index) => {
        const recency = 1 - index * 0.04; // newest 1.0 → ~0.64
        const viewWeight = Math.log10((video.viewCount ?? 0) + 10) / 10;
        const totalWeight = recency + viewWeight;
        
        for (const category of CATEGORIES) {
          weighted[category].sum += video.categoryScores[category] * totalWeight;
          weighted[category].w += totalWeight;
        }
      });

      const aggregateScores = Object.fromEntries(
        CATEGORIES.map(category => {
          const avg = weighted[category].w ? weighted[category].sum / weighted[category].w : 0;
          return [category, Math.round(avg * 10) / 10];
        })
      ) as Record<CategoryKey, number>;

      const ageBand = ageFromScores(aggregateScores);
      const bullets = deriveBullets(aggregateScores);
      const verdict = makeVerdict(ageBand, aggregateScores);

      clearTimeout(timeoutId);

      return NextResponse.json({
        query: q,
        channel: channelInfo,
        videos,
        aggregate: {
          scores: aggregateScores,
          ageBand,
          verdict,
          bullets
        },
        warnings: warnings.length > 0 ? warnings : undefined
      });

    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    console.error('Analysis error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: "TIMEOUT" }, { status: 408 });
    }
    
    return NextResponse.json({ 
      error: "ANALYSIS_FAILED", 
      detail: error?.message ?? String(error) 
    }, { status: 500 });
  }
}