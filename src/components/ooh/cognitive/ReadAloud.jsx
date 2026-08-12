import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useSoundscape from '@/hooks/useSoundscape';

// W3C-style read-aloud: reads the page's main textual content (heading + body)
// on each route change when the read-aloud toggle is on. Independent of the
// ambient soundscape toggle.
function collectPageText() {
  const root = document.querySelector('main') || document.body;
  const parts = [];
  const h1 = root.querySelector('h1');
  if (h1) parts.push(h1.textContent.trim());
  const nodes = root.querySelectorAll('h2, p, li');
  let chars = 0;
  for (const n of nodes) {
    const t = (n.textContent || '').trim();
    if (!t || t.length < 2) continue;
    parts.push(t);
    chars += t.length;
    if (chars > 320) break;
  }
  return parts.join('. ').slice(0, 600);
}

export default function ReadAloud() {
  const { speakForced, readAloud } = useSoundscape();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!readAloud) return;
    const id = setTimeout(() => {
      const text = collectPageText();
      if (text) speakForced(text);
    }, 700);
    return () => clearTimeout(id);
  }, [pathname, readAloud, speakForced]);

  return null;
}
