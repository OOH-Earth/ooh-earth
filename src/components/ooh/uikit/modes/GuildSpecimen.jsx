import { Download, ArrowRight } from "lucide-react";

export default function GuildSpecimen() {
  return (
    <div className="guild relative overflow-hidden" style={{ background: "#EDFF00", minHeight: 320 }}>

      {/* Fiery Rose decorative circle — top right */}
      <div style={{
        position: "absolute", top: -30, right: -30, width: 100, height: 100,
        background: "#FF5470", borderRadius: "50%", zIndex: 0
      }} />

      {/* Header row */}
      <div className="relative z-10 flex items-center justify-between" style={{ padding: "12px 16px" }}>
        <div style={{ background: "#13323F", borderRadius: 4, padding: "4px 8px" }}>
          <span style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F1F1F1" }}>
            MTG
          </span>
        </div>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#13323F" }}>
          Service Introduction · 2022
        </span>
      </div>

      {/* Hero — navy heading with rose underline, navy body */}
      <div className="relative z-10" style={{ padding: "8px 16px 20px" }}>
        <h3 style={{
          fontFamily: "Inter Tight, sans-serif", fontWeight: 800, fontSize: 22,
          letterSpacing: "-0.02em", lineHeight: 1.05, color: "#13323F",
          borderBottom: "3px solid #FF5470", display: "inline-block", paddingBottom: 2, marginBottom: 12
        }}>
          Type.
        </h3>
        <p style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 400, fontSize: 12, lineHeight: 1.65, color: "#13323F", maxWidth: "40ch" }}>
          We share our skills, ideas and experiences in transforming toxic material and installing the transformation so that we learn from each other and spread the{" "}
          <span style={{ color: "#FF5470", fontWeight: 700 }}>guild's work</span>.
        </p>

        {/* Divider + alternatives label */}
        <div style={{ borderTop: "1px solid #13323F", marginTop: 16, paddingTop: 10 }}>
          <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: "#13323F", opacity: 0.7 }}>
            Acceptable Alternatives
          </span>
          <p style={{ fontFamily: "Inter Tight, sans-serif", fontSize: 10, lineHeight: 1.5, color: "#13323F", marginTop: 6, opacity: 0.8 }}>
            Inter should be used for every brand execution. System default sans-serif: Helvetica and Arial.
          </p>
        </div>
      </div>

      {/* DOWNLOAD button — yellow fill, navy border, rose offset shadow */}
      <div className="relative z-10 flex items-center gap-3" style={{ padding: "0 16px 16px" }}>
        <button className="guild-btn">
          <Download size={12} /> Download
        </button>
        <button className="guild-btn-navy">
          Apply now <ArrowRight size={11} />
        </button>
      </div>

      {/* Navy footer band */}
      <div style={{ background: "#13323F", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 700, fontSize: 9, color: "#FF5470" }}>
          meaningtransformationguild.org
        </span>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 8, color: "rgba(241,241,241,0.5)" }}>02</span>
      </div>

      {/* Palette swatches */}
      <div style={{ background: "#13323F", padding: "0 16px 12px", display: "flex", gap: 12 }}>
        {[
          ["#EDFF00", "hiviz"],
          ["#13323F", "navy"],
          ["#FF5470", "rose"],
          ["#F1F1F1", "white"],
        ].map(([hex, name]) => (
          <span key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ width: 12, height: 12, background: hex, border: "1px solid rgba(241,241,241,0.2)", display: "block" }} />
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 6, textTransform: "uppercase", color: "rgba(241,241,241,0.5)", letterSpacing: "0.1em" }}>
              {name}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}