import { useState } from 'react';
import { submitCapture } from '@/lib/offlineQueue';
import { uploadLocationPhotos } from '@/components/ooh/gallery/MultiPhotoUpload';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Loader2,
  Check,
  CloudOff,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import ReportStep1Document from '@/components/ooh/report/ReportStep1Document';
import ReportStep2Identify from '@/components/ooh/report/ReportStep2Identify';
import ReportStep3Classify from '@/components/ooh/report/ReportStep3Classify';
import ReportStep4Adbust from '@/components/ooh/report/ReportStep4Adbust';

const STEPS = [
  { id: 1, label: 'Document', desc: 'Pin it, photograph it' },
  { id: 2, label: 'Identify', desc: 'Brand, operator, agency' },
  { id: 3, label: 'Classify', desc: 'Harm type, violation' },
  { id: 4, label: 'Respond', desc: 'Adbust, actions' },
];

const EMPTY = {
  type: 'billboard',
  address: '',
  lat: '',
  lng: '',
  title: '',
  image_url: '',
  brand_name: '',
  campaign_name: '',
  ooh_operator: '',
  ad_agency: '',
  parent_corp: '',
  industry_sector: '',
  harm_tags: [],
  harm_statement: '',
  condition: 'functional',
  notes: '',
  adbust_type: 'none',
  adbust_image_url: '',
  action_flags: [],
  extraPhotos: [],
};

export default function FieldReport() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');

  const onChange = (patch) => setData((d) => ({ ...d, ...patch }));

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async (e) => {
    e?.preventDefault();
    setError('');
    const latN = parseFloat(data.lat);
    const lngN = parseFloat(data.lng);
    if (!isFinite(latN) || !isFinite(lngN)) {
      setStep(1);
      setError('GPS coordinates required — use Locate me or enter manually.');
      return;
    }
    setSubmitting(true);
    const label = data.type.charAt(0).toUpperCase() + data.type.slice(1);
    const finalTitle =
      data.title.trim() || `${label} · ${data.address.split(',')[0].trim() || 'Field report'}`;
    const notesBlob = [
      data.notes,
      data.harm_statement ? `Harm statement: ${data.harm_statement}` : '',
      data.harm_tags?.length ? `Violations: ${data.harm_tags.join(', ')}` : '',
      data.action_flags?.length ? `Actions: ${data.action_flags.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    try {
      const res = await submitCapture({
        title: finalTitle,
        type: data.type,
        address: data.address,
        lat: latN,
        lng: lngN,
        image_url: data.image_url,
        notes: notesBlob,
        source_link: '',
        status: 'pending',
        brand_name: data.brand_name,
        campaign_name: data.campaign_name,
        ooh_operator: data.ooh_operator,
        ad_agency: data.ad_agency,
        parent_corp: data.parent_corp,
        industry_sector: data.industry_sector,
        harm_tags: data.harm_tags,
        harm_statement: data.harm_statement,
        condition: data.condition,
        adbust_type: data.adbust_type,
        adbust_image_url: data.adbust_image_url,
        action_flags: data.action_flags,
      });
      if (res.status === 'synced') {
        setDone(res.rec);
        if (data.extraPhotos?.length)
          uploadLocationPhotos(data.extraPhotos, res.rec.id).catch(() => {});
      } else {
        setDone({ queued: true, lat: latN, lng: lngN });
      }
    } catch (err) {
      setError(err?.message || 'Transmission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(null);
    setData({ ...EMPTY });
    setStep(1);
    setError('');
  };

  if (done) {
    return (
      <div className={`border bg-card p-8 ${done.queued ? 'border-flare/40' : 'border-ozone/40'}`}>
        {done.queued ? (
          <CloudOff className="h-7 w-7 text-flare" />
        ) : (
          <Check className="h-7 w-7 text-ozone" />
        )}
        <h3 className="mt-4 font-display text-3xl font-bold tracking-[-0.02em] text-silver">
          {done.queued ? 'Queued offline' : 'Transmission received'}
        </h3>
        <p className="mt-2 font-display text-sm leading-[1.4] text-darkgray">
          {done.queued
            ? `Offline — saved on this device, transmits when you reconnect. Position ${done.lat?.toFixed(4)}, ${done.lng?.toFixed(4)}.`
            : `Field report logged to the public archive. Pending verification — renders on the live map immediately.`}
        </p>
        {done.brand_name && (
          <div className="mt-4 border border-slate2/60 bg-void px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
              Ad chain logged
            </div>
            <div className="mt-1 font-display text-sm text-silver">
              {[done.brand_name, done.ooh_operator, done.ad_agency].filter(Boolean).join(' → ')}
            </div>
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {done.id && (
            <Link
              to={`/location/${done.id}`}
              className="inline-flex items-center gap-2 bg-ozone px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare"
            >
              View your report <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <Link
            to="/map"
            className={`inline-flex items-center gap-2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] transition-colors ${done.id ? 'border border-slate2 text-darkgray hover:border-ozone hover:text-ozone' : 'bg-ozone text-void hover:bg-flare'}`}
          >
            View on map <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={reset}
            className="border border-slate2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
          >
            File another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8 flex gap-px">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={`flex flex-1 flex-col border px-3 py-2.5 text-left transition-colors ${step === s.id ? 'border-ozone bg-ozone/5' : step > s.id ? 'border-ozone/30 bg-ozone/[0.03]' : 'border-slate2/60 bg-card'}`}
          >
            <span
              className={`font-mono text-[8px] uppercase tracking-[0.25em] ${step === s.id ? 'text-ozone' : step > s.id ? 'text-ozone/50' : 'text-dim'}`}
            >
              {String(s.id).padStart(2, '0')}
            </span>
            <span
              className={`font-display text-xs font-bold uppercase tracking-tight ${step === s.id ? 'text-silver' : step > s.id ? 'text-darkgray' : 'text-dim'}`}
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* Step header */}
      <div className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
          // Step {step} of 4
        </div>
        <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-silver">
          {STEPS[step - 1].desc}
        </h2>
      </div>

      {/* Step content */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 4) next();
          else submit();
        }}
      >
        {step === 1 && <ReportStep1Document data={data} onChange={onChange} />}
        {step === 2 && <ReportStep2Identify data={data} onChange={onChange} />}
        {step === 3 && <ReportStep3Classify data={data} onChange={onChange} />}
        {step === 4 && <ReportStep4Adbust data={data} onChange={onChange} />}

        {error && (
          <div className="mt-6 flex items-start gap-2 border border-flare/40 bg-flare/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-flare" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-flare">
              {error}
            </span>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={prev}
              className="flex items-center gap-2 border border-slate2 px-5 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 bg-ozone px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-void transition-colors hover:bg-flare disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : step < 4 ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {submitting ? 'Transmitting…' : step < 4 ? 'Continue' : 'Transmit report'}
          </button>
        </div>
      </form>
    </div>
  );
}
