import { useEffect, useState } from 'react';
import { Play, X } from 'lucide-react';
import useSoundscape from '@/hooks/useSoundscape';

// Click-to-play facade — no autoplay. The YouTube iframe only mounts after the
// viewer presses play, so the page stays a calm magazine until they opt in.
export default function TvPlayer({ program, onClose }) {
  const [playing, setPlaying] = useState(false);
  const { setTvFocus } = useSoundscape();

  // reset to facade whenever the selected program changes
  useEffect(() => {
    setPlaying(false);
    setTvFocus(false);
  }, [program?.id, setTvFocus]);

  const start = () => {
    setPlaying(true);
    setTvFocus(true);
  };

  if (!program) return null;

  return (
    <div
      className="relative w-full overflow-hidden border border-slate2 bg-black"
      style={{ aspectRatio: '16 / 9' }}
    >
      {playing ? (
        <iframe
          key={program.id}
          src={`https://www.youtube.com/embed/${program.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={program.title}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          onClick={start}
          className="group absolute inset-0"
          aria-label={`Play ${program.title}`}
        >
          <img
            src={program.thumb}
            alt=""
            className="h-full w-full object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-80"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ozone bg-void/50 backdrop-blur-sm transition-all duration-200 group-hover:scale-110 group-hover:bg-ozone">
              <Play className="h-6 w-6 translate-x-0.5 fill-ozone text-ozone group-hover:fill-void group-hover:text-void" />
            </span>
          </span>
        </button>
      )}

      {onClose && (
        <button
          onClick={() => {
            setTvFocus(false);
            onClose();
          }}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center border border-slate2 bg-void/70 text-silver backdrop-blur hover:border-flare hover:text-flare"
          aria-label="Close player"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
