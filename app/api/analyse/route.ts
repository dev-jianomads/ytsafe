import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";
import { ageFromScores, deriveBullets, makeVerdict, VideoScoreSchema, CATEGORIES } from "@/lib/rating";
import { detectAlcoholContent, ageFromScoresWithAlcohol } from "@/lib/rating";
import { resolveChannelId, listRecentVideoIds, getChannelInfo, getVideoComments } from "@/lib/youtube";
import type { CategoryKey, PerVideoScore } from "@/types";
import { trackSuccessfulAnalysis, trackFailedAnalysis } from "@/lib/analytics";
import { detectDevice } from "@/lib/device";

const SYSTEM_PROMPT = `You are an ESRB-style content rater for family suitability. Input includes the title/description/transcript excerpt of a single YouTube video, plus top community comments. Output strict JSON with per-category decimal scores from 0-4 for: violence, language, sexual_content, substances, gambling, sensitive_topics, commercial_pressure.

Scoring scale (use decimals for precision):
- 0-1: None to Mild - No content or brief/minor mentions that don't dominate the video
- >1-2: Moderate - Some concerning elements present, occasional throughout video
- >2-3: Strong - Frequent concerning content, significant presence in video
- >3-4: Extreme - Dominant concerning themes, primary focus of content

Category definitions:
- violence: Physical aggression, fighting, weapons, graphic injury
- language: Profanity, slurs, inappropriate language for age groups
- sexual_content: Sexual themes, innuendo, suggestive content, romantic content
- substances: Alcohol, drugs, smoking, vaping, substance abuse
- gambling: Betting, casino games, loot boxes, gambling mechanics
- sensitive_topics: Mental health, death/grief, family trauma, bullying, scary themes, political/religious controversy, identity discussions inappropriate for age
- commercial_pressure: Sponsorships, product placement, aggressive sales tactics, influencer marketing targeting children, scams, deceptive advertising, financial cons, MLM schemes, fake product claims

Educational Intent Detection:
- Distinguish between educational/documentary content vs promotional/entertainment content
- Educational discussions of sensitive topics for age-appropriate learning should receive lower scores than entertainment exploitation
- Consider the intent: Educational/awareness = lower score, Entertainment/sensational = higher score, Promotional/exploitative = highest score
- Evaluate HOW topics are presented: Clinical/educational tone = lower risk, Sensationalized/dramatic = higher risk, Age-appropriate explanations = lower risk

Additional fields: 
- isEducational (boolean) - true if content appears to be primarily educational/documentary in nature with responsible presentation of topics
- riskNotes (array of 1-3 strings, max 32 chars each) - the most important risk factors for parents, based on highest-scoring categories. Examples: ["gaming violence", "mild language"], ["gambling content"], ["educational discussion", "sensitive topics"]`;

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

