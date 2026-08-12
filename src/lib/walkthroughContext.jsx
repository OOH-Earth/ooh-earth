// @ts-nocheck -- intentionally excluded from typecheck (jsconfig.json), see TECHNICAL_DEBT_REGISTER.md
import { createContext, useContext, useState, useRef, useCallback } from 'react';
import Walkthrough from '@/components/ooh/Walkthrough';

const WalkthroughCtx = createContext(null);

export function useWalkthrough() {
  const ctx = useContext(WalkthroughCtx);
  if (!ctx) {
    return { startTour() {}, registerSteps() {}, closeTour() {} };
  }
  return ctx;
}

export function WalkthroughProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState([]);
  const stepsRef = useRef([]);

  const registerSteps = useCallback((s) => {
    stepsRef.current = s || [];
  }, []);

  const startTour = useCallback(() => {
    setSteps(stepsRef.current);
    setOpen(true);
  }, []);

  const closeTour = useCallback(() => setOpen(false), []);

  return (
    <WalkthroughCtx.Provider value={{ registerSteps, startTour, closeTour }}>
      {children}
      <Walkthrough open={open} onClose={closeTour} steps={steps} />
    </WalkthroughCtx.Provider>
  );
}
