// Status-tag pill system — categorises the advertising / subvertising
// surface. Colours follow the UI-kit spec: red (corp), orange (abandoned /
// gambling), blue (public / data), purple (banks / data piracy).
export const STATUS_TAGS = {
  corp: { label: "Corp.", color: "#FF0000" },
  abd: { label: "Abd.", color: "#FF8000" },
  public: { label: "Public", color: "#0080FF" },
  data: { label: "Data", color: "#0080FF" },
  banks: { label: "Banks", color: "#800080" },
  gambling: { label: "Gambling", color: "#FF8000" },
  corporate: { label: "Corporate", color: "#FF0000" },
  "public-access": { label: "Public Access", color: "#0080FF" },
  "data-piracy": { label: "Data Piracy", color: "#800080" },
};

export default function StatusTag({ tag, active = false, onClick = () => {} }) {
  const t = STATUS_TAGS[tag] || { label: tag, color: "#666666" };
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] transition-colors"
      style={{
        borderColor: t.color,
        color: active ? "#000" : t.color,
        background: active ? t.color : "rgba(0,0,0,0.45)",
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.color }} />
      {t.label}
    </button>
  );
}