// Ensure proper Next.js 13+ App Router API route export
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let requestBody: any = null;
  let parsedQuery: string = '';
  let device: string = 'Web'; // Default fallback
  
  try {
    requestBody = await req.json();
    const { q } = requestBody;
    parsedQuery = q;
    const userAgent = headers().get('user-agent') || undefined;
    device = detectDevice(); // Update the declared variable
    
    // Track token usage across all OpenAI calls
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let openaiRequestsCount = 0;
    
    const YT = process.env.YOUTUBE_API_KEY;
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    
    if (!q || typeof q !== 'string') {
      await trackFailedAnalysis(parsedQuery || 'invalid_query', 'MISSING_QUERY', userAgent, device);
      return NextResponse.json({ error: "MISSING_QUERY" }, { status: 400 });
    }
    
    if (!YT || !OPENAI_KEY) {
      await trackFailedAnalysis(parsedQuery, 'SERVER_MISCONFIG', userAgent, device);
      return NextResponse.json({ error: "SERVER_MISCONFIG" }, { status: 500 });
    }

    // Set up abort controller for timeouts - reduced to 25 seconds to stay under Vercel limit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      // Resolve channel ID
      const channelId = await resolveChannelId(q, YT);
      if (!channelId) {
        await trackFailedAnalysis(parsedQuery, 'CHANNEL_NOT_FOUND', userAgent, device);
        return NextResponse.json({ error: "CHANNEL_NOT_FOUND" }, { status: 404 });
      }

      // Get channel info and recent videos
      const [channelInfo, videoIds] = await Promise.all([
        getChannelInfo(channelId, YT),
        listRecentVideoIds(channelId, YT, 5) // Reduced from 8 to 5 videos
      ]);

      if (videoIds.length === 0) {
        await trackFailedAnalysis(parsedQuery, 'NO_VIDEOS_FOUND', userAgent, device);
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
      let analysisFailureCount = 0;
      let transcriptAvailable = 0;
      let totalVideos = detailsData.items?.length || 0;
      let hasAlcoholContent = false; // Track if any video contains alcohol content

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
          
          // Check for alcohol content in this video
          const videoHasAlcohol = detectAlcoholContent(bundle);
          if (videoHasAlcohol) {
            hasAlcoholContent = true; // Mark that channel has alcohol content
          }
          
          // Only include transcript if we have sufficient transcript coverage
          if (useTranscripts && transcript) {
            bundle += "\n" + transcript.slice(0, 6000);
            // Also check transcript for alcohol content
            if (!videoHasAlcohol && detectAlcoholContent(transcript)) {
              hasAlcoholContent = true;
            }
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
          let riskNotes: string[] = [];
          let commentAnalysis: any = undefined;
          let isEducational = false;
          
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
              
              // Extract JSON from response (handle markdown formatting)
              let commentParsed: any = {};
              try {
                const commentJsonMatch = commentResponseText.match(/\{[\s\S]*\}/);
                const commentJsonString = commentJsonMatch ? commentJsonMatch[0] : commentResponseText;
                commentParsed = JSON.parse(commentJsonString);
              } catch (parseError) {
                console.warn(`Comment JSON parsing failed for video ${videoId}:`, {
                  response: commentResponseText,
                  error: parseError instanceof Error ? parseError.message : String(parseError)
                });
                // Use safe defaults
                commentParsed = {
                  avgSentiment: 'neutral',
                  communityFlags: []
                };
              }
              
              commentAnalysis = {
                totalComments: comments.length,
                avgSentiment: commentParsed.avgSentiment || 'neutral',
                communityFlags: commentParsed.communityFlags || []
              };
            } catch (error) {
              console.warn(`Comment analysis failed for video ${videoId}:`, error);
              // Ensure commentAnalysis is always defined
              commentAnalysis = {
                totalComments: comments.length,
                avgSentiment: 'neutral',
                communityFlags: []
              };
            }
          }

          try {
            // Send content bundle to LLM for analysis
            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: bundle } // ← Video content goes here
              ],
              temperature: 0.2,
              max_tokens: 200
            });

            // LLM returns JSON with category scores
            // Track token usage for main analysis
            const usage = completion.usage;
            if (usage) {
              totalPromptTokens += usage.prompt_tokens || 0;
              totalCompletionTokens += usage.completion_tokens || 0;
              totalTokens += usage.total_tokens || 0;
              openaiRequestsCount++;
              
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
              // Parse the JSON response from LLM
              // Try to extract JSON from response (in case there's extra text)
              const jsonMatch = responseText.match(/\{[\s\S]*\}/);
              const jsonString = jsonMatch ? jsonMatch[0] : responseText;
              parsed = JSON.parse(jsonString);
            } catch {
              // Retry with explicit formatting instruction
              let retryCompletion: any = null;
              try {
            // Validate the LLM response against our schema
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
                  retryResponse: retryCompletion?.choices[0]?.message?.content || 'No retry response',
                  error: retryError
                });
              }
            }

            // Validate and sanitize scores
            const result = VideoScoreSchema.safeParse(parsed);
            if (result.success) {
              // Extract category scores from LLM response
              categoryScores = Object.fromEntries(
                CATEGORIES.map(k => [k, Math.max(0, Math.min(4, Math.round(result.data[k])))])
              ) as Record<CategoryKey, 0|1|2|3|4>;
              riskNotes = result.data.riskNotes || [];
              isEducational = result.data.isEducational || false;
              
              // Apply educational modifier if content is educational
              // Apply educational modifier if content is educational
              if (isEducational) {
                // Reduce scores by 1 point for educational content (minimum 0)
                // Reduce scores by 1 point for educational content (minimum 0)
                categoryScores = Object.fromEntries(
                  CATEGORIES.map(k => [k, Math.max(0, categoryScores[k] - 1)])
                ) as Record<CategoryKey, 0|1|2|3|4>;
              }
            } else {
              console.error(`Schema validation failed for video ${videoId}:`, {
                validationErrors: result.error.errors,
                rawResponse: responseText,
                parsedData: parsed,
                videoTitle: video.snippet?.title,
                bundleLength: bundle.length
              });
              throw new Error("Invalid classification response");
            }
          } catch (error) {
            // Fallback to conservative defaults - INVESTIGATE: Why is this failing?
            console.error(`OpenAI analysis failed for video ${videoId}:`, {
              error: error instanceof Error ? error.message : 'Unknown error',
              videoTitle: video.snippet?.title,
              bundleLength: bundle.length,
              hasTranscript: !!transcript,
              commentCount: comments.length,
              bundle: bundle.substring(0, 200) + '...' // First 200 chars for debugging
            });
            
            // CRITICAL FIX: Detect obvious gambling content in titles
            const title = video.snippet?.title?.toLowerCase() || '';
            const description = video.snippet?.description?.toLowerCase() || '';
            const content = `${title} ${description}`;
            
            // ENHANCED FALLBACK: Detect problematic content by keywords
            const detectedCategories = {
              violence: 1,
              language: 1, 
              sexual_content: 1,
              substances: 1,
              gambling: 1,
              sensitive_topics: 1,
              commercial_pressure: 1
            };

            // 🎰 GAMBLING DETECTION
            const gamblingKeywords = [
              'slots', 'pokie', 'poker', 'casino', 'bet', 'betting', 'jackpot',
              'spin', 'reel', 'gambling', 'wager', 'stake', 'win money', 'payout',
              'odds', 'blackjack', 'roulette', 'scratch card', 'lottery'
            ];
            if (gamblingKeywords.some(keyword => content.includes(keyword)) || 
                /\$\d+/.test(content) || // Dollar amounts like $5, $10
                /bet\s*\$/.test(content)) { // "bet $" patterns
              detectedCategories.gambling = 4;
              console.log(`🎰 Gambling content detected: ${title}`);
            }

            // 🤬 LANGUAGE DETECTION  
            const languageKeywords = [
              'fuck', 'shit', 'damn', 'hell', 'bitch', 'ass', 'crap',
              'uncensored', 'explicit', 'nsfw', 'adult language', 'profanity'
            ];
            if (languageKeywords.some(keyword => content.includes(keyword))) {
              detectedCategories.language = 3;
              console.log(`🤬 Strong language detected: ${title}`);
            }

            // 🥊 VIOLENCE DETECTION
            const violenceKeywords = [
              'fight', 'fighting', 'blood', 'gore', 'kill', 'murder', 'death',
              'weapon', 'gun', 'knife', 'war', 'battle', 'combat', 'brutal',
              'violent', 'attack', 'assault', 'torture', 'graphic'
            ];
            if (violenceKeywords.some(keyword => content.includes(keyword))) {
              detectedCategories.violence = 3;
              console.log(`🥊 Violence detected: ${title}`);
            }

            // 💋 SEXUAL CONTENT DETECTION
            const sexualKeywords = [
              'sex', 'sexy', 'nude', 'naked', 'porn', 'adult', 'erotic',
              'sexual', 'intimate', 'seductive', 'suggestive', 'bikini',
              'lingerie', 'dating', 'hookup', 'mature content'
            ];
            if (sexualKeywords.some(keyword => content.includes(keyword))) {
              detectedCategories.sexual_content = 3;
              console.log(`💋 Sexual content detected: ${title}`);
            }

            // 🍺 SUBSTANCES DETECTION
            const substanceKeywords = [
              'drunk', 'alcohol', 'beer', 'wine', 'vodka', 'whiskey', 'cocktail',
              'bar', 'pub', 'drinking', 'drinking game', 'party drinking',
              'weed', 'marijuana', 'drugs', 'high', 'stoned', 'vaping', 'vape',
              'cigarette', 'tobacco', 'smoking'
            ];
            
            // Enhanced alcohol-specific detection
            const alcoholKeywords = [
              'drunk', 'alcohol', 'beer', 'wine', 'vodka', 'whiskey', 'cocktail',
              'bar', 'pub', 'drinking', 'drinking game', 'party drinking', 'booze',
              'liquor', 'champagne', 'rum', 'gin', 'tequila', 'shots', 'bartender'
            ];
            
            let videoHasAlcoholFallback = false;
            if (substanceKeywords.some(keyword => content.includes(keyword))) {
              detectedCategories.substances = 3;
              // Check if it's specifically alcohol content
              if (alcoholKeywords.some(keyword => content.includes(keyword))) {
                videoHasAlcoholFallback = true;
                hasAlcoholContent = true; // Mark channel-level alcohol detection
              }
              console.log(`🍺 Substance content detected: ${title}`);
            }

            // 🧠 SENSITIVE TOPICS DETECTION
            const sensitiveKeywords = [
              'suicide', 'depression', 'anxiety', 'self harm', 'cutting', 'death',
              'funeral', 'tragedy', 'trauma', 'abuse', 'bullying', 'scary',
              'horror', 'nightmare', 'disturbing', 'controversial', 'political',
              'religion', 'conspiracy', 'eating disorder', 'anorexia'
            ];
            if (sensitiveKeywords.some(keyword => content.includes(keyword))) {
              detectedCategories.sensitive_topics = 3;
              console.log(`🧠 Sensitive content detected: ${title}`);
            }

            // 💰 COMMERCIAL PRESSURE DETECTION
            const commercialKeywords = [
              'buy now', 'limited time', 'sale', 'discount', 'promo code',
              'sponsor', 'ad', 'advertisement', 'affiliate', 'get rich',
              'make money', 'earn cash', 'investment', 'crypto', 'bitcoin',
              'scam', 'pyramid', 'mlm', 'clickbait', 'subscribe for'
            ];
            if (commercialKeywords.some(keyword => content.includes(keyword))) {
              detectedCategories.commercial_pressure = 3;
              console.log(`💰 Commercial pressure detected: ${title}`);
            }

            // Apply detected scores - use actual detected scores, not inflated ones
            categoryScores = Object.fromEntries(
              CATEGORIES.map(k => [k, detectedCategories[k as CategoryKey]])
            ) as Record<CategoryKey, 0|1|2|3|4>;
            
            // EDUCATIONAL INTENT DETECTION IN FALLBACK
            const educationalKeywords = [
              'tutorial', 'lesson', 'learn', 'education', 'educational', 'teaching',
              'explained', 'how to', 'guide', 'documentary', 'awareness', 'science',
              'history', 'math', 'physics', 'chemistry', 'biology', 'geography',
              'literature', 'study', 'academic', 'university', 'school', 'course',
              'lecture', 'professor', 'teacher', 'instructor', 'demonstration',
              'experiment', 'research', 'analysis', 'theory', 'facts', 'information',
              'knowledge', 'understanding', 'explanation', 'breakdown', 'overview'
            ];
            
            const isEducationalFallback = educationalKeywords.some(keyword => 
              content.toLowerCase().includes(keyword)
            ) || 
            // Check for educational patterns
            /\b(how\s+to|step\s+by\s+step|tutorial|explained|lesson\s+\d+)\b/i.test(content) ||
            // Check for academic/scientific language patterns
            /\b(according\s+to|research\s+shows|studies\s+indicate|scientists|experts)\b/i.test(content);
            
            // Apply educational modifier to fallback scores
            if (isEducationalFallback) {
              console.log(`🎓 Educational content detected in fallback: ${title}`);
              categoryScores = Object.fromEntries(
                CATEGORIES.map(k => [k, Math.max(0, categoryScores[k] - 1)])
              ) as Record<CategoryKey, 0|1|2|3|4>;
              isEducational = true;
            }
            
            // Generate appropriate risk note based on final scores
            const highestCategory = Object.entries(categoryScores)
              .sort((a, b) => b[1] - a[1])[0];
            
            if (highestCategory[1] >= 3) {
              const categoryNames: Record<string, string> = {
                gambling: 'gambling content',
                language: 'strong language', 
                violence: 'violent content',
                sexual_content: 'sexual content',
                substances: 'substance use',
                sensitive_topics: 'sensitive topics',
                commercial_pressure: 'commercial pressure'
              };
              riskNotes = [categoryNames[highestCategory[0]] || 'analysis failed'];
            } else if (highestCategory[1] >= 2) {
              const categoryNames: Record<string, string> = {
                gambling: 'gambling content',
                language: 'mild language', 
                violence: 'mild violence',
                sexual_content: 'suggestive content',
                substances: 'substance references',
                sensitive_topics: 'sensitive topics',
                commercial_pressure: 'commercial pressure'
              };
              riskNotes = [categoryNames[highestCategory[0]] || 'moderate content'];
            } else if (highestCategory[1] >= 1) {
              const categoryNames: Record<string, string> = {
                gambling: 'gambling references',
                language: 'mild language', 
                violence: 'mild action',
                sexual_content: 'mild content',
                substances: 'substance mentions',
                sensitive_topics: 'mild themes',
                commercial_pressure: 'sponsorship content'
              };
              riskNotes = [categoryNames[highestCategory[0]] || 'mild content'];
            } else {
              riskNotes = ["family friendly"];
            }
            analysisFailureCount++;
          }

          const maxScore = Math.max(...Object.values(categoryScores));
          
          // Ensure risk notes match the actual scores for successful analyses too
          if (riskNotes.length === 0) {
            // Find the highest scoring categories and generate appropriate notes
            const sortedCategories = Object.entries(categoryScores)
              .sort((a, b) => b[1] - a[1])
              .filter(([_, score]) => score > 0);
            
            if (sortedCategories.length > 0) {
              const topCategory = sortedCategories[0];
              const score = topCategory[1];
              const category = topCategory[0];
              
              const categoryNames: Record<string, Record<number, string>> = {
                violence: { 1: 'mild action', 2: 'moderate violence', 3: 'strong violence', 4: 'extreme violence' },
                language: { 1: 'mild language', 2: 'moderate language', 3: 'strong language', 4: 'extreme language' },
                sexual_content: { 1: 'mild content', 2: 'suggestive content', 3: 'sexual content', 4: 'explicit content' },
                substances: { 1: 'substance mentions', 2: 'substance references', 3: 'substance use', 4: 'heavy substance use' },
                gambling: { 1: 'gambling mentions', 2: 'gambling content', 3: 'gambling focus', 4: 'gambling promotion' },
                sensitive_topics: { 1: 'mild themes', 2: 'sensitive topics', 3: 'heavy themes', 4: 'disturbing content' },
                commercial_pressure: { 1: 'sponsorship content', 2: 'commercial content', 3: 'commercial pressure', 4: 'aggressive marketing' }
              };
              
              const categoryLabels = categoryNames[category as CategoryKey];
              if (categoryLabels && categoryLabels[score]) {
                riskNotes = [categoryLabels[score]];
              } else {
                riskNotes = [score >= 3 ? "strong content" : score === 2 ? "moderate content" : "mild content"];
              }
              
              // Add secondary categories if they're also significant
              if (sortedCategories.length > 1 && sortedCategories[1][1] >= 2) {
                const secondCategory = sortedCategories[1];
                const secondCategoryLabels = categoryNames[secondCategory[0] as CategoryKey];
                if (secondCategoryLabels && secondCategoryLabels[secondCategory[1]]) {
                  riskNotes.push(secondCategoryLabels[secondCategory[1]]);
                }
              }
            } else {
              riskNotes = ["family friendly"];
            }
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
            riskNotes: riskNotes.map(note => note.slice(0, 32)),
            isEducational,
            commentAnalysis
          };
        });

        // Wait for batch to complete and add to videos array
        const batchResults = await Promise.all(batchPromises);
        videos.push(...batchResults);
      }

      // Add grouped analysis failure message if any videos failed
      if (analysisFailureCount > 0) {
        warnings.push(`AI couldn't fully analyze ${analysisFailureCount} of ${totalVideos} videos due to technical limitations, so for those we used conservative safety ratings based on keywords and video information. When in doubt, we err on the side of caution.`);
      }

      // Check transcript availability and add appropriate warning
      const transcriptAvailabilityRate = transcriptAvailable / totalVideos;
      if (transcriptAvailabilityRate < 0.4) {
        const availablePercent = Math.round(transcriptAvailabilityRate * 100);
        warnings.push(`Limited analysis: Only ${availablePercent}% of videos had spoken content available for review. Safety ratings are based on video titles, descriptions, and viewer comments only. For the most accurate assessment, we recommend watching a few videos yourself.`);
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

      const ageBand = ageFromScoresWithAlcohol(aggregateScores, hasAlcoholContent);
      const bullets = deriveBullets(aggregateScores);
      const verdict = makeVerdict(ageBand, aggregateScores, hasAlcoholContent);

      const analysisResult = {
        query: q,
        channel: channelInfo,
        videos,
        aggregate: {
          scores: aggregateScores,
          ageBand,
          verdict,
          bullets,
          hasAlcoholContent // Pass alcohol detection to frontend
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
        device,
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
    const userAgent = headers().get('user-agent') || undefined;
    
    console.log('❌ Tracking failed analysis:', {
      query: parsedQuery,
      error: error?.message
    });
    
    if (error.name === 'AbortError') {
      await trackFailedAnalysis(parsedQuery, 'TIMEOUT', userAgent, device);
      return NextResponse.json({ error: "TIMEOUT" }, { status: 408 });
    }
    
    await trackFailedAnalysis(parsedQuery, 'ANALYSIS_FAILED', userAgent, device);
    return NextResponse.json({ 
      error: "ANALYSIS_FAILED", 
      detail: error?.message ?? String(error) 
    }, { status: 500 });
  }
}