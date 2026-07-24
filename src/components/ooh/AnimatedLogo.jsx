import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrandMark from "@/components/ooh/BrandMark";

const FONTS = [
  { family: '"Orbitron", sans-serif', weight: 900 },
  { family: '"Audiowide", sans-serif', weight: 400 },
  { family: '"Chakra Petch", sans-serif', weight: 700 },
  { family: '"Monoton", sans-serif', weight: 400 },
  { family: '"Syncopate", sans-serif', weight: 700 },
];

export default function AnimatedLogo({ className = "", spinning = false }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setI((x) => (x + 1) % FONTS.length), 2400);
    return () => clearTimeout(t);
  }, [i]);

  const f = FONTS[i];
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <BrandMark className="h-6 w-6" spinning={spinning} />
      <span className="relative inline-flex items-baseline overflow-hidden" style={{ minWidth: "5.2em" }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="whitespace-nowrap text-sm tracking-tight text-silver transition-colors group-hover:text-ozone"
            style={{ fontFamily: f.family, fontWeight: f.weight }}
          >
            ooh<span className="text-ozone">.</span>earth
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}