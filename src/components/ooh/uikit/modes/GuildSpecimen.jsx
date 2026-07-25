import { Users, ArrowRight } from "lucide-react";

const ROLES = [
  "Guild Convenor",
  "Training Facilitator",
  "Guild Logistics",
];

export default function GuildSpecimen() {
  return (
    <div className="guild relative overflow-hidden" style={{ background: "#13323F", minHeight: 320 }}>

      {/* Navy header band with yellow stripe bottom-border */}
      <div style={{ background: "#13323F", padding: "12px 16px", borderBottom: "4px solid #EDFF00" }}
        className="flex items-center justify-between">
        <span style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#EDFF00" }}>
          Meaning Transformation Guild
        </span>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(237,255,0,0.5)" }}>
          .guild
        </span>
      </div>

      {/* Yellow canvas section — manifesto */}
      <div style={{ background: "#EDFF00", padding: "20px 16px" }}>
        <p style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: "#13323F", maxWidth: "38ch" }}>
          We are dedicated to the{" "}
          <span style={{ color: "#FF5470", fontWeight: 700 }}>removal and detoxification of propaganda</span>
          {" "}on the streets of our communities — taking down malicious adverts and reinstalling them for public benefit.
        </p>

        {/* Role cards — yellow fill, navy text, Fiery Rose icon */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 16 }}>
          {ROLES.map((r) => (
            <div key={r} style={{ background: "#EDFF00", border: "1.5px solid #13323F", padding: "12px 10px 10px" }}>
              <Users size={16} style={{ color: "#FF5470" }} strokeWidth={1.5} />
              <p style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 700, fontSize: 11, lineHeight: 1.25, color: "#13323F", marginTop: 8, marginBottom: 10 }}>
                {r}
              </p>
              <button className="guild-btn-navy" style={{ fontSize: 8, padding: "5px 10px" }}>
                <span style={{ display: "inline-block", width: 8, height: 1, background: "#EDFF00" }} />
                Apply now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Navy section — CTAs + palette */}
      <div style={{ background: "#13323F", padding: "16px 16px 14px" }}>
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", color: "#F1F1F1", lineHeight: 1.1, marginBottom: 4 }}>
            #SHUTDOWNSHELL
          </h3>
          <p style={{ fontFamily: "Inter Tight, sans-serif", fontSize: 11, color: "rgba(241,241,241,0.65)", lineHeight: 1.5 }}>
            Subvertising posters — donate to print &amp; install.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className="guild-btn-outline" style={{ fontSize: 8 }}>
            Donate now <ArrowRight size={10} />
          </button>
          <button className="guild-btn-rose" style={{ fontSize: 8 }}>
            View posters
          </button>
        </div>

        {/* Palette swatches — exact brand colours */}
        <div style={{ display: "flex", gap: 12, paddingTop: 12, borderTop: "1px solid rgba(237,255,0,0.15)" }}>
          {[
            ["#13323F", "navy"],
            ["#EDFF00", "hiviz"],
            ["#FF5470", "rose"],
            ["#F1F1F1", "white"],
            ["#171D1A", "black"],
          ].map(([hex, name]) => (
            <span key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ width: 14, height: 14, background: hex, border: "1px solid rgba(237,255,0,0.25)", display: "block" }} />
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 7, textTransform: "uppercase", color: "rgba(241,241,241,0.5)", letterSpacing: "0.1em" }}>
                {name}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}