import { assertEquals } from 'jsr:@std/assert@1';
import { decode } from '../fieldNews/text.ts';

Deno.test('decodes numeric and named punctuation to text', () => {
  assertEquals(decode('Ads &#8211; a ban &#x2014; why'), 'Ads – a ban — why');
  assertEquals(decode('Paris &ndash; Lyon &amp; Nice &hellip;'), 'Paris – Lyon & Nice …');
  assertEquals(decode('It&#8217;s &#39;fine&#39; &rsquo;'), "It’s 'fine' ’");
  assertEquals(decode('<![CDATA[Bills &amp; boards]]>'), 'Bills & boards');
});

Deno.test('unknown or invalid entities are left as literal text', () => {
  assertEquals(
    decode('&bogus; &#0; &#55296; &#99999999; &#x110000;'),
    '&bogus; &#0; &#55296; &#99999999; &#x110000;',
  );
});

Deno.test('no double-decode cascade', () => {
  assertEquals(decode('&amp;lt;b&amp;gt;'), '&lt;b&gt;');
  assertEquals(decode('&amp;#8211;'), '&#8211;');
});

Deno.test('markup is removed, including entity-encoded markup', () => {
  assertEquals(decode('<b>Bold</b> title'), 'Bold title');
  assertEquals(decode('&#60;script&#62;alert(1)&#60;/script&#62;'), 'alert(1)');
  assertEquals(decode('&lt;img src=x onerror=alert(1)&gt;Hi'), 'Hi');
  for (const evil of [
    '<scr<script>ipt>x</scr</script>ipt>',
    '&lt;scr&lt;script&gt;ipt&gt;x',
    '<<b>img src=x onerror=1>',
  ])
    assertEquals(decode(evil).includes('<'), false);
});
