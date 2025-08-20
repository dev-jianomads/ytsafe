import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";
import { ageFromScores, deriveBullets, makeVerdict, VideoScoreSchema, CATEGORIES } from "@/lib/rating";
import { resolveChannelId, listRecentVideoIds, getChannelInfo, getVideoComments } from "@/lib/youtube";
import type { CategoryKey, PerVideoScore } from "@/types";
import { trackSuccessfulAnalysis, trackFailedAnalysis } from "@/lib/analytics";

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an ESRB-style content rater for family suitability. Input includes the title/description/transcript excerpt of a single YouTube video, plus top community comments. Output strict JSON with per-category integer scores from 0 (none) to 4 (extreme) for: violence, language, sexual_content, substances, gambling, sensitive_topics, commercial_pressure. 

Category definitions:
- violence: Physical aggression, fighting, weapons, graphic injury
- language: Profanity, slurs, inappropriate language for age groups
- sexual_content: Sexual themes, innuendo, suggestive content, romantic content
- substances: Alcohol, drugs, smoking, vaping, substance abuse
- gambling: Betting, casino games, loot boxes, gambling mechanics
- sensitive_topics: Mental health, death/grief, family trauma, bullying, scary themes, political/religious controversy, identity discussions inappropriate for age
- commercial_pressure: Sponsorships, product placement, aggressive sales tactics, influencer marketing targeting children, scams, deceptive advertising, financial cons, MLM schemes, fake product claims`;

const COMMENT_ANALYSIS_PROMPT = `Analyze these YouTube comments for community sentiment and flags. Return JSON with: avgSentiment (positive/neutral/negative), communityFlags (array of strings like "inappropriate language", "spam", "controversy", "harassment").`;

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
  let requestBody: any = null;
  let parsedQuery: string = '';
  
  try {
    requestBody = await req.json();
    const { q } = requestBody;
    parsedQuery = q;
    const userAgent = req.headers.get('user-agent') || undefined;
    
    // Track token usage across all OpenAI calls
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let openaiRequestsCount = 0;
    
    const YT = process.env.YOUTUBE_API_KEY;
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    
    if (!q || typeof q !== 'string') {
      await trackFailedAnalysis(parsedQuery || 'invalid_query', 'MISSING_QUERY', userAgent);
      return NextResponse.json({ error: "MISSING_QUERY" }, { status: 400 });
    }
    
    if (!YT || !OPENAI_KEY) {
      await trackFailedAnalysis(parsedQuery, 'SERVER_MISCONFIG', userAgent);
      return NextResponse.json({ error: "SERVER_MISCONFIG" }, { status: 500 });
    }

    // Set up abort controller for timeouts - reduced to 25 seconds to stay under Vercel limit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      // Resolve channel ID
      const channelId = await resolveChannelId(q, YT);
      if (!channelId) {
        await trackFailedAnalysis(parsedQuery, 'CHANNEL_NOT_FOUND', userAgent);
        return NextResponse.json({ error: "CHANNEL_NOT_FOUND" }, { status: 404 });
      }

      // Get channel info and recent videos
      const [channelInfo, videoIds] = await Promise.all([
        getChannelInfo(channelId, YT),
        listRecentVideoIds(channelId, YT, 8) // Reduced from 10 to 8 videos
      ]);

      if (videoIds.length === 0) {
        await trackFailedAnalysis(parsedQuery, 'NO_VIDEOS_FOUND', userAgent);
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

      // Process videos in batches to avoid timeout
      const BATCH_SIZE = 3;
      const videoBatches = [];
      for (let i = 0; i < (detailsData.items ?? []).length; i += BATCH_SIZE) {
        videoBatches.push((detailsData.items ?? []).slice(i, i + BATCH_SIZE));
      }

      // Process videos in parallel batches
      for (const batch of videoBatches) {
        const batchPromises = batch.map(async (video: any) => {
          const videoId = video.id;
          const viewCount = Number(video.statistics?.viewCount ?? 0);
          const likeCount = Number(video.statistics?.likeCount ?? 0);
          const commentCount = Number(video.statistics?.commentCount ?? 0);
          const publishedAt = new Date(video.snippet?.publishedAt ?? Date.now());
          const daysOld = Math.max(1, (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
          
          let transcript = "";
          let comments: any[] = [];
          
          // Get transcript and comments in parallel
          const [transcriptResult, commentsResult] = await Promise.allSettled([
            YoutubeTranscript.fetchTranscript(videoId).then(data => 
              (data ?? []).map((t: any) => t.text).join(" ")
            ).catch(() => ""),
            getVideoComments(videoId, YT, 10) // Reduced from 15 to 10 comments
          ]);

          if (transcriptResult.status === 'fulfilled' && transcriptResult.value) {
            transcript = transcriptResult.value;
            transcriptAvailable++;
          }

          if (commentsResult.status === 'fulfilled') {
            comments = commentsResult.value;
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
              .slice(0, 8) // Reduced to top 8 comments
              .map(c => `${c.text} (${c.likeCount} likes, ${c.replyCount} replies)`)
              .join("\n");
            bundle += "\n\nTOP COMMENTS:\n" + commentText.slice(0, 1500); // Reduced token usage
          }

          // Classify with OpenAI
          let categoryScores: Record<CategoryKey, 0|1|2|3|4>;
          let riskNote = "";
          let commentAnalysis: any = undefined;
          
          // Calculate engagement metrics
          const engagementMetrics = calculateEngagementMetrics(
            viewCount, likeCount, commentCount, daysOld, commentAnalysis
          );

          // Analyze comments separately for community insights (only if we have enough comments)
          if (comments.length >= 3) { // Only analyze if we have at least 3 comments
            try {
              const commentBundle = comments
                .slice(0, 8) // Reduced comment analysis scope
                .map(c => `${c.text} (${c.likeCount} likes, ${c.replyCount} replies)`)
                .join("\n");

              const commentCompletion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: COMMENT_ANALYSIS_PROMPT },
                  { role: "user", content: commentBundle }
                ],
                temperature: 0.2,
                max_tokens: 100 // Reduced token usage
              });

              // Track token usage for comment analysis
              if (commentCompletion.usage) {
                totalPromptTokens += commentCompletion.usage.prompt_tokens || 0;
                totalCompletionTokens += commentCompletion.usage.completion_tokens || 0;
                totalTokens += commentCompletion.usage.total_tokens || 0;
                openaiRequestsCount++;
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

            // Track token usage for main analysis
            const usage = completion.usage;
            if (usage) {
              totalPromptTokens += usage.prompt_tokens || 0;
              totalCompletionTokens += usage.completion_tokens || 0;
              totalTokens += usage.total_tokens || 0;
              openaiRequestsCount++;
              
              console.log(\`OpenAI Token Usage for video ${videoId}:`, {
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
              let retryCompletion: any = null;
              try {
                retryCompletion = await openai.chat.completions.create({
                  model: "gpt-4o-mini",
                  messages: [
                    { role: "system", content: SYSTEM_PROMPT + " CRITICAL: Return ONLY valid JSON, no other text." },
                    { role: "user", content: bundle }
                  ],
                  temperature: 0.1,
                  max_tokens: 200
                });
                
                // Track retry token usage
                const retryUsage = retryCompletion.usage;
                if (retryUsage) {
                  totalPromptTokens += retryUsage.prompt_tokens || 0;
                  totalCompletionTokens += retryUsage.completion_tokens || 0;
                  totalTokens += retryUsage.total_tokens || 0;
                  openaiRequestsCount++;
                  
                  console.log(\`OpenAI Retry Token Usage for video ${videoId}:`, {
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
                console.error(\`JSON parsing failed for video ${videoId}:`, {
                  originalResponse: responseText,
                  retryResponse: retryCompletion?.choices[0]?.message?.content || 'No retry response',
                  error: retryError
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
              
              // Apply educational modifier if content is educational
              if (result.data.isEducational) {
                // Reduce scores by 1 point for educational content (minimum 0)
                categoryScores = Object.fromEntries(
                  CATEGORIES.map(k => [k, Math.max(0, categoryScores[k] - 1)])
                ) as Record<CategoryKey, 0|1|2|3|4>;
              }
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

          return {
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
          };
        });

        // Wait for batch to complete and add to videos array
        const batchResults = await Promise.all(batchPromises);
        videos.push(...batchResults);
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

      const analysisResult = {
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
      };

      // Track successful analysis with token usage
      await trackSuccessfulAnalysis(
        parsedQuery, 
        analysisResult, 
        userAgent,
        {
          total_prompt_tokens: totalPromptTokens,
          total_completion_tokens: totalCompletionTokens,
          total_tokens: totalTokens,
          openai_requests_count: openaiRequestsCount
        }
      );
      
      console.log('🎯 Analysis completed, analytics tracking attempted');

      clearTimeout(timeoutId);

      return NextResponse.json(analysisResult);

    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    console.error('Analysis error:', error);
    
    // Track failed analysis
    const userAgent = req.headers.get('user-agent') || undefined;
    
    console.log('❌ Tracking failed analysis:', {
      query: parsedQuery,
      error: error?.message
    });
    
    if (error.name === 'AbortError') {
      await trackFailedAnalysis(parsedQuery, 'TIMEOUT', userAgent);
      return NextResponse.json({ error: "TIMEOUT" }, { status: 408 });
    }
    
    await trackFailedAnalysis(parsedQuery, 'ANALYSIS_FAILED', userAgent);
    return NextResponse.json({ 
      error: "ANALYSIS_FAILED", 
      detail: error?.message ?? String(error) 
    }, { status: 500 });
  }
}