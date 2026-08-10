// mcp-server (§3.2) — Model Context Protocol over HTTP, for autonomous agents.
//
// Byte-identical across Casa, Medical and Legal.
//
// This deliberately imports its handlers from _shared/api-handlers.ts — the same
// module api-v1 routes to — rather than reimplementing them. MCP's contribution is
// discovery (tools/list) and schema; the business logic and every authorisation
// decision live in one place. A second implementation here would be a second set of
// authorisation bugs, and the two would drift.
//
// `verify_jwt = false`: authentication is by API key via _shared/api-auth.ts, which
// is therefore the only gate.
//
// Transport: JSON-RPC 2.0 over a single POST endpoint (Streamable HTTP). No SSE
// stream is exposed — every tool here is request/response, and an unused stream is
// an unmonitored surface.

import { getCorsHeaders, serverRateLimit } from "../_shared/security.ts";
import {
  type ApiPrincipal,
  type ApiScope,
  ApiAuthError,
  apiErrorResponse,
  authenticateApiKey,
  hasScope,
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

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_NAME = "baise";
const SERVER_VERSION = "0.1.0";

interface ToolDefinition {
  name: string;
  description: string;
  scope: ApiScope;
  principal?: "provider" | "client";
  inputSchema: Record<string, unknown>;
  handler: (ctx: HandlerContext, args: Record<string, unknown>) => Promise<unknown>;
}

const str = (description: string) => ({ type: "string", description });
const num = (description: string) => ({ type: "number", description });

const TOOLS: ToolDefinition[] = [
  {
    name: "search_providers",
    description:
      "Search service providers on this Baise product. Returns rating, review count and verification status so an agent can rank candidates.",
    scope: "providers:read",
    inputSchema: {
      type: "object",
      properties: {
        query: str("Free-text match against the business name."),
        categoryId: str("Restrict to providers offering this service category."),
        limit: num("Maximum results, 1-50. Defaults to 20."),
      },
    },
    handler: (ctx, args) => searchProviders(ctx, args),
  },
  {
    name: "get_provider",
    description: "Fetch one provider's full public profile by id.",
    scope: "providers:read",
    inputSchema: {
      type: "object",
      properties: { providerId: str("The provider's id.") },
      required: ["providerId"],
    },
    handler: (ctx, args) => getProvider(ctx, args as { providerId: string }),
  },
  {
    name: "list_requests",
    description:
      "List quote requests visible to this key. A client key sees the requests it filed; a provider key sees only requests it was invited to.",
    scope: "requests:read",
    inputSchema: {
      type: "object",
      properties: {
        status: str("Filter by request status."),
        limit: num("Maximum results, 1-50."),
      },
    },
    handler: (ctx, args) => listRequests(ctx, args),
  },
  {
    name: "create_request",
    description:
      "File a new quote request as the client who owns this key. Providers are notified separately by the fanout job.",
    scope: "requests:write",
    principal: "client",
    inputSchema: {
      type: "object",
      properties: {
        title: str("Short summary of the work needed."),
        description: str("Full description of the work."),
        categoryId: str("Service category id."),
        budgetMin: num("Lower bound of budget."),
        budgetMax: num("Upper bound of budget."),
        urgency: str("One of: low, normal, high, urgent."),
      },
      required: ["title", "description"],
    },
    handler: (ctx, args) => createRequest(ctx, args as never),
  },
  {
    name: "list_invitations",
    description: "List request invitations visible to this key, with their current status.",
    scope: "requests:read",
    inputSchema: {
      type: "object",
      properties: {
        status: str("Filter: sent, viewed, accepted, declined, referred, expired."),
        limit: num("Maximum results, 1-50."),
      },
    },
    handler: (ctx, args) => listInvitations(ctx, args),
  },
  {
    name: "respond_to_invitation",
    description:
      "Accept, decline, or refer a request invitation on behalf of the provider who owns this key. Referring records a chain back to this invitation.",
    scope: "requests:write",
    principal: "provider",
    inputSchema: {
      type: "object",
      properties: {
        invitationId: str("The invitation to respond to."),
        response: str("One of: accepted, declined, referred."),
        referToProviderId: str("Required when response is 'referred'."),
        note: str("Optional note carried with a referral."),
      },
      required: ["invitationId", "response"],
    },
    handler: (ctx, args) => respondToInvitation(ctx, args as never),
  },
  {
    name: "list_services",
    description: "List the service offerings this key can see.",
    scope: "services:read",
    inputSchema: {
      type: "object",
      properties: { limit: num("Maximum results, 1-50.") },
    },
    handler: (ctx, args) => listServices(ctx, args),
  },
  {
    name: "update_service",
    description: "Update pricing or description on one of this provider's service offerings.",
    scope: "services:write",
    principal: "provider",
    inputSchema: {
      type: "object",
      properties: {
        serviceId: str("The service offering to update."),
        hourlyRate: num("New hourly rate."),
        fixedPrice: num("New fixed price."),
        description: str("New description."),
      },
      required: ["serviceId"],
    },
    handler: (ctx, args) => updateService(ctx, args as never),
  },
];

/**
 * Only the tools this key can actually call.
 *
 * Listing a tool the key lacks the scope for would have an agent plan around a
 * capability it does not have, then fail mid-workflow. Discovery reflects
 * authorisation.
 */
function visibleTools(principal: ApiPrincipal): ToolDefinition[] {
  return TOOLS.filter((tool) => {
    if (!hasScope(principal, tool.scope)) return false;
    if (tool.principal && tool.principal !== principal.type) return false;
    return true;
  });
}

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

function rpcResult(id: string | number | null | undefined, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function rpcError(id: string | number | null | undefined, code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

Deno.serve(async (req) => {
  const corsHeaders = {
    ...getCorsHeaders(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, mcp-protocol-version",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "method_not_allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const admin = adminClient();
    const principal = await authenticateApiKey(req, admin);

    // Per key, not per IP — an agent fleet is many IPs behind one key.
    if (!serverRateLimit(`mcp:${principal.keyId}`, 240, 60_000)) {
      return new Response(
        JSON.stringify(rpcError(null, -32029, "Rate limited")),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({})) as JsonRpcRequest;
    const { id, method, params } = body;
    const ctx: HandlerContext = { admin, principal };

    const json = (payload: unknown, status = 200) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
      });

    switch (method) {
      case "initialize":
        return json(rpcResult(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: {
            name: `${SERVER_NAME}-${principal.brand}`,
            version: SERVER_VERSION,
          },
        }));

      case "notifications/initialized":
        return new Response(null, { status: 204, headers: corsHeaders });

      case "ping":
        return json(rpcResult(id, {}));

      case "tools/list":
        return json(rpcResult(id, {
          tools: visibleTools(principal).map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          })),
        }));

      case "tools/call": {
        const name = String(params?.name ?? "");
        const args = (params?.arguments ?? {}) as Record<string, unknown>;

        // Resolve against the visible set, not the full set. Looking up in TOOLS and
        // then checking the scope separately invites a future edit that forgets the
        // second step; an unauthorised tool is simply not found.
        const tool = visibleTools(principal).find((candidate) => candidate.name === name);
        if (!tool) return json(rpcError(id, -32601, `Unknown tool: ${name}`));

        try {
          const result = await tool.handler(ctx, args);
          return json(rpcResult(id, {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          }));
        } catch (toolError) {
          // A tool failure is reported inside the MCP envelope so the agent can react,
          // rather than as a transport error it cannot interpret. Internal details are
          // never included — the same reason api-v1 does not echo them.
          if (toolError instanceof ApiAuthError) throw toolError;
          console.error("[mcp] tool failed", name, toolError instanceof Error ? toolError.message : "unknown");
          return json(rpcResult(id, {
            isError: true,
            content: [{ type: "text", text: `Tool ${name} failed.` }],
          }));
        }
      }

      default:
        return json(rpcError(id, -32601, `Unknown method: ${method ?? "(none)"}`));
    }
  } catch (error) {
    return apiErrorResponse(error, corsHeaders);
  }
});
