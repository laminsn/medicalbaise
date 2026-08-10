// api-v1 (§3.1) — REST surface for human developers and any HTTP-capable agent.
//
// Byte-identical across Casa, Medical and Legal.
//
// This file is routing only. Every operation lives in _shared/api-handlers.ts, which
// mcp-server imports as well, so both entry points share one authorisation path.
//
// `verify_jwt = false`: this authenticates by API key, so _shared/api-auth.ts is the
// only gate in front of it. It also means the service-role client is in use and RLS
// does not apply — the handlers reach the database through scopedQuery(), which is
// the substitute control.

import { getCorsHeaders, serverRateLimit } from "../_shared/security.ts";
import {
  apiErrorResponse,
  authenticateApiKey,
} from "../_shared/api-auth.ts";
import {
  adminClient,
  createRequest,
  getProvider,
  type HandlerContext,
  listInvitations,
  listRequests,
  listServices,
  respondToInvitation,
  searchProviders,
  updateService,
} from "../_shared/api-handlers.ts";

type Handler = (ctx: HandlerContext, params: Record<string, unknown>) => Promise<unknown>;

const ROUTES: Record<string, { method: "GET" | "POST"; handler: Handler }> = {
  "/providers/search": { method: "GET", handler: (c, p) => searchProviders(c, p) },
  "/providers/get": { method: "GET", handler: (c, p) => getProvider(c, p as { providerId: string }) },
  "/requests/list": { method: "GET", handler: (c, p) => listRequests(c, p) },
  "/requests/create": { method: "POST", handler: (c, p) => createRequest(c, p as never) },
  "/invitations/list": { method: "GET", handler: (c, p) => listInvitations(c, p) },
  "/invitations/respond": { method: "POST", handler: (c, p) => respondToInvitation(c, p as never) },
  "/services/list": { method: "GET", handler: (c, p) => listServices(c, p) },
  "/services/update": { method: "POST", handler: (c, p) => updateService(c, p as never) },
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = adminClient();
    const principal = await authenticateApiKey(req, admin);

    // Rate limit per key, never per IP. An agent fleet is many IPs behind one key,
    // and a shared NAT is many keys behind one IP.
    if (!serverRateLimit(`api-v1:${principal.keyId}`, 120, 60_000)) {
      return new Response(
        JSON.stringify({ error: "rate_limited" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api-v1/, "").replace(/\/+$/, "") || "/";
    const route = ROUTES[path];

    if (!route) {
      return new Response(
        JSON.stringify({ error: "not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (route.method !== req.method) {
      return new Response(
        JSON.stringify({ error: "method_not_allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const params: Record<string, unknown> = req.method === "GET"
      ? Object.fromEntries(url.searchParams.entries())
      : await req.json().catch(() => ({}));

    const result = await route.handler({ admin, principal }, params);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error, corsHeaders);
  }
});
