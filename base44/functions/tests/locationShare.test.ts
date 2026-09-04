import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { handleLocationShare } from '../locationShare/handler.ts';

const request = (path: string) => new Request(`https://oohearth.app${path}`);
const deps = (location: any, photos: any[] = []) => ({
  createClientFromRequest: () => ({
    asServiceRole: {
      entities: {
        Location: { filter: async () => (location ? [location] : []) },
        LocationPhoto: { filter: async () => photos },
      },
    },
  }),
});

Deno.test(
  'locationShare emits crawler-readable safe metadata for verified public locations',
  async () => {
    const response = await handleLocationShare(
      request('/api/apps/x/functions/locationShare?id=loc1'),
      deps({ id: 'loc1', title: 'Billboard <Central>', type: 'billboard', status: 'verified' }, [
        {
          url: 'https://media.base44.com/images/public/photo.jpg',
          status: 'verified',
          display_order: 0,
        },
      ]),
    );
    const body = await response.text();
    assertEquals(response.status, 200);
    assertStringIncludes(body, 'og:title');
    assertStringIncludes(body, 'Billboard &lt;Central&gt; | OOH Earth');
    assertStringIncludes(body, 'og:type');
    assertStringIncludes(body, 'https://media.base44.com/images/public/photo.jpg');
    assert(!body.includes('created_by'));
    assert(!body.includes('notes'));
  },
);

Deno.test('locationShare hides non-public locations and invalid ids', async () => {
  const rejected = await handleLocationShare(
    request('/locationShare?id=rejected'),
    deps({ status: 'rejected' }),
  );
  assertEquals(rejected.status, 404);
  const invalid = await handleLocationShare(request('/locationShare?id=<script>'), deps(null));
  assertEquals(invalid.status, 404);
  assertStringIncludes(await invalid.text(), 'Location not found');
  const punctuation = await handleLocationShare(
    request('/locationShare?id=not-a-real-location'),
    deps(null),
  );
  assertEquals(punctuation.status, 404);
});

Deno.test('locationShare uses the fallback for unsafe image URLs', async () => {
  const response = await handleLocationShare(
    request('/locationShare?id=loc2'),
    deps({
      id: 'loc-2',
      title: 'Wall',
      type: 'mural',
      status: 'verified',
      image_url: 'javascript:alert(1)',
    }),
  );
  const body = await response.text();
  assertEquals(response.status, 200);
  assert(!body.includes('javascript:'));
  assertStringIncludes(body, 'media.base44.com/images/public/6a62213cff3ccbca88c04ff5');
});
