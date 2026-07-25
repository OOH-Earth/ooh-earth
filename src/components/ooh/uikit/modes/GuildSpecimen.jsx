export default function GuildSpecimen() {
  return (
    <div className="guild relative min-h-[320px] overflow-hidden border border-border bg-background p-6 text-foreground">
      <span className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-ozone/15 blur-xl" />

      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">✦ guild · public service</span>
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">.guild</span>
      </div>

      <div className="mt-4">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">— reithian</span>
        <h3 className="mt-1 font-display text-[2rem] leading-[1.08]">
          We aim to <em className="not-italic text-ozone">educate</em>, <em className="not-italic text-ozone">entertain</em> &amp; <em className="not-italic text-ozone">inform</em>.
        </h3>
        <svg viewBox="0 0 200 4" className="mt-3 h-1 w-full" preserveAspectRatio="none">
          <line x1="0" y1="2" x2="200" y2="2" stroke="rgb(var(--c-ozone))" strokeWidth="2" />
        </svg>
      </div>

      <p className="mt-4 max-w-[32ch] font-body text-[12px] leading-[1.6] text-foreground/80">
        A public service organisation following the Brandalism manifesto — dedicated to the removal and detoxification of propaganda on the streets of our communities.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button className="bg-ozone px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-void transition-transform hover:scale-105">View the campaign</button>
        <button className="border border-border px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-foreground transition-colors hover:border-ozone hover:text-ozone">Join the guild</button>
      </div>

      <div className="mt-5 inline-block border border-ozone/60 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone">
        ◆ union-made
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
        {[["navy", "bg-background"], ["smoke", "bg-foreground"], ["ozone", "bg-ozone"], ["flare", "bg-flare"]].map(([n, c]) => (
          <span key={n} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 border border-border ${c}`} />
            <span className="font-mono text-[8px] uppercase text-muted-foreground">{n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}