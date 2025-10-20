import type { BrowserContext } from '@playwright/test';

/**
 * Apply minimal anti-bot scripts to a BrowserContext.
 * The function passed to addInitScript runs inside the browser,
 * so we cast window as any there to avoid TypeScript errors.
 */
export async function applyAntiBotScripts(context: BrowserContext) {
  await context.addInitScript(() => {
    // Minimal, low-risk overrides
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-GB', 'en'] });
    try { delete (window as any).chrome; } catch (e) { /* ignore */ }
  });
}