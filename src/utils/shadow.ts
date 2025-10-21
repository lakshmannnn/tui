import type { Page, ElementHandle } from '@playwright/test';

/**
 * Query an element inside nested shadow roots.
 * - hosts: array of host selectors in order (outer → inner)
 * - selector: final CSS selector inside the last shadow root
 * Returns an ElementHandle or null.
 */
export async function queryNestedShadow(
  page: Page,
  hosts: string[],
  selector: string,
  waitMs = 3000
): Promise<ElementHandle<HTMLElement> | null> {
  // wait for hosts to appear
  for (const host of hosts) {
    await page.waitForSelector(host, { timeout: waitMs }).catch(() => {});
  }

  const handle = await page.evaluateHandle(
    ({ hosts, selector }: { hosts: string[]; selector: string }) => {
      let root: ParentNode | ShadowRoot = document;
      for (const hostSel of hosts) {
        const host = root.querySelector(hostSel) as Element | null;
        if (!host) return null;
        // @ts-ignore access shadowRoot
        const sr = (host as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
        if (!sr) return null;
        root = sr;
      }
      return root.querySelector(selector);
    },
    { hosts, selector }
  );

  const el = handle.asElement() as ElementHandle<HTMLElement> | null;
  if (!el) {
    await handle.dispose();
    return null;
  }
  return el;
}