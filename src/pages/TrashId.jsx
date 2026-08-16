import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { compressImage } from '@/lib/imageCompress';
import { validateImageFile } from '@/lib/validateUpload';
import { useKeyboardFilePicker } from '@/hooks/useKeyboardFilePicker';
import Nav from '@/components/ooh/Nav';
import TrashResult from '@/components/ooh/trash/TrashResult';
import { Camera, Loader2, Upload, Trash2, AlertCircle } from 'lucide-react';

const SCHEMA = {
  type: 'object',
  properties: {
    brands: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          parent_company: { type: 'string' },
          estimated_pieces: { type: 'number' },
          material: { type: 'string' },
          recyclable: { type: 'boolean' },
          accountability_score: { type: 'number' },
        },
        required: ['name', 'estimated_pieces', 'accountability_score'],
      },
    },
    dump_type: { type: 'string' },
    severity: { type: 'string', enum: ['low', 'moderate', 'high', 'severe'] },
    estimated_volume: { type: 'string' },
    recyclable_fraction_pct: { type: 'number' },
    top_offender: { type: 'string' },
    summary: { type: 'string' },
  },
  required: ['brands', 'severity', 'top_offender', 'summary'],
};

const PROMPT = `You are a field accountability analyst for the OOH.EARTH resistance platform. Examine this photo of dumped or discarded trash. Identify every visible brand and its parent company. For each brand estimate the piece count, dominant material, recyclability, and an accountability score (0-100, higher = more responsible for this waste). Assess the overall dump type, severity, estimated volume, and the recyclable fraction. Name the single top offending brand. Be concise, specific, and fearless about corporate responsibility.`;

export default function TrashId() {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const previewRef = useRef(null);
  previewRef.current = preview;
  const { labelProps, inputProps } = useKeyboardFilePicker(loading);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const handleFile = async (f) => {
    if (!f || loading) return;
    setError('');
    setResult(null);
    const check = await validateImageFile(f);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setLoading(true);
    try {
      const up = await base44.integrations.Core.UploadFile({ file: await compressImage(f) });
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: PROMPT,
        response_json_schema: SCHEMA,
        file_urls: [up.file_url],
      });
      setResult(res);
    } catch (e) {
      setError(e.message || 'Analysis failed — try another photo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void">
      <Nav />
      <main className="page-top mx-auto max-w-3xl px-5 pb-24 md:px-8">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
            // Field tool · Trash attribution
          </span>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight2 text-silver md:text-5xl">
            Photograph the dump.
            <br />
            Name the brand.
          </h1>
          <p className="mt-2 max-w-xl font-display text-sm leading-relaxed text-darkgray">
            Snap discarded waste in the field. Vision analysis IDs every visible brand, estimates
            piece counts and materials, and scores corporate accountability for the mess.
          </p>
        </div>

        <div className="mt-8 border border-slate2/60 bg-card p-4">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            // Capture evidence
          </div>
          <label
            {...labelProps}
            aria-label={preview ? 'Change photo' : 'Take photo or drop image'}
            onDragOver={(e) => {
              if (loading) return;
              e.preventDefault();
            }}
            onDrop={(e) => {
              if (loading) return;
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate2 bg-void p-8 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone ${loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-ozone'}`}
          >
            {preview ? (
              <img src={preview} alt="trash evidence" className="max-h-64 w-auto object-contain" />
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center border border-ozone/60">
                  <Camera className="h-6 w-6 text-ozone" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-darkgray">
                  Take photo or drop image
                </span>
              </>
            )}
            <input
              {...inputProps}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={loading}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          {preview && !loading && (
            <button
              onClick={() => {
                setPreview((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return null;
                });
                setResult(null);
              }}
              className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray hover:text-flare"
            >
              <Upload className="h-3 w-3" /> Capture another
            </button>
          )}
        </div>

        {loading && (
          <div className="mt-6 flex flex-col items-center gap-3 border border-slate2/60 bg-card p-12">
            <Loader2 className="h-6 w-6 animate-spin text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
              Identifying brands…
            </span>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-center gap-2 border border-flare/50 bg-card p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-flare">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {result && (
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
              <Trash2 className="h-3.5 w-3.5 text-ozone" /> Attribution report
            </div>
            <TrashResult data={result} />
          </div>
        )}
      </main>
    </div>
  );
}
