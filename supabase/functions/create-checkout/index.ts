import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://medicalbaise.com",
  "https://www.medicalbaise.com",
  "https://mdbaise.com",
  "https://casabaise.com",
  "https://www.casabaise.com",
  "https://legalbaise.com",
  "https://www.legalbaise.com",
  "https://api.baiseapps.com",
  ...(Deno.env.get("ENVIRONMENT") !== "production" ? ["http://localhost:8080", "http://localhost:5173"] : []),
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

function getValidatedOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const user = userData.user;
    if (!user.email) throw new Error("User email not available");
    logStep("User authenticated");

    const { tier, priceId: clientPriceId, promoCode } = await req.json();

    // Server-side tier-to-priceId mapping (prevents client-side price manipulation)
    const TIER_PRICE_MAP: Record<string, string> = {
      pro: "price_1Syf5Q8Jqppqq3BaME0ZHv52",
      elite: "price_1Syf5d8Jqppqq3BacMVbBLkQ",
      enterprise: "price_1Syf5s8Jqppqq3BaAnA96elD",
    };

    // Resolve price ID: prefer tier mapping, fall back to validated client priceId
    let priceId: string;
    if (tier && TIER_PRICE_MAP[tier]) {
      priceId = TIER_PRICE_MAP[tier];
    } else if (clientPriceId && typeof clientPriceId === "string" && /^price_[A-Za-z0-9]{8,}$/.test(clientPriceId)) {
      // Validate client-provided priceId is in our allowlist
      const allowedPriceIds = Object.values(TIER_PRICE_MAP);
      if (!allowedPriceIds.includes(clientPriceId)) {
        throw new Error("Invalid price ID");
      }
      priceId = clientPriceId;
    } else {
      throw new Error("Valid tier or price ID required");
    }
    logStep("Request parsed");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if Stripe customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Build checkout session config
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${getValidatedOrigin(req)}/subscription?success=true`,
      cancel_url: `${getValidatedOrigin(req)}/subscription?canceled=true`,
      allow_promotion_codes: true,
    };

    // If a specific promo code was provided, look it up and apply as discount
    if (promoCode) {
      try {
        const promoCodes = await stripe.promotionCodes.list({
          code: promoCode,
          active: true,
          limit: 1,
        });

        if (promoCodes.data.length > 0) {
          // Use discounts instead of allow_promotion_codes when we have a specific code
          delete sessionConfig.allow_promotion_codes;
          sessionConfig.discounts = [{ promotion_code: promoCodes.data[0].id }];
          logStep("Promo code applied", { code: promoCode, promoId: promoCodes.data[0].id });
        } else {
          logStep("Promo code not found or inactive", { code: promoCode });
          // Still allow manual entry at checkout
        }
      } catch (promoErr) {
        logStep("Error looking up promo code, allowing manual entry", { error: String(promoErr) });
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    // Return generic error to client, log details server-side only
    const safeErrors = ["No authorization header", "Authentication failed", "Price ID required", "User email not available", "Invalid price ID format"];
    const clientMessage = safeErrors.includes(message) ? message : "Checkout creation failed";
    return new Response(JSON.stringify({ error: clientMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: message === "No authorization header" || message === "Authentication failed" ? 401 : 500,
    });
  }
});
