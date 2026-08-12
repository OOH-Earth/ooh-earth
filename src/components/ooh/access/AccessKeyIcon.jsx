import KeyGlyph from '@/components/ooh/KeyGlyph';

// Renders a provided access-key SVG on a light specimen chip so the black
// line-art reads on the dark theme. Falls back to the schematic KeyGlyph
// (in black) when no provided SVG exists for a slug.
export default function AccessKeyIcon({ slug, iconSvg, chipClassName = '', className = '' }) {
  return (
    <span className={`flex items-center justify-center bg-brand-smoke ${chipClassName}`}>
      {iconSvg ? (
        <img src={iconSvg} alt="" className={`object-contain ${className}`} />
      ) : (
        <KeyGlyph slug={slug} className={`text-black ${className}`} />
      )}
    </span>
  );
}
