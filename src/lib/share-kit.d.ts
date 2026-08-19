/**
 * Types for the shared, untyped `share-kit.mjs`.
 *
 * The module is plain ESM because it is consumed by three different surface
 * classes — static generators, a script-src IIFE, and React apps — and only
 * this one is TypeScript. The canonical source lives in
 * BUSINESSES/empire-shared/share-kit/ and is synced into each hub by
 * BUSINESSES/empire-shared/deep-links/sync-to-hubs.sh. Do not edit either copy
 * by hand; edit the canonical source and re-run the sync.
 */
declare module "*/share-kit.mjs" {
  export interface ShareContext {
    url: string;
    title: string;
    promise: string;
    slug: string;
    lang: string;
  }

  export interface ShareTarget {
    key: string;
    label: string;
    short: string;
    done: string | null;
    icon: string;
    /** "link" renders an <a>; "copy" and "native" render a <button>. */
    action: "link" | "copy" | "native";
    newTab: boolean;
    url: string;
    href: string;
    /** True when the docked bar has no room for it. The vertical rail ignores this. */
    dockedHidden?: boolean;
  }

  export interface BuildOptions {
    env?: { navigator?: Navigator };
    isMobile?: boolean;
    sourceParam?: string;
    /** Docked-bar button budget. Default 7. */
    maxDocked?: number;
    /** Keys that always survive the cap. Default ["copy", "native"]. */
    pinned?: string[];
  }

  export interface MountOptions extends BuildOptions {
    root?: HTMLElement | null;
    context?: ShareContext;
    targets?: ShareTarget[];
    heading?: string;
    revealAt?: number;
    footer?: Element | null;
    footerSelector?: string;
    obstacleSelector?: string;
    consentSelector?: string;
    beaconUrl?: string;
    copyFailed?: string;
    mountTo?: HTMLElement;
    /** Per-hub palette, applied inline so it beats the runtime-injected stylesheet.
     *  Keys may be bare (`accent`) or full (`--ek-accent`). */
    tokens?: Record<string, string>;
  }

  export function resolveContext(
    doc: Document | null,
    overrides?: Partial<ShareContext>,
  ): ShareContext;

  export function buildShareTargets(
    ctx: ShareContext,
    matrix: unknown,
    opts?: BuildOptions,
  ): ShareTarget[];

  export function withSource(url: string, key: string, param?: string): string;
  export function normaliseLang(lang?: string): string;
  export function capabilityAvailable(requires: string | undefined, env?: unknown): boolean;
  export function renderRailHTML(targets: ShareTarget[], opts?: MountOptions): string;
  /** Wires behaviour onto already-rendered markup. Returns a cleanup function. */
  export function mountShareRail(options?: MountOptions): () => void;
  export function autoMount(matrix: unknown, options?: MountOptions): () => void;
}
