const SAFE_SCHEMES = new Set(['https:', 'mailto:']);

export const sanitizeMarkdownHref = (raw) => {
  const href = String(raw || '').trim();
  if (!href) return null;
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  try {
    const parsed = new URL(href);
    return SAFE_SCHEMES.has(parsed.protocol) ? href : null;
  } catch {
    return null;
  }
};

export const parseInlineMarkdown = (text) => {
  const input = String(text || '');
  const tokens = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_/g;
  let last = 0;
  let match;
  while ((match = pattern.exec(input))) {
    if (match.index > last) tokens.push({ type: 'text', value: input.slice(last, match.index) });
    if (match[1]) {
      const href = sanitizeMarkdownHref(match[2]);
      tokens.push(href ? { type: 'link', value: match[1], href } : { type: 'text', value: match[1] });
    } else {
      tokens.push({ type: 'em', value: match[3] || match[4] || match[5] || match[6] });
    }
    last = pattern.lastIndex;
  }
  if (last < input.length) tokens.push({ type: 'text', value: input.slice(last) });
  return tokens.length ? tokens : [{ type: 'text', value: input }];
};
