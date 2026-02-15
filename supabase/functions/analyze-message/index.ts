// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({
          toxicity: { label: 'safe', confidence: 0.2 },
          sentiment: { label: 'neutral', confidence: 0.5 },
          feedback: '✓ Start typing to see live analysis',
          shouldWarn: false,
          alternatives: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // @ts-ignore: Deno is a global in Supabase Edge Functions
    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    if (!AI_API_KEY) {
      throw new Error("AI_API_KEY is not configured");
    }

    // Note: Update this URL to your direct AI provider (e.g., Google Gemini, OpenAI)
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a message tone analyzer that helps people communicate more kindly. Analyze the user's message and respond with a JSON object.

Your job is to:
1. Detect if the message is aggressive, toxic, or could hurt someone's feelings
2. Identify the sentiment (positive, neutral, or negative)
3. If the tone is problematic, provide 2-3 alternative phrasings that express the same meaning more kindly
4. Give encouraging, supportive feedback

IMPORTANT: Always respond with valid JSON only, no other text.

Response format:
{
  "toxicity": {
    "label": "safe" | "warning" | "toxic",
    "confidence": 0.0 to 1.0
  },
  "sentiment": {
    "label": "positive" | "neutral" | "negative", 
    "confidence": 0.0 to 1.0
  },
  "feedback": "Brief supportive feedback about the message tone",
  "shouldWarn": true | false,
  "alternatives": [
    {
      "text": "Alternative phrasing 1",
      "reason": "Why this is better"
    }
  ]
}

Guidelines:
- "safe" = friendly, constructive, or neutral tone
- "warning" = might be misinterpreted, slightly dismissive, or passive-aggressive
- "toxic" = aggressive, insulting, hurtful, or harmful language
- Only provide alternatives if the message is "warning" or "toxic"
- Keep alternatives natural and conversational
- Be encouraging, not preachy`
          },
          {
            role: "user",
            content: `Analyze this message: "${message}"`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let analysis;
    try {
      // Handle potential markdown code blocks
      let jsonStr = content.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback response
      analysis = {
        toxicity: { label: 'safe', confidence: 0.5 },
        sentiment: { label: 'neutral', confidence: 0.5 },
        feedback: '✓ Your message looks fine!',
        shouldWarn: false,
        alternatives: []
      };
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("analyze-message error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Analysis failed",
        toxicity: { label: 'safe', confidence: 0.3 },
        sentiment: { label: 'neutral', confidence: 0.5 },
        feedback: '⚠️ Analysis unavailable',
        shouldWarn: false,
        alternatives: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});