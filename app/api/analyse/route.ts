import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";
import { ageFromScores, deriveBullets, makeVerdict, VideoScoreSchema, CATEGORIES } from "@/lib/rating";
import { resolveChannelId, listRecentVideoIds, getChannelInfo, getVideoComments } from "@/lib/youtube";
import type { CategoryKey, PerVideoScore } from "@/types";

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an ESRB-style content rater for family suitability. Input includes the title/description/transcript excerpt of a single YouTube video, plus top community comments. Output strict JSON with per-category integer scores from 0 (none) to 4 (extreme) for: violence, language, sexual_content, substances, sensitive_topics, commercial_pressure. Consider innuendo, hate slurs, graphic detail, drug instructions, self-harm, and aggressive advertising reads. Factor in community discussion tone and appropriateness. Prefer conservative ratings for ambiguity. Also include a short "riskNote" (3–6 words). Output ONLY JSON.`;

const COMMENT_ANALYSIS_PROMPT = `Analyze these YouTube comments for community sentiment and safety concerns. Output JSON with: "avgSentiment" (positive/neutral/negative), "communityFlags" (array of concerns like "inappropriate language", "mature discussions", "young audience present", "toxic behavior", etc.). Focus on family-safety implications. Output ONLY JSON.`;

function calculateEngagementMetrics(
  viewCount: number, 
  likeCount: number, 
  commentCount: number, 
  daysOld: number,
  commentAnalysis?: any
) {
  const likeToViewRatio = viewCount > 0 ? likeCount / viewCount : 0;
  const commentToViewRatio = viewCount > 0 ? commentCount / viewCount : 0;
  const engagementVelocity = viewCount / daysOld; // views per day
  
  // Calculate controversy score (0-1)
  let controversyScore = 0;
  
  // High comment-to-view ratio often indicates controversial content
  if (commentToViewRatio > 0.01) controversyScore += 0.3; // >1% comment rate
  if (commentToViewRatio > 0.02) controversyScore += 0.2; // >2% comment rate
  
  // Very low like-to-view ratio can indicate disliked content
  if (likeToViewRatio < 0.005 && viewCount > 1000) controversyScore += 0.2;
  
  // Negative community sentiment
  if (commentAnalysis?.avgSentiment === 'negative') controversyScore += 0.3;
  
  // Community flags present
  if (commentAnalysis?.communityFlags?.length > 0) {
    controversyScore += Math.min(0.4, commentAnalysis.communityFlags.length * 0.1);
  }
  
  controversyScore = Math.min(1, controversyScore);
  
  // Determine audience engagement level
  let audienceEngagement: 'low' | 'normal' | 'high' | 'suspicious' = 'normal';
  
  if (commentToViewRatio > 0.03 || controversyScore > 0.8) {
    audienceEngagement = 'suspicious'; // Unusually high engagement or controversy
  } else if (likeToViewRatio > 0.05 || commentToViewRatio > 0.015) {
    audienceEngagement = 'high';
  } else if (likeToViewRatio < 0.002 && commentToViewRatio < 0.001 && viewCount > 1000) {
    audienceEngagement = 'low'; // Possible clickbait or poor content
  }
  
  return {
    likeToViewRatio: Math.round(likeToViewRatio * 10000) / 10000, // 4 decimal places
    commentToViewRatio: Math.round(commentToViewRatio * 10000) / 10000,
    engagementVelocity: Math.round(engagementVelocity),
    controversyScore: Math.round(controversyScore * 100) / 100, // 2 decimal places
    audienceEngagement
  };
}

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
      let transcriptAvailable = 0;
      let totalVideos = detailsData.items?.length || 0;

      // Process each video
      for (const video of detailsData.items ?? []) {
        const videoId = video.id;
        const viewCount = Number(video.statistics?.viewCount ?? 0);
        const likeCount = Number(video.statistics?.likeCount ?? 0);
        const commentCount = Number(video.statistics?.commentCount ?? 0);
        const publishedAt = new Date(video.snippet?.publishedAt ?? Date.now());
        const daysOld = Math.max(1, (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
        
        let transcript = "";
        let comments: any[] = [];
        
        try {
          const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
          transcript = (transcriptData ?? []).map((t: any) => t.text).join(" ");
          transcriptAvailable++;
        } catch (error) {
          // Transcript not available - will be handled by threshold check
        }

        // Get top comments for community context
        try {
          comments = await getVideoComments(videoId, YT, 15);
        } catch (error) {
          console.warn(`Failed to get comments for video ${videoId}:`, error);
        }

        // Build content bundle for analysis
        const transcriptAvailabilityRate = transcriptAvailable / totalVideos;
        const useTranscripts = transcriptAvailabilityRate >= 0.4;
        
        let bundle = [
          video.snippet?.title ?? "",
          video.snippet?.description ?? ""
        ].join("\n").trim();
        
        // Only include transcript if we have sufficient transcript coverage
        if (useTranscripts && transcript) {
          bundle += "\n" + transcript.slice(0, 6000);
        }

        // Add top comments if available
        if (comments.length > 0) {
          const commentText = comments
            .slice(0, 10) // Top 10 comments
            .map(c => `Comment (${c.likeCount} likes): ${c.text}`)
            .join("\n");
          bundle += "\n\nTOP COMMENTS:\n" + commentText.slice(0, 2000);
        }

        // Classify with OpenAI
        let categoryScores: Record<CategoryKey, 0|1|2|3|4>;
        let riskNote = "";
        let commentAnalysis: any = undefined;
        
        // Calculate engagement metrics
        const engagementMetrics = calculateEngagementMetrics(
          viewCount, likeCount, commentCount, daysOld, commentAnalysis
        );

        // Analyze comments separately for community insights
        if (comments.length > 0) {
          try {
            const commentBundle = comments
              .slice(0, 15)
              .map(c => `${c.text} (${c.likeCount} likes, ${c.replyCount} replies)`)
              .join("\n");

            const commentCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: COMMENT_ANALYSIS_PROMPT },
                { role: "user", content: commentBundle }
              ],
              temperature: 0.2,
              max_tokens: 150
            });

            // Log comment analysis token usage
            const commentUsage = commentCompletion.usage;
            if (commentUsage) {
              console.log(`OpenAI Comment Analysis Token Usage for video ${videoId}:`, {
                prompt_tokens: commentUsage.prompt_tokens,
                completion_tokens: commentUsage.completion_tokens,
                total_tokens: commentUsage.total_tokens,
                comment_count: comments.length
              });
            }

            const commentResponseText = commentCompletion.choices[0]?.message?.content ?? "{}";
            const commentParsed = JSON.parse(commentResponseText);
            
            commentAnalysis = {
              totalComments: comments.length,
              avgSentiment: commentParsed.avgSentiment || 'neutral',
              communityFlags: commentParsed.communityFlags || []
            };
          } catch (error) {
            console.warn(`Comment analysis failed for video ${videoId}:`, error);
          }
        }

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

          // Log token usage
          const usage = completion.usage;
          if (usage) {
            console.log(`OpenAI Token Usage for video ${videoId}:`, {
              prompt_tokens: usage.prompt_tokens,
              completion_tokens: usage.completion_tokens,
              total_tokens: usage.total_tokens,
              bundle_length: bundle.length
            });
          }

          const responseText = completion.choices[0]?.message?.content ?? "{}";
          let parsed: any = null;
          
          try {
            // Try to extract JSON from response (in case there's extra text)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : responseText;
            parsed = JSON.parse(jsonString);
          } catch {
            // Retry with explicit formatting instruction
            try {
              const retryCompletion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: COMMENT_ANALYSIS_PROMPT + " CRITICAL: Return ONLY valid JSON, no other text." },
                  { role: "user", content: bundle }
                ],
                temperature: 0.1,
                max_tokens: 200
              }
              )
              
              let commentParsed: any;
              try {
                const commentJsonMatch = commentResponseText.match(/\{[\s\S]*\}/);
                const commentJsonString = commentJsonMatch ? commentJsonMatch[0] : commentResponseText;
                commentParsed = JSON.parse(commentJsonString);
              } catch (parseError) {
                console.warn(`Comment analysis JSON parsing failed for video ${videoId}:`, {
                  response: commentResponseText,
                  error: parseError
                });
                commentParsed = { avgSentiment: 'neutral', communityFlags: [] };
              }
              
              // Log retry token usage
              const retryUsage = retryCompletion.usage;
              if (retryUsage) {
                console.log(`OpenAI Retry Token Usage for video ${videoId}:`, {
                  prompt_tokens: retryUsage.prompt_tokens,
                  completion_tokens: retryUsage.completion_tokens,
                  total_tokens: retryUsage.total_tokens
                });
              }

              const retryText = retryCompletion.choices[0]?.message?.content ?? "{}";
              const retryJsonMatch = retryText.match(/\{[\s\S]*\}/);
              const retryJsonString = retryJsonMatch ? retryJsonMatch[0] : retryText;
              parsed = JSON.parse(retryJsonString);
            } catch (retryError) {
              console.error(`JSON parsing failed for video ${videoId}:`, {
                originalResponse: responseText,
                retryResponse: retryText || 'No retry response',
                error: retryError
              });
              console.warn(`Comment analysis failed for video ${videoId}:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                commentCount: comments.length
              });
            }
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
          console.error(`OpenAI analysis failed for video ${videoId}:`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            videoTitle: video.snippet?.title,
            bundleLength: bundle.length
          });
          
          categoryScores = Object.fromEntries(
            CATEGORIES.map(k => [k, 1])
          ) as Record<CategoryKey, 0|1|2|3|4>;
          riskNote = "analysis failed";
          warnings.push(`Content analysis failed for "${video.snippet?.title || 'Unknown video'}". Using conservative fallback ratings. This may be due to API rate limits or temporary service issues.`);
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
          viewCount,
          likeCount,
          commentCount,
          engagementMetrics,
          categoryScores,
          riskNote: riskNote.slice(0, 64),
          commentAnalysis
        });
      }

      // Check transcript availability and add appropriate warning
      const transcriptAvailabilityRate = transcriptAvailable / totalVideos;
      if (transcriptAvailabilityRate < 0.4) {
        const availablePercent = Math.round(transcriptAvailabilityRate * 100);
        warnings.push(`Limited content analysis: Only ${availablePercent}% of videos had transcripts available. Ratings are based on titles, descriptions, comments, and engagement patterns only. This may result in less detailed content assessment since spoken content couldn't be evaluated.`);
      }

      // Aggregate scores
      const weighted: Record<CategoryKey, { sum: number; w: number }> =
        Object.fromEntries(CATEGORIES.map(k => [k, { sum: 0, w: 0 }])) as any;

      videos.forEach((video, index) => {
        const recency = 1 - index * 0.04; // newest 1.0 → ~0.64
        const viewWeight = Math.log10((video.viewCount ?? 0) + 10) / 10;
        
        // Add engagement-based risk weighting
        let engagementRisk = 1.0;
        if (video.engagementMetrics) {
          const metrics = video.engagementMetrics;
          
          // Suspicious engagement patterns increase weight (more concerning)
          if (metrics.audienceEngagement === 'suspicious') engagementRisk += 0.3;
          if (metrics.controversyScore > 0.7) engagementRisk += 0.2;
          if (metrics.engagementVelocity > 50000) engagementRisk += 0.1; // Viral content
        }
        
        const totalWeight = (recency + viewWeight) * engagementRisk;
        
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
        warnings: warnings.length > 0 ? warnings : undefined,
        transcriptCoverage: {
          available: transcriptAvailable,
          total: totalVideos,
          percentage: Math.round(transcriptAvailabilityRate * 100),
          sufficient: transcriptAvailabilityRate >= 0.4
        }
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