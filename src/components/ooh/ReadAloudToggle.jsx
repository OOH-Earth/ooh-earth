import { BookOpen } from 'lucide-react';
import useSoundscape from '@/hooks/useSoundscape';

// Screen-reader-style toggle — reads page text aloud (W3C web-standards mode).
export default function ReadAloudToggle() {
  const { readAloud, toggleReadAloud, speechSupported } = useSoundscape();
  if (!speechSupported) return null;
  return (
    <button
      onClick={toggleReadAloud}
      aria-label={readAloud ? 'Stop reading page aloud' : 'Read page aloud'}
      title={readAloud ? 'Read aloud on' : 'Read aloud off'}
      className={`flex h-8 w-8 items-center justify-center border border-slate2 transition-colors hover:border-ozone hover:text-ozone ${
        readAloud ? 'border-ozone text-ozone' : 'text-darkgray'
      }`}
    >
      <BookOpen className="h-3.5 w-3.5" />
    </button>
  );
}
