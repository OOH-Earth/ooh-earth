import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Box, Coins, ArrowRight, Layers as LayersIcon, ShoppingBag } from 'lucide-react';
import Nav from '@/components/ooh/Nav';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import SiteFooter from '@/components/ooh/SiteFooter';
import SlabViewer3D from '@/components/ooh/nft/SlabViewer3D';
import NftMatrixStrip from '@/components/ooh/nft/NftMatrixStrip';
import NftStudioPanel from '@/components/ooh/nft/NftStudioPanel';
import { CASING_TYPES, LABEL_COLORS, PREMADE_DESIGNS } from '@/components/ooh/nft/nftPresets';
import { useLabGate } from '@/components/ooh/LabGate';

// OOH Earth — NFT Creator (Lab)
// Subvertising / Adbusting NFT studio prototype. 3D slab viewer with casing
// types, finishes, grading labels, artwork upload + AI generation, and
// premade adbusting themes. Integrates with the Lab ecosystem + Zora mint.

export default function NftCreator() {
  const [config, setConfig] = useState({
    casing: 'slab',
    finish: 'clear',
    title: 'Clean City',
    grade: '9.5',
    serial: 'OOH-00001',
    labelColor: 'ozone',
  });
  const [artworkUrl, setArtworkUrlState] = useState(null);
  const [generating, setGenerating] = useState(false);
  const viewerRef = useRef(null);
  const artworkUrlRef = useRef(null);
  artworkUrlRef.current = artworkUrl;
  const { gate } = useLabGate();

  // Uploaded artwork arrives as a local blob: URL (see NftStudioPanel's
  // onUpload) -- generated/premade artwork is a remote URL. Only blob URLs
  // need revoking; revoking a non-blob URL is a silent no-op but we guard
  // explicitly so this stays correct if that assumption ever changes.
  const setArtworkUrl = (url) => {
    const prev = artworkUrlRef.current;
    if (prev?.startsWith('blob:') && prev !== url) URL.revokeObjectURL(prev);
    setArtworkUrlState(url);
  };

  useEffect(
    () => () => {
      if (artworkUrlRef.current?.startsWith('blob:')) URL.revokeObjectURL(artworkUrlRef.current);
    },
    [],
  );

  const onConfig = (patch) => setConfig((c) => ({ ...c, ...patch }));

  const applyPreset = (p) => onConfig({ title: p.title, grade: p.grade, labelColor: p.labelColor });

  const generateArt = async () => {
    if (!gate('Generate artwork')) return;
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: `Subvertising adbusting poster artwork: "${config.title}". High-contrast political stencil art, black and yellow palette, anti-corporate advertising, public space reclamation, bold graphic design suitable for a trading card.`,
      });
      if (res?.url) setArtworkUrl(res.url);
    } catch {
      /* ignore for prototype */
    }
    setGenerating(false);
  };

  const randomize = () => {
    if (!gate('Randomize design')) return;
    const c = CASING_TYPES[Math.floor(Math.random() * CASING_TYPES.length)];
    const lc = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)];
    const p = PREMADE_DESIGNS[Math.floor(Math.random() * PREMADE_DESIGNS.length)];
    onConfig({
      casing: c.id,
      labelColor: lc.id,
      title: p.title,
      grade: p.grade,
      serial: `OOH-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
    });
  };

  const handleExport = () => {
    if (!gate('Export PNG')) return;
    viewerRef.current?.exportPNG();
  };

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs
          items={[{ label: 'Lab', to: '/lab' }, { label: 'NFT Creator' }]}
          className="mb-4"
        />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">
            NFT <span className="text-ozone">Creator</span>
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">
            Subvertising · Adbusting · 3D slab studio
          </p>
          <div className="ml-auto flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em]">
            <Link to="/lab" className="text-silver/40 hover:text-ozone">
              Lab
            </Link>
            <Link to="/zora" className="text-silver/40 hover:text-ozone">
              Zora
            </Link>
            <span className="border border-flare/40 px-2 py-0.5 text-flare">
              Studio · Prototype
            </span>
          </div>
        </header>

        <p className="my-6 max-w-2xl font-mono text-xs leading-loose text-silver/50">
          The OOH Earth subvertising NFT studio — slab, grade and mint adbusting interventions as
          collectible cards. Choose a casing, finish and label, upload or generate artwork, then
          export or mint on Zora. Integrates with the Lab ecosystem and agency ops.
        </p>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-3">
            <SlabViewer3D ref={viewerRef} config={config} artworkUrl={artworkUrl} />
            <NftMatrixStrip config={config} />
          </div>
          <NftStudioPanel
            config={config}
            onConfig={onConfig}
            artworkUrl={artworkUrl}
            onArtwork={setArtworkUrl}
            onExport={handleExport}
            onGenerate={generateArt}
            generating={generating}
            onRandomize={randomize}
          />
        </div>

        {/* Premade designs */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
            Premade designs · adbusting themes
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {PREMADE_DESIGNS.map((p) => {
              const lc = LABEL_COLORS.find((c) => c.id === p.labelColor) || LABEL_COLORS[0];
              return (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className="group flex flex-col gap-2 border border-slate2 p-3 text-left transition-colors hover:border-ozone/50"
                >
                  <div className="h-1.5 w-full" style={{ background: lc.bg }} />
                  <div className="text-sm font-bold">{p.title}</div>
                  <div className="font-mono text-[9px] text-silver/50">{p.desc}</div>
                  <div className="mt-1 font-mono text-[10px] text-ozone">{p.grade}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Physical production specs */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
              Physical production specs
            </div>
            <span className="border border-flare/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-flare">
              Made to order
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'Card Size', value: '2.5″ × 3.5″' },
              { label: 'Frame', value: 'Molded polystyrene' },
              { label: 'Window', value: 'Optical acrylic' },
              { label: 'Screws', value: 'M2 brass' },
              { label: 'Thickness', value: '3.5mm' },
              { label: 'Weight', value: '~45g' },
              { label: 'Label', value: 'Printed vinyl' },
              { label: 'Production', value: '3D print → mold' },
              { label: 'MOQ', value: '1 / 50 bulk' },
              { label: 'Lead Time', value: '7-10 days' },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-mono text-[9px] uppercase tracking-widest text-silver/40">
                  {s.label}
                </div>
                <div className="mt-1 font-mono text-xs text-silver/80">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate2 pt-4">
            <Link
              to="/store/6a6db7c035818609bdbaffc6"
              className="flex items-center gap-2 border-2 border-ozone bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void hover:bg-flare hover:border-flare"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Buy Physical Card · $25
            </Link>
            <span className="font-mono text-[10px] text-silver/40">
              3D-printed prototype · injection-mold production available · custom sizes on request
            </span>
          </div>
        </div>

        {/* Lab integration */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
            Lab integration
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link
              to="/lab/device"
              className="group flex items-center gap-3 border border-slate2 p-4 transition-colors hover:border-ozone/50"
            >
              <Box className="h-5 w-5 text-ozone" />
              <div>
                <div className="text-sm font-bold">3D Device</div>
                <div className="font-mono text-[10px] text-silver/50">
                  Coin-cube geometry reference
                </div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-silver/30 group-hover:text-ozone" />
            </Link>
            <Link
              to="/lab/coin"
              className="group flex items-center gap-3 border border-slate2 p-4 transition-colors hover:border-ozone/50"
            >
              <Coins className="h-5 w-5 text-ozone" />
              <div>
                <div className="text-sm font-bold">Genesis Coin</div>
                <div className="font-mono text-[10px] text-silver/50">On-chain coin protocol</div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-silver/30 group-hover:text-ozone" />
            </Link>
            <Link
              to="/zora"
              className="group flex items-center gap-3 border border-slate2 p-4 transition-colors hover:border-ozone/50"
            >
              <LayersIcon className="h-5 w-5 text-ozone" />
              <div>
                <div className="text-sm font-bold">Zora Mint</div>
                <div className="font-mono text-[10px] text-silver/50">On-chain NFT minting</div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-silver/30 group-hover:text-ozone" />
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
