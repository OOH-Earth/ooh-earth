import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

// Pull-to-refresh wrapper for a scrollable container.
// <PullToRefresh onRefresh={asyncFn}>…scrollable children…</PullToRefresh>
export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const scrollRef = useRef(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const triggered = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const PULL_THRESHOLD = 70;
  const MAX_PULL = 100;

  const onTouchStart = useCallback((e) => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
    triggered.current = false;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    const damped = Math.min(delta * 0.5, MAX_PULL);
    setPull(damped);
    if (damped > PULL_THRESHOLD) triggered.current = true;
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    const shouldRefresh = triggered.current;
    setPull(0);
    if (shouldRefresh && onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch {}
      setRefreshing(false);
    }
  }, [onRefresh]);

  const progress = refreshing ? 1 : Math.min(pull / PULL_THRESHOLD, 1);

  return (
    <div
      ref={scrollRef}
      className={`relative overflow-y-auto ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-center justify-center"
        animate={{ y: refreshing ? 40 : pull }}
        transition={refreshing ? { duration: 0.3 } : { duration: 0 }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center border border-ozone/50 bg-void/80"
          style={{ opacity: refreshing ? 1 : progress }}
        >
          <RefreshCw
            className="h-4 w-4 text-ozone"
            style={{
              transform: `rotate(${progress * 360}deg)`,
              animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
            }}
          />
        </div>
      </motion.div>
      <motion.div
        animate={{ y: refreshing ? 40 : pull }}
        transition={refreshing ? { duration: 0.3 } : { duration: 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
