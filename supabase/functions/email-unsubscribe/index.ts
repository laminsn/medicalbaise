import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { APP_BRANDS, type AppKey } from "../_shared/brands.ts";
import {
  type ConsentSource,
  type EmailCategory,
  getOrCreateUnsubscribeToken,
  normalizeEmail,
} from "../_shared/email-consent.ts";
import {
  AuthError,
  createErrorResponse,
  getCorsHeaders,
  parseRequestBody,
  serverRateLimit,
} from "../_shared/security.ts";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const APP_KEYS: readonly AppKey[] = ["casa", "medical", "legal"];
const GRANULAR_CATEGORIES = [
  "promotions",
  "education",
  "analytics",
  "referral",
  "product_updates",
] as const satisfies readonly EmailCategory[];

type CategoryPreferences = Partial<Record<(typeof GRANULAR_CATEGORIES)[number], boolean>>;

type PreferenceRequest = {
  action?: "get" | "update";
  token?: string;
  brand?: AppKey;
  unsubscribeAllMarketing?: boolean;
  unsubscribeAllProducts?: boolean;
  categoryPreferences?: CategoryPreferences;
};

type TokenRecord = {
  email: string;
  brand: AppKey;
};

type Actor = TokenRecord & {
  token: string;
  userId?: string;
};

const jsonResponse = (
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  || req.headers.get("cf-connecting-ip")
  || "unknown";

const isAppKey = (value: unknown): value is AppKey =>
  value === "casa" || value === "medical" || value === "legal";

const tokenFromUrl = (req: Request) => new URL(req.url).searchParams.get("token")?.trim() || "";

async function resolveToken(
  admin: ReturnType<typeof createClient>,
  token: string,
): Promise<TokenRecord | null> {
  if (!UUID_PATTERN.test(token)) return null;

  const { data, error } = await admin
    .from("email_unsubscribe_tokens")
    .select("email, brand")
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  if (!data || !isAppKey(data.brand)) return null;
  return { email: normalizeEmail(data.email), brand: data.brand };
}

async function resolveJsonActor(
  req: Request,
  body: PreferenceRequest,
  admin: ReturnType<typeof createClient>,
): Promise<Actor | null> {
  const token = String(body.token || "").trim();
  if (token) {
    const record = await resolveToken(admin, token);
    return record ? { ...record, token } : null;
  }

  const authHeader = req.headers.get("Authorization") || "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!accessToken || !isAppKey(body.brand)) {
    throw new AuthError("A valid preference link or signed-in session is required", 401);
  }

  const { data: { user }, error } = await admin.auth.getUser(accessToken);
  if (error || !user?.email) throw new AuthError("A valid preference link or signed-in session is required", 401);

  const email = normalizeEmail(user.email);
  const unsubscribeToken = await getOrCreateUnsubscribeToken(admin, email, body.brand);
  return { email, brand: body.brand, token: unsubscribeToken, userId: user.id };
}

async function loadState(
  admin: ReturnType<typeof createClient>,
  actor: Actor,
) {
  const { data, error } = await admin
    .from("email_suppressions")
    .select("brand, category")
    .eq("email", actor.email);

  if (error) throw error;

  const rows = (data || []) as Array<{ brand: AppKey; category: EmailCategory }>;
  const currentBrandRows = rows.filter((row) => row.brand === actor.brand);
  const allMarketingSuppressed = currentBrandRows.some((row) => row.category === "all");
  const categoryPreferences = Object.fromEntries(
    GRANULAR_CATEGORIES.map((category) => [
      category,
      !allMarketingSuppressed && !currentBrandRows.some((row) => row.category === category),
    ]),
  ) as Record<(typeof GRANULAR_CATEGORIES)[number], boolean>;
  const allBaiseProductsSuppressed = APP_KEYS.every((brand) =>
    rows.some((row) => row.brand === brand && row.category === "all")
  );

  return {
    valid: true,
    token: actor.token,
    email: actor.email,
    brand: actor.brand,
    brandName: APP_BRANDS[actor.brand].name,
    unsubscribeAllMarketing: allMarketingSuppressed,
    unsubscribeAllProducts: allBaiseProductsSuppressed,
    categoryPreferences,
  };
}

