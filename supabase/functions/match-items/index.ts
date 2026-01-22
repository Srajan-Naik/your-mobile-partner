import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LostItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  lost_date: string;
  lost_location_address: string | null;
  lost_location_lat: number | null;
  lost_location_lng: number | null;
  auto_number: string | null;
  route_description: string | null;
  driver_description: string | null;
}

interface MatchRequest {
  found_item_description: string;
  found_location_lat?: number;
  found_location_lng?: number;
  found_date?: string;
  auto_number?: string;
}

interface MatchResult {
  item: LostItem;
  confidence_score: number;
  match_reasons: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user has driver role
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claims.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: hasDriverRole } = await supabase.rpc("has_role", {
      _user_id: claims.user.id,
      _role: "driver",
    });

    if (!hasDriverRole) {
      return new Response(
        JSON.stringify({ error: "Only drivers can use the matching feature" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: MatchRequest = await req.json();
    const { found_item_description, found_location_lat, found_location_lng, found_date, auto_number } = body;

    if (!found_item_description) {
      return new Response(
        JSON.stringify({ error: "found_item_description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch active lost items
    const { data: lostItems, error: itemsError } = await supabase
      .from("lost_items")
      .select("id, title, description, category, lost_date, lost_location_address, lost_location_lat, lost_location_lng, auto_number, route_description, driver_description")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);

    if (itemsError) {
      throw itemsError;
    }

    if (!lostItems || lostItems.length === 0) {
      return new Response(
        JSON.stringify({ matches: [], message: "No active lost item reports found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build AI prompt for matching
    const itemsSummary = lostItems.map((item, index) => 
      `Item ${index + 1}:
      - ID: ${item.id}
      - Title: ${item.title}
      - Description: ${item.description || "No description"}
      - Category: ${item.category}
      - Lost Date: ${item.lost_date}
      - Location: ${item.lost_location_address || "Unknown"}
      - Auto Number: ${item.auto_number || "Unknown"}
      - Route: ${item.route_description || "Unknown"}
      - Driver Description: ${item.driver_description || "Unknown"}`
    ).join("\n\n");

    const prompt = `You are an AI assistant helping match found items with lost item reports. Analyze the following information and identify the most likely matches.

FOUND ITEM DESCRIPTION:
${found_item_description}
${found_location_lat && found_location_lng ? `Found Location: ${found_location_lat}, ${found_location_lng}` : ""}
${found_date ? `Found Date: ${found_date}` : ""}
${auto_number ? `Auto Number: ${auto_number}` : ""}

LOST ITEM REPORTS:
${itemsSummary}

Analyze each lost item report and determine how likely it is to match the found item. Consider:
1. Item description similarity (most important)
2. Category match
3. Location proximity if available
4. Time proximity (items lost recently are more likely matches)
5. Auto number match (exact match is very strong indicator)
6. Route/driver description similarities

Return a JSON array of matches with confidence scores (0-100) and reasons. Only include items with confidence > 30.
Format: [{"item_id": "uuid", "confidence_score": 85, "match_reasons": ["reason1", "reason2"]}]

Return ONLY the JSON array, no other text.`;

    // Call Lovable AI Gateway
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "[]";
    
    // Parse AI response
    let matchData: Array<{ item_id: string; confidence_score: number; match_reasons: string[] }>;
    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      matchData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      matchData = [];
    }

    // Build full match results with item details
    const matches: MatchResult[] = matchData
      .map(match => {
        const item = lostItems.find(i => i.id === match.item_id);
        if (!item) return null;
        return {
          item,
          confidence_score: match.confidence_score,
          match_reasons: match.match_reasons,
        };
      })
      .filter((m): m is MatchResult => m !== null)
      .sort((a, b) => b.confidence_score - a.confidence_score);

    return new Response(
      JSON.stringify({
        matches,
        total_items_analyzed: lostItems.length,
        matches_found: matches.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Match items error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
