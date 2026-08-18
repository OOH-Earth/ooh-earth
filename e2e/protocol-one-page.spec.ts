import { test, expect } from '@playwright/test';

// Protocol One is a thin, static storytelling layer over the already-proven
// product loop (capture -> identify -> connect -> discover -> contribute ->
// proof) -- not a new feature, not a replacement for the app. It's a public
// asset (public/protocol-one.html), served at the app's own origin so it
// deploys as part of the real site build, with real screenshots and real
// links into the running application. This test verifies the raw HTML a
// visitor (or a crawler) actually receives -- structure, screenshot
// references, and outbound links -- the same no-JS-execution approach
// e2e/route-metadata.spec.ts uses for crawler-visible content.

test.describe('Protocol One — static product-story page', () => {
  test('serves all six steps with real screenshots and links into the real app', async ({
    request,
    baseURL,
  }) => {
    const res = await request.get(`${baseURL}/protocol-one.html`);
    expect(res.ok()).toBeTruthy();
    const body = await res.text();

    expect(body).toContain('<title>Protocol One — OOH Earth</title>');

    const steps = [
      { num: '01 · Capture', img: '01_capture.png', href: '/report' },
      { num: '02 · Identify', img: '02_identify.png', href: '/report' },
      { num: '03 · Connect', img: '03_connect.png', href: '/map' },
      { num: '04 · Discover', img: '04_discover.png', href: '/map' },
      { num: '05 · Contribute', img: '05_contribute.png', href: '/map' },
      { num: '06 · Proof', img: '06_proof.png', href: '/operative' },
    ];

    for (const step of steps) {
      expect(body).toContain(step.num);
      expect(body).toContain(`/protocol-one/screenshots/${step.img}`);
      expect(body).toContain(`href="${step.href}"`);
    }

    // Every referenced screenshot must actually exist and be servable.
    for (const step of steps) {
      const imgRes = await request.get(`${baseURL}/protocol-one/screenshots/${step.img}`);
      expect(imgRes.ok(), `screenshot ${step.img} should exist`).toBeTruthy();
      expect(imgRes.headers()['content-type']).toContain('image');
    }
  });
});
