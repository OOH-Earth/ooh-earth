import { ArrowRight } from "lucide-react";

export default function GuildSpecimen() {
  return (
    <div className="guild relative overflow-hidden" style={{ background: "#002554", minHeight: 320 }}>

      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderBottom: "1px solid rgba(237,255,0,0.15)" }}>
        <span style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#EDFF00" }}>
          Meaning Transformation Guild
        </span>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#B2B2B2" }}>
          .guild
        </span>
      </div>

      {/* Hero — navy bg, white text, yellow highlight (exact meaningguild.org treatment) */}
      <div style={{ padding: "24px 16px 20px" }}>
        <h3 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em", lineHeight: 1.15, color: "#FFFFFF" }}>
          We are a{" "}
          <span style={{ color: "#EDFF00" }}>public service organisation</span>{" "}
          following the Brandalism manifesto &amp; Reithian traditions.
        </h3>
        <p style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 400, fontSize: 11, lineHeight: 1.65, color: "#B2B2B2", marginTop: 14, maxWidth: "42ch" }}>
          We are dedicated to the removal and detoxification of propaganda on the streets of our communities that encourages needless consumption and increases waste.
        </p>
      </div>

      {/* White-smoke mission card — navy text on light bg */}
      <div style={{ background: "#F1F1F1", padding: "16px 16px 14px" }}>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: "#002554", opacity: 0.6 }}>
          Our Mission
        </span>
        <p style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 700, fontSize: 13, lineHeight: 1.45, color: "#002554", marginTop: 8 }}>
          We take down malicious adverts, correct or remove their errors and reinstall them for{" "}
          <span style={{ color: "#002554", textDecoration: "underline", textDecorationColor: "#EDFF00", textUnderlineOffset: 3, fontWeight: 800 }}>community benefit</span>.
        </p>

        {/* Role cards — navy fill, yellow "Apply now" */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
          {["Convenor", "Facilitator", "Logistics"].map((r) => (
            <div key={r} style={{ background: "#002554", padding: "10px 8px" }}>
              <p style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 700, fontSize: 10, color: "#FFFFFF", lineHeight: 1.2, marginBottom: 8 }}>
                Guild {r}
              </p>
              <button className="guild-btn-navy" style={{ fontSize: 8, padding: "5px 10px" }}>
                Apply now <ArrowRight size={9} />
              </button>
            </div>
          ))}
        </div>

        {/* Yellow CTA */}
        <div style={{ marginTop: 14 }}>
          <button className="guild-btn">Donate now <ArrowRight size={11} /></button>
        </div>
      </div>

      {/* Palette — exact live-site colours */}
      <div style={{ background: "#002554", padding: "10px 16px", display: "flex", gap: 12 }}>
        {[
          ["#002554", "navy"],
          ["#EDFF00", "yellow"],
          ["#FFFFFF", "white"],
          ["#F1F1F1", "smoke"],
          ["#B2B2B2", "gray"],
        ].map(([hex, name]) => (
          <span key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ width: 12, height: 12, background: hex, border: "1px solid rgba(255,255,255,0.2)", display: "block" }} />
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 6, textTransform: "uppercase", color: "#B2B2B2", letterSpacing: "0.1em" }}>
              {name}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}