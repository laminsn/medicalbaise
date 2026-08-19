import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import {
  authenticateRequest,
  createErrorResponse,
  getCorsHeaders,
  getSafeOrigin,
  rejectNonPostMethod,
} from "../_shared/security.ts";
import {
  MEDICAL_APP_KEY,
  SEEKER_ROLE,
  isSeekerStripePlan,
  requireMedicalAppKey,
  resolveSeekerPriceId,
} from "../_shared/seekerSubscriptions.ts";

type SeekerCheckoutBody = {
  plan?: unknown;
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const methodError = rejectNonPostMethod(req, corsHeaders);
  if (methodError) return methodError;

  try {
    requireMedicalAppKey();
    const { user } = await authenticateRequest(req);
    const body = (await req.json()) as SeekerCheckoutBody;
    const plan = body.plan;

    if (!isSeekerStripePlan(plan)) {
      return new Response(JSON.stringify({ error: "Valid seeker plan required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceId = resolveSeekerPriceId(plan);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Payment service not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;
    const origin = getSafeOrigin(req, "https://www.mdbaise.com");
    const metadata = {
      role: SEEKER_ROLE,
      plan,
      app_key: MEDICAL_APP_KEY,
      user_id: user.id,
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/seeker-pricing?success=true`,
      cancel_url: `${origin}/seeker-pricing?canceled=true`,
      allow_promotion_codes: true,
      metadata,
      subscription_data: { metadata },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "medical_app_key_required" || message === "seeker_price_unset") {
      return new Response(JSON.stringify({ error: "Seeker checkout is not available" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return createErrorResponse(error, corsHeaders, "CREATE-SEEKER-CHECKOUT");
  }
});
