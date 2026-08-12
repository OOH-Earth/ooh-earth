// Real browser/extension globals this app reads defensively (feature checks
// like `if (window.ethereum) ...`) that aren't part of TS's default `dom`
// lib. Declaring them here is documentation, not new capability — every
// read site already guards for the property being absent.
interface Window {
  ethereum?: any;
  solana?: any;
  phantom?: any;
  webkitAudioContext?: typeof AudioContext;
  BarcodeDetector?: any;
  storage?: {
    get(key: string): Promise<{ value: any } | null>;
    set(key: string, value: any): Promise<void>;
  };
}
