import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push implementation using web-push npm package via esm.sh
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  const encoder = new TextEncoder();
  
  // Create VAPID JWT
  const audience = new URL(subscription.endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours
  
  // Base64url encode helper
  const base64urlEncode = (data: ArrayBuffer | Uint8Array): string => {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  // Decode base64url to Uint8Array
  const decodeBase64url = (str: string): Uint8Array => {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(base64 + padding);
    const result = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      result[i] = decoded.charCodeAt(i);
    }
    return result;
  };

  // Create JWT header and claims
  const header = { alg: "ES256", typ: "JWT" };
  const claims = {
    aud: audience,
    exp,
    sub: "mailto:noreply@autoconnect.app",
  };

  const headerB64 = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const claimsB64 = base64urlEncode(encoder.encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  // Import VAPID private key and sign
  const privateKeyBytes = decodeBase64url(vapidPrivateKey);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes.buffer as ArrayBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = base64urlEncode(signature);
  const jwt = `${unsignedToken}.${signatureB64}`;

  // Get user's public key and auth secret
  const userPublicKey = decodeBase64url(subscription.keys.p256dh);
  const userAuthSecret = decodeBase64url(subscription.keys.auth);

  // Generate local key pair for encryption
  const localKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Export local public key
  const localPublicKeyBuffer = await crypto.subtle.exportKey("raw", localKeys.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyBuffer);

  // Import user's public key
  const importedUserPublicKey = await crypto.subtle.importKey(
    "raw",
    userPublicKey.buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecretBuffer = await crypto.subtle.deriveBits(
    { name: "ECDH", public: importedUserPublicKey },
    localKeys.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBuffer);

  // HKDF helper function
  async function hkdf(
    salt: Uint8Array,
    ikm: Uint8Array,
    info: Uint8Array,
    length: number
  ): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
      "raw",
      ikm.buffer as ArrayBuffer,
      "HKDF",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        salt: salt.buffer as ArrayBuffer,
        info: info.buffer as ArrayBuffer,
        hash: "SHA-256",
      },
      key,
      length * 8
    );
    return new Uint8Array(bits);
  }

  // Create auth info
  const authInfo = encoder.encode("Content-Encoding: auth\0");

  // Derive PRK (pseudo-random key)
  const prk = await hkdf(userAuthSecret, sharedSecret, authInfo, 32);

  // Create context for key derivation
  const keyInfoData = new Uint8Array([
    ...encoder.encode("WebPush: info\0"),
    ...userPublicKey,
    ...localPublicKey,
  ]);

  // Derive IKM
  const ikm = await hkdf(new Uint8Array(0), prk, keyInfoData, 32);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive content encryption key
  const cekInfo = encoder.encode("Content-Encoding: aes128gcm\0");
  const cekBytes = await hkdf(salt, ikm, cekInfo, 16);

  // Derive nonce
  const nonceInfo = encoder.encode("Content-Encoding: nonce\0");
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  // Import CEK
  const cek = await crypto.subtle.importKey(
    "raw",
    cekBytes.buffer as ArrayBuffer,
    "AES-GCM",
    false,
    ["encrypt"]
  );

  // Pad and encrypt payload
  const payloadBytes = encoder.encode(payload);
  const paddingLength = 0;
  const paddedPayload = new Uint8Array(2 + paddingLength + payloadBytes.length);
  paddedPayload[0] = (paddingLength >> 8) & 0xff;
  paddedPayload[1] = paddingLength & 0xff;
  paddedPayload.set(payloadBytes, 2 + paddingLength);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce.buffer as ArrayBuffer },
    cek,
    paddedPayload
  );

  // Build the encrypted content header
  const recordSize = 4096;
  const headerBytes = new Uint8Array(5 + 1 + 65);
  headerBytes.set(salt, 0);
  new DataView(headerBytes.buffer).setUint32(16, recordSize, false);
  headerBytes[20] = 65; // Key length
  headerBytes.set(localPublicKey, 21);

  const body = new Uint8Array(headerBytes.length + encrypted.byteLength);
  body.set(headerBytes, 0);
  body.set(new Uint8Array(encrypted), headerBytes.length);

  // Send the push notification
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "Content-Length": body.length.toString(),
      "TTL": "86400",
      "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
    },
    body,
  });

  return response;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, title, body, action_url, data } = await req.json();

    if (!user_id || !title || !body) {
      throw new Error("Missing required fields: user_id, title, body");
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No push subscriptions found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      action_url,
      data,
      tag: `notification-${Date.now()}`,
    });

    let sent = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        const response = await sendWebPush(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          vapidPublicKey,
          vapidPrivateKey
        );

        if (response.ok) {
          sent++;
        } else if (response.status === 410 || response.status === 404) {
          // Subscription expired, remove it
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          console.log(`Removed expired subscription: ${sub.id}`);
        } else {
          const errorText = await response.text();
          errors.push(`Failed to send to ${sub.endpoint}: ${response.status} - ${errorText}`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Error sending to ${sub.endpoint}: ${message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, total: subscriptions.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
