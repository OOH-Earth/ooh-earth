import { createContext, useContext, useState, useCallback } from "react";
import LabSignupModal from "@/components/ooh/LabSignupModal";
import { useAuth } from "@/lib/AuthContext";

// Lab gate — lab pages are publicly viewable, but "create/act" actions
// (export, generate, mint) fire this gate. If the visitor isn't authed,
// the tactical signup modal appears. Returns true → proceed, false → blocked.
const LabGateContext = createContext(null);

export function LabGateProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("");

  const gate = useCallback(
    (actionLabel) => {
      if (isAuthenticated) return true;
      setAction(actionLabel);
      setOpen(true);
      return false;
    },
    [isAuthenticated]
  );

  return (
    <LabGateContext.Provider value={{ gate, isAuthenticated }}>
      {children}
      <LabSignupModal open={open} action={action} onClose={() => setOpen(false)} />
    </LabGateContext.Provider>
  );
}

export function useLabGate() {
  const ctx = useContext(LabGateContext);
  if (!ctx) throw new Error("useLabGate must be used within LabGateProvider");
  return ctx;
}