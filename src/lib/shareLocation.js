const CANONICAL_ORIGIN = 'https://oohearth.app';
const PRODUCTION_APP_ID = '6a62213cff3ccbca88c04ff5';

export function canonicalLocationUrl(id) {
  return new URL(`/location/${encodeURIComponent(String(id))}`, CANONICAL_ORIGIN).toString();
}

export function shareLocationUrl(id) {
  const query = new URLSearchParams({ id: String(id) });
  return `${CANONICAL_ORIGIN}/api/apps/${PRODUCTION_APP_ID}/functions/locationShare?${query}`;
}

async function copyText(text, navigatorObject = globalThis.navigator) {
  if (navigatorObject?.clipboard?.writeText) {
    await navigatorObject.clipboard.writeText(text);
    return;
  }

  if (typeof document === 'undefined') throw new Error('Copy unavailable');
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('Copy unavailable');
}

export async function shareLocation(
  { id, title, address = '' },
  navigatorObject = globalThis.navigator,
) {
  const url = canonicalLocationUrl(id);
  const shareUrl = shareLocationUrl(id);
  const shareData = {
    title: title || 'OOH Earth location',
    text: [title, address].filter(Boolean).join(' — '),
    url: shareUrl,
  };

  if (typeof navigatorObject?.share === 'function') {
    try {
      await navigatorObject.share(shareData);
      return { method: 'native', url: shareUrl, canonicalUrl: url };
    } catch (error) {
      if (error?.name === 'AbortError')
        return { method: 'cancelled', url: shareUrl, canonicalUrl: url };
      throw error;
    }
  }

  await copyText(shareUrl, navigatorObject);
  return { method: 'copy', url: shareUrl, canonicalUrl: url };
}
