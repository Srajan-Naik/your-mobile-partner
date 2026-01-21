import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOtpRequest {
  phone: string;
  otp: string;
  otpHash: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp, otpHash } = (await req.json()) as VerifyOtpRequest;

    if (!phone || !otp || !otpHash) {
      return new Response(
        JSON.stringify({ error: "Phone, OTP, and hash are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

    // Verify the OTP by hashing and comparing
    const expectedHash = await hashOtp(otp, formattedPhone);

    if (expectedHash !== otpHash) {
      return new Response(
        JSON.stringify({ error: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP is valid - update the user's profile to mark as verified
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the user by phone and update verification status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update({ is_verified: true })
      .eq("phone", formattedPhone)
      .select()
      .single();

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't fail - the verification was still successful
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Phone verified successfully",
        verified: true
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in verify-otp:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Same hash function as send-otp
async function hashOtp(otp: string, phone: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${otp}:${phone}:${Deno.env.get("TWILIO_AUTH_TOKEN")}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
