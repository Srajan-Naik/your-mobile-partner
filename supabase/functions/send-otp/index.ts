import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  phone: string;
  type: "signup" | "login" | "resend";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, type } = (await req.json()) as SendOtpRequest;

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Twilio credentials from environment
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhone) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in a simple in-memory cache (in production, use Redis or database)
    // For now, we'll pass it back and let the client verify
    // In a real implementation, store this securely server-side

    // Format phone number
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const messageBody = type === "signup" 
      ? `Welcome to AutoConnect! Your verification code is: ${otp}. Valid for 10 minutes.`
      : `Your AutoConnect verification code is: ${otp}. Valid for 10 minutes.`;

    const formData = new URLSearchParams();
    formData.append("To", formattedPhone);
    formData.append("From", twilioPhone);
    formData.append("Body", messageBody);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioData);
      return new Response(
        JSON.stringify({ 
          error: twilioData.message || "Failed to send SMS",
          code: twilioData.code 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SMS sent successfully:", twilioData.sid);

    // Return success with the OTP hash for verification
    // In production, store OTP server-side with expiration
    const otpHash = await hashOtp(otp, formattedPhone);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent",
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-otp:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Simple hash function for OTP verification
async function hashOtp(otp: string, phone: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${otp}:${phone}:${Deno.env.get("TWILIO_AUTH_TOKEN")}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
