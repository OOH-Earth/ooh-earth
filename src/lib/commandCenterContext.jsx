import { createContext, useContext, useState, useCallback } from "react";
import CommandCenter from "@/components/ooh/CommandCenter";

const CommandCenterCtx = createContext(null);

export function useCommandCenter() {
  const ctx = useContext(CommandCenterCtx);
  return ctx ?? { openCommand: () => {}, closeCommand: () => {} };
}

export function CommandCenterProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openCommand = useCallback(() => setOpen(true), []);
  const closeCommand = useCallback(() => setOpen(false), []);
  return (
    <CommandCenterCtx.Provider value={{ openCommand, closeCommand }}>
      {children}
      <CommandCenter open={open} onClose={closeCommand} />
    </CommandCenterCtx.Provider>
  );
}