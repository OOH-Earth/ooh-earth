import { test, expect } from '@playwright/test';

type Sprite = { data: number[]; width: number; height: number };

function solidBillboardFacePixels(sprite: Sprite) {
  let count = 0;
  // The billboard glyph is drawn in the center of the 64px sprite. This
  // interior excludes its outline, yellow header, and support legs.
  for (let y = 29; y <= 32; y += 1) {
    for (let x = 29; x <= 35; x += 1) {
      const i = (y * sprite.width + x) * 4;
      if (
        sprite.data[i + 3] > 220 &&
        sprite.data[i] < 24 &&
        sprite.data[i + 1] < 24 &&
        sprite.data[i + 2] < 24
      ) {
        count += 1;
      }
    }
  }
  return count;
}

test.describe('Home Globe marker geometry', () => {
  for (const viewport of [
    { width: 387, height: 805 },
    { width: 844, height: 390 },
    { width: 915, height: 412 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    test(`billboard marker stays within its intended geometry at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      const sprites: Sprite[] = [];
      await page.addInitScript(() => {
        const original = CanvasRenderingContext2D.prototype.getImageData;
        CanvasRenderingContext2D.prototype.getImageData = function (...args) {
          const image = original.apply(this, args as Parameters<typeof original>);
          if (this.canvas.width === 64 && this.canvas.height === 64) {
            (window as typeof window & { __homeGlobeSprites?: Sprite[] }).__homeGlobeSprites ??= [];
            (window as typeof window & { __homeGlobeSprites: Sprite[] }).__homeGlobeSprites.push({
              data: Array.from(image.data),
              width: image.width,
              height: image.height,
            });
          }
          return image;
        };
      });

      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.locator('[data-tour="globe"]').scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);

      const captured = await page.evaluate(
        () =>
          (window as typeof window & { __homeGlobeSprites?: Sprite[] }).__homeGlobeSprites ?? [],
      );
      sprites.push(...captured);

      expect(sprites.length).toBeGreaterThanOrEqual(2);
      expect(solidBillboardFacePixels(sprites[0])).toBeLessThanOrEqual(6);
      await expect(page.locator('[data-tour="globe"] .maplibregl-canvas')).toBeVisible();
      await page.screenshot({
        path: `test-results/home-globe-marker-artifact-${viewport.width}x${viewport.height}.png`,
      });
    });
  }
});