async function setSuppression(
  admin: ReturnType<typeof createClient>,
  input: {
    email: string;
    brand: AppKey;
    category: EmailCategory;
    suppressed: boolean;
    source: ConsentSource;
    ip: string;
    userAgent: string | null;
  },
) {
  const { error } = await admin.rpc("set_email_suppression", {
    target_email: input.email,
    target_brand: input.brand,
    target_category: input.category,
    target_suppressed: input.suppressed,
    target_source: input.source,
    target_ip: input.ip,
    target_user_agent: input.userAgent,
  });
  if (error) throw error;
}

async function unsubscribeOneClick(
  admin: ReturnType<typeof createClient>,
  actor: TokenRecord,
  ip: string,
  userAgent: string | null,
) {
  await setSuppression(admin, {
    ...actor,
    category: "all",
    suppressed: true,
    source: "one_click",
    ip,
    userAgent,
  });
}

Deno.serve(async (req) => {
  // This endpoint is the only one that answers GET (the RFC 8058 landing page).
  // Override locally rather than widening the shared POST-only default for all functions.
  const corsHeaders = {
    ...getCorsHeaders(req),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json", Allow: "GET, POST, OPTIONS" },
    });
  }

  try {
    const ip = clientIp(req);
    if (!serverRateLimit(`email-unsubscribe:${ip}`, 30, 60_000)) {
      throw new AuthError("Too many requests", 429);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Email consent service is not configured");
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    if (req.method === "GET") {
      const token = tokenFromUrl(req);
      const record = await resolveToken(admin, token);
      if (!record) return jsonResponse({ valid: false }, 200, corsHeaders);
      return jsonResponse(await loadState(admin, { ...record, token }), 200, corsHeaders);
    }

    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formBody = (await req.text()).trim();
      const token = tokenFromUrl(req);
      const record = formBody === "List-Unsubscribe=One-Click"
        ? await resolveToken(admin, token)
        : null;

      if (record) {
        await unsubscribeOneClick(admin, record, ip, req.headers.get("user-agent"));
      }

      // Unknown and previously suppressed tokens deliberately receive the same response.
      return jsonResponse({ ok: true }, 200, corsHeaders);
    }

    const body = await parseRequestBody<PreferenceRequest>(req, 16 * 1024);
    const actor = await resolveJsonActor(req, body, admin);
    if (!actor) return jsonResponse({ ok: true }, 200, corsHeaders);
    if (body.action === "get") {
      return jsonResponse(await loadState(admin, actor), 200, corsHeaders);
    }

    const userAgent = req.headers.get("user-agent");
    if (body.unsubscribeAllProducts === true) {
      for (const brand of APP_KEYS) {
        await setSuppression(admin, {
          email: actor.email,
          brand,
          category: "all",
          suppressed: true,
          source: "preference_center",
          ip,
          userAgent,
        });
      }
    } else if (typeof body.unsubscribeAllMarketing === "boolean") {
      await setSuppression(admin, {
        email: actor.email,
        brand: actor.brand,
        category: "all",
        suppressed: body.unsubscribeAllMarketing,
        source: "preference_center",
        ip,
        userAgent,
      });
    }

    if (body.categoryPreferences && body.unsubscribeAllMarketing !== true && body.unsubscribeAllProducts !== true) {
      for (const category of GRANULAR_CATEGORIES) {
        const enabled = body.categoryPreferences[category];
        if (typeof enabled !== "boolean") continue;
        await setSuppression(admin, {
          email: actor.email,
          brand: actor.brand,
          category,
          suppressed: !enabled,
          source: "preference_center",
          ip,
          userAgent,
        });
      }
    }

    if (actor.userId && typeof body.unsubscribeAllMarketing === "boolean") {
      const { error } = await admin.from("notification_preferences").upsert({
        user_id: actor.userId,
        marketing_email_enabled: !body.unsubscribeAllMarketing,
        email_enabled: true,
        transactional_email_required: true,
      }, { onConflict: "user_id" });
      if (error) throw error;
    }

    return jsonResponse({ ok: true, ...(await loadState(admin, actor)) }, 200, corsHeaders);
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "EMAIL-UNSUBSCRIBE");
  }
});
