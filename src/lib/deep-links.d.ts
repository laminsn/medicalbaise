declare module "*/deep-links.mjs" {
  export function detectContext(matrix: unknown, ua?: string): unknown;
  export function withTracking(url: string, params: Record<string, unknown>): string;
  export function buildAndroidIntent(webUrl: string, pkg: string): string;
  export function resolveDeepLink(
    platformKey: string,
    handleEntry: unknown,
    matrix: unknown,
    opts?: Record<string, unknown>,
  ): unknown;
  export function attemptNative(
    resolved: unknown,
    options?: { timeout?: number; navigate?: (url: string) => void },
  ): unknown;
  export function escapeInAppBrowser(
    url: string,
    matrix: unknown,
    opts?: Record<string, unknown>,
  ): unknown;
}
