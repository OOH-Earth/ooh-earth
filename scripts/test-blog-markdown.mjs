import assert from 'node:assert/strict';
import { parseInlineMarkdown, sanitizeMarkdownHref } from '../src/lib/safeMarkdown.js';

const attributed = parseInlineMarkdown(
  '[Explore the transit map](https://oohearth.app/category/transit?utm_source=owned&utm_medium=content&utm_campaign=transit_evidence)',
);
assert.deepEqual(attributed, [
  { type: 'link', value: 'Explore the transit map', href: 'https://oohearth.app/category/transit?utm_source=owned&utm_medium=content&utm_campaign=transit_evidence' },
]);
assert.equal(sanitizeMarkdownHref('javascript:alert(1)'), null);
const unsafe = parseInlineMarkdown('[junk](javascript:alert(1))');
assert.equal(unsafe.some(token => token.type === 'link'), false);
assert.equal(unsafe.map(token => token.value).join('').includes('junk'), true);
assert.equal(sanitizeMarkdownHref('/map?utm_source=owned'), '/map?utm_source=owned');
assert.equal(sanitizeMarkdownHref('mailto:oohearth@proton.me'), 'mailto:oohearth@proton.me');
assert.equal(sanitizeMarkdownHref('http://example.com'), null);
assert.deepEqual(parseInlineMarkdown('ordinary BlogPost text'), [{ type: 'text', value: 'ordinary BlogPost text' }]);
assert.deepEqual(parseInlineMarkdown('**bold** and *emphasis*'), [
  { type: 'em', value: 'bold' },
  { type: 'text', value: ' and ' },
  { type: 'em', value: 'emphasis' },
]);
console.log('BLOG_MARKDOWN_REGRESSION_PASS');
