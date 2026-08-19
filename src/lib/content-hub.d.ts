declare module "*/content-hub.mjs" {
  export function renderContentHub(
    mount: HTMLElement | null,
    config: unknown,
    opts?: Record<string, unknown>,
  ): void;

  const contentHub: { renderContentHub: typeof renderContentHub };
  export default contentHub;
}
