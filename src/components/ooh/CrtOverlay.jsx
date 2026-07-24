export default function CrtOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[30] overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute inset-0 crt-scanlines" />
      <div className="absolute inset-x-0 -top-32 h-32 animate-scan bg-gradient-to-b from-transparent via-ozone/[0.05] to-transparent" />
    </div>
  );
}