import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, ExternalLink, MapPin } from 'lucide-react';
import { PARENT_CORPS, AGENCIES } from '@/components/ooh/report/advertiserRegistry';
import { TOP_OOH_OPERATORS, ALL_OOH_OPERATORS } from '@/components/ooh/report/oohMediaCorps';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { mergeDetection } from '@/components/ooh/report/identifyMerge';

const inp =
  'w-full bg-void border border-slate2 px-4 py-3 font-display text-sm text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone';

const SECTORS = [
  { value: 'fossil_fuel', label: 'Fossil fuel' },
  { value: 'tobacco', label: 'Tobacco' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'gambling', label: 'Gambling' },
  { value: 'ultra_processed_food', label: 'UPF / Junk food' },
  { value: 'surveillance', label: 'Surveillance tech' },
  { value: 'finance', label: 'Finance / Banking' },
  { value: 'real_estate', label: 'Real estate' },
  { value: 'fashion', label: 'Fashion / Luxury' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'pharma', label: 'Pharma' },
  { value: 'other', label: 'Other' },
];

export default function ReportStep2Identify({ data, onChange }) {
  const { isAuthenticated } = useAuth();
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(null);
  // Latest form values, so a scan that finishes later can tell what was edited meanwhile.
  const dataRef = useRef(data);
  dataRef.current = data;

  // PROTOTYPE (sign-in-only policy pending owner decision): the analysis runs in the existing
  // scanAd backend function, which verifies identity before any billable call and owns the prompt.
  // The browser no longer calls the AI integration with a client-built prompt. Signed-out
  // visitors keep the full manual form; nothing is sent.
  const aiDetect = async () => {
    if (!data.image_url || detecting) return;
    if (!isAuthenticated) {
      setDetected({ signInRequired: true });
      return;
    }
    setDetecting(true);
    setDetected(null);
    const snapshot = { ...dataRef.current };
    try {
      const resp = await base44.functions.invoke('scanAd', { file_url: data.image_url });
      const detected = resp?.data?.detection?.response || resp?.data?.detection || null;
      if (!detected || typeof detected !== 'object') throw new Error('no detection');
      if (detected.is_advertising === false) {
        setDetected({ none: true });
        return;
      }
      setDetected(detected);
      onChange(mergeDetection({ snapshot, current: dataRef.current, detected }));
    } catch {
      setDetected({ error: true });
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* AI Detection CTA — Step 1's AI Ad Scanner already runs this same
          analysis (better: it also covers agency/operator/harm tags) when
          the user uses it there. Don't present a second full-price scan as
          the primary action if that already succeeded -- offer a
          de-emphasized re-scan instead, so the same image isn't silently
          re-analyzed with a weaker prompt by default. */}
      {data.image_url && (
        <div className="border border-ozone/30 bg-ozone/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-ozone">
                AI brand scanner
              </div>
              {data.ai_scanned && !detected ? (
                <p className="mt-1 font-display text-sm text-darkgray">
                  ✓ Already identified by the Step 1 AI Scanner — review the fields below, or
                  re-scan for a second opinion.
                </p>
              ) : (
                <p className="mt-1 font-display text-sm text-darkgray">
                  Analyse your photo to auto-identify the brand, campaign, and sector.
                </p>
              )}
              {detected?.signInRequired && (
                <p className="mt-1 font-mono text-[11px] text-flare" role="status">
                  AI scan is for signed-in members.{' '}
                  <Link to="/login" className="underline">
                    Sign in
                  </Link>{' '}
                  or fill the fields below — your report is kept.
                </p>
              )}
              {detected?.none && (
                <p className="mt-1 font-mono text-[11px] text-dim" role="status">
                  No advertising detected — fill the fields below.
                </p>
              )}
              {detected?.error && (
                <p className="mt-1 font-mono text-[11px] text-flare">
                  Detection failed — fill manually below.
                </p>
              )}
              {detected && !detected.error && !detected.signInRequired && !detected.none && (
                <p className="mt-1 font-mono text-[11px] text-ozone">
                  ✓ Detection applied — review and correct below.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={aiDetect}
              disabled={detecting}
              className={`flex min-h-[44px] shrink-0 items-center gap-2 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-colors disabled:opacity-40 ${
                data.ai_scanned && !detected
                  ? 'border border-ozone/40 text-ozone hover:bg-ozone/10'
                  : 'bg-ozone text-void hover:bg-flare'
              }`}
            >
              {detecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {detecting ? 'Scanning…' : data.ai_scanned ? 'Re-scan' : 'Identify'}
            </button>
          </div>
        </div>
      )}

      {/* Brand */}
      <div>
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.3em] text-dim">
          Brand / Advertiser
        </label>
        <input
          value={data.brand_name}
          onChange={(e) => onChange({ brand_name: e.target.value })}
          placeholder="e.g. Shell, McDonald's, Toyota"
          className={inp}
        />
      </div>

      {/* Campaign */}
      <div>
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.3em] text-dim">
          Campaign / Tagline <span className="text-dim">(optional)</span>
        </label>
        <input
          value={data.campaign_name}
          onChange={(e) => onChange({ campaign_name: e.target.value })}
          placeholder="e.g. Drive the Future"
          className={inp}
        />
      </div>

      {/* Parent corp */}
      <div>
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.3em] text-dim">
          Parent / Holding company <span className="text-dim">(optional)</span>
        </label>
        <input
          value={data.parent_corp}
          onChange={(e) => onChange({ parent_corp: e.target.value })}
          list="parent-corps-list"
          placeholder="e.g. Shell plc, Yum! Brands, WPP"
          className={inp}
        />
        <datalist id="parent-corps-list">
          {PARENT_CORPS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {/* OOH Operator */}
      <div>
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.3em] text-dim">
          OOH structure owner <span className="text-dim">(optional)</span>
        </label>
        <p className="mb-2 font-mono text-[11px] text-dim">
          The company that owns the physical ad infrastructure — not the ad agency.
        </p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {TOP_OOH_OPERATORS.map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => onChange({ ooh_operator: op })}
              className={`px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.15em] transition-colors border ${data.ooh_operator === op ? 'border-ozone bg-ozone/10 text-ozone' : 'border-slate2 text-darkgray hover:border-ozone/50'}`}
            >
              {op}
            </button>
          ))}
        </div>
        <input
          value={data.ooh_operator}
          onChange={(e) => onChange({ ooh_operator: e.target.value })}
          list="ooh-operators-list"
          placeholder="Type or select operator…"
          className={inp}
        />
        <datalist id="ooh-operators-list">
          {ALL_OOH_OPERATORS.map((op) => (
            <option key={op} value={op} />
          ))}
        </datalist>
        <Link
          to="/media-corps"
          className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ozone/70 transition-colors hover:text-ozone"
        >
          <MapPin className="h-2.5 w-2.5" /> View the Media Corps map
        </Link>
      </div>

      {/* Ad Agency */}
      <div>
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.3em] text-dim">
          Ad agency (creative) <span className="text-dim">(optional)</span>
        </label>
        <input
          value={data.ad_agency}
          onChange={(e) => onChange({ ad_agency: e.target.value })}
          list="agencies-list"
          placeholder="e.g. Ogilvy, McCann, BBDO"
          className={inp}
        />
        <datalist id="agencies-list">
          {AGENCIES.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
        <div className="mt-1.5 flex flex-wrap gap-3">
          <a
            href="https://cleancreatives.org/f-list"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ozone/70 transition-colors hover:text-ozone"
          >
            <ExternalLink className="h-2.5 w-2.5" /> Clean Creatives F-List (Worldwide)
          </a>
          <a
            href="https://cleancreatives.org/asia-f-list"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ozone/70 transition-colors hover:text-ozone"
          >
            <ExternalLink className="h-2.5 w-2.5" /> F-List Asia
          </a>
        </div>
      </div>

      {/* Industry sector */}
      <div>
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.3em] text-dim">
          Industry sector
        </label>
        <div className="grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40 sm:grid-cols-3">
          {SECTORS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange({ industry_sector: s.value })}
              className={`px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.15em] transition-colors ${data.industry_sector === s.value ? 'bg-ozone text-void' : 'bg-card text-darkgray hover:text-silver'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
