import { Lock } from "lucide-react";

// Reusable "secure payments" trust strip — wallet + card-network marks on white
// tiles, plus a "Secured by <provider> · PCI-DSS" lock line. Inline SVG only,
// no external assets. Used on every fiat transactor surface.

function Tile({ label, children }) {
  return (
    <span
      className="inline-flex h-6 items-center justify-center rounded-[3px] bg-white px-1.5"
      aria-label={label}
      title={label}
    >
      {children}
    </span>
  );
}

const AppleMark = (
  <span className="flex items-center gap-0.5">
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="#000" aria-hidden="true">
      <path d="M17.05 12.04c-.03-2.7 2.2-4 2.3-4.06-1.26-1.84-3.2-2.09-3.9-2.12-1.66-.17-3.24.98-4.08.98-.84 0-2.14-.96-3.52-.93-1.81.03-3.48 1.05-4.41 2.68-1.88 3.26-.48 8.08 1.35 10.72.9 1.29 1.97 2.74 3.38 2.69 1.36-.06 1.87-.88 3.51-.88 1.64 0 2.1.88 3.54.85 1.46-.03 2.39-1.32 3.29-2.62 1.03-1.5 1.46-2.96 1.48-3.04-.03-.01-2.84-1.09-2.87-4.33-.03-2.7 2.2-4 2.31-4.07-1.26-1.85-3.22-2.1-3.91-2.12zM14.6 4.59c.74-.9 1.24-2.15 1.1-3.4-1.06.04-2.36.71-3.13 1.61-.69.79-1.29 2.06-1.13 3.28 1.18.09 2.4-.6 3.16-1.49z" />
    </svg>
    <span className="text-[10px] font-bold text-black" style={{ fontFamily: "-apple-system, Inter, sans-serif" }}>Pay</span>
  </span>
);

const GoogleMark = (
  <span className="flex items-center gap-0.5">
    <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
    <span className="text-[10px] font-medium text-[#5F6368]">Pay</span>
  </span>
);

const VisaMark = (
  <span className="text-[11px] font-bold italic text-[#1A1F71]" style={{ letterSpacing: "0.04em", fontFamily: "Inter, sans-serif" }}>VISA</span>
);

const MastercardMark = (
  <svg viewBox="0 0 36 24" className="h-3.5 w-5" aria-hidden="true">
    <circle cx="14" cy="12" r="9" fill="#EB001B" />
    <circle cx="22" cy="12" r="9" fill="#F79E1B" style={{ mixBlendMode: "multiply" }} />
  </svg>
);

const AmexMark = (
  <span className="rounded-[2px] bg-[#1F72CD] px-1 text-[8px] font-bold tracking-[0.08em] text-white">AMEX</span>
);

const PayPalMark = (
  <span className="text-[10px] font-bold italic" style={{ letterSpacing: "-0.01em", fontFamily: "Inter, sans-serif" }}>
    <span style={{ color: "#003087" }}>Pay</span>
    <span style={{ color: "#009cde" }}>Pal</span>
  </span>
);

const MARKS = {
  applepay: { label: "Apple Pay", node: AppleMark },
  googlepay: { label: "Google Pay", node: GoogleMark },
  visa: { label: "Visa", node: VisaMark },
  mastercard: { label: "Mastercard", node: MastercardMark },
  amex: { label: "American Express", node: AmexMark },
  paypal: { label: "PayPal", node: PayPalMark },
};

export default function PaymentBadges({
  methods = ["applepay", "googlepay", "visa", "mastercard", "amex"],
  securedBy = "Stripe",
  className = "",
}) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1.5">
        {methods.map((m) => {
          const mark = MARKS[m];
          if (!mark) return null;
          return (
            <Tile key={m} label={mark.label}>
              {mark.node}
            </Tile>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-dim">
        <Lock className="h-3 w-3 text-ozone" />
        Secured by {securedBy} · PCI-DSS · 256-bit
      </div>
    </div>
  );
}