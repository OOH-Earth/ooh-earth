import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ScanLine, Loader2, Camera, CheckCircle2, AlertTriangle, MapPin, Tag, Building2, FileText, ArrowRight, RotateCcw, Upload } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import SiteFooter from "@/components/ooh/SiteFooter";
import CameraViewfinder from "@/components/ooh/CameraViewfinder";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const SECTOR_LABELS = {
  fossil_fuel: "Fossil Fuel",
  tobacco: "Tobacco",
  alcohol: "Alcohol",
  gambling: "Gambling",
  ultra_processed_food: "Ultra-Processed Food",
  surveillance: "Surveillance",
  finance: "Finance",
  real_estate: "Real Estate",
  fashion: "Fashion",
  automotive: "Automotive",
  pharma: "Pharma",
  other: "Other",
};

function FieldRow({ icon: Icon, label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="flex gap-3 border-b border-slate2 px-4 py-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ozone/70" />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-silver/40">{label}</div>
        <div className="mt-0.5 font-mono text-[12px] text-silver break-words">
          {Array.isArray(value) ? value.join(", ") : value}
        </div>
      </div>
    </div>
  );
}

export default function AdScanLab() {
  const { toast } = useToast();
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [detection, setDetection] = useState(null);
  const [cataloging, setCataloging] = useState(false);
  const [cataloged, setCataloged] = useState(null);

  const handleCapture = useCallback(async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCapturedUrl(file_url);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleCapture(file);
  }, [handleCapture]);

  const runScan = async () => {
    if (!capturedUrl) return;
    setScanning(true);
    setDetection(null);
    setCataloged(null);
    try {
      const resp = await base44.functions.invoke("scanAd", { file_url: capturedUrl });
      const det = resp.data?.detection?.response || resp.data?.detection || resp.data;
      setDetection(det);
    } catch {
      toast({ title: "Scan failed", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const catalogLocation = async () => {
    if (!detection) return;
    setCataloging(true);
    try {
      const rec = await base44.entities.Location.create({
        title: detection.brand_name
          ? `Ad scan · ${detection.brand_name}`
          : `Ad scan · ${new Date().toLocaleDateString()}`,
        type: detection.surface_type || "other",
        image_url: capturedUrl,
        brand_name: detection.brand_name || "",
        ad_agency: detection.ad_agency || "",
        parent_corp: detection.parent_corp || "",
        campaign_name: detection.campaign_name || "",
        ooh_operator: detection.ooh_operator || "",
        industry_sector: detection.industry_sector || "other",
        harm_tags: detection.harm_tags || [],
        notes: detection.description || "",
        status: "pending",
      });
      setCataloged(rec);
      toast({ title: "Cataloged to atlas" });
    } catch {
      toast({ title: "Catalog failed", variant: "destructive" });
    } finally {
      setCataloging(false);
    }
  };

  const reset = () => {
    setCapturedUrl(null);
    setDetection(null);
    setCataloged(null);
  };

  const confidencePct = detection ? Math.round((detection.confidence || 0) * 100) : 0;

  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-4xl page-top px-6 pb-12">
        <Breadcrumbs items={[{ label: "Lab", to: "/lab" }, { label: "Ad Scanner" }]} className="mb-4" />

        <header className="flex flex-wrap items-baseline gap-4 border-b border-slate2 pb-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold uppercase tracking-[0.14em]">
            <ScanLine className="h-6 w-6 text-ozone" />
            Ad <span className="text-ozone">Scanner</span>
          </h1>
          <span className="ml-auto border border-flare/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-flare">Test mode · prototype</span>
        </header>

        <p className="my-6 max-w-2xl font-mono text-xs leading-loose text-silver/50">
          Point-and-shoot advertising detection. The scanner identifies brands, agencies, and branding on any surface — billboards, transit, digital screens, stickers — and catalogs the hit into the OOH Earth atlas for the normal reporting flow.
        </p>

        {/* ── Step 1: Capture ──────────────────────────────────────────── */}
        {!capturedUrl && (
          <div className="space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">
              Step 01 — Capture or upload
            </div>
            <CameraViewfinder onCapture={handleCapture} uploading={uploading} />
            <label className="flex cursor-pointer items-center justify-center gap-2 border border-slate2 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/60 transition-colors hover:border-ozone hover:text-ozone">
              <Upload className="h-3.5 w-3.5" />
              Upload image
              <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </label>
          </div>
        )}

        {/* ── Step 2: Scan ─────────────────────────────────────────────── */}
        {capturedUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">
                Step 02 — Scan for advertising
              </div>
              <button onClick={reset} className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-silver/40 transition-colors hover:text-ozone">
                <RotateCcw className="h-3 w-3" /> New capture
              </button>
            </div>

            <img src={capturedUrl} alt="Captured" className="w-full border border-slate2" />

            <button
              onClick={runScan}
              disabled={scanning}
              className="flex w-full items-center justify-center gap-2 border-2 border-ozone bg-ozone py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-40"
            >
              {scanning ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Scanning…</>
              ) : (
                <><ScanLine className="h-4 w-4" /> Run detection</>
              )}
            </button>
          </div>
        )}

        {/* ── Step 3: Results ──────────────────────────────────────────── */}
        {scanning && (
          <div className="mt-8 flex flex-col items-center gap-3 border border-slate2 bg-card py-12">
            <div className="relative">
              <ScanLine className="h-10 w-10 text-ozone animate-pulse" />
              <div className="absolute inset-0 animate-ping rounded-full border border-ozone/40" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/50">Analyzing image…</span>
          </div>
        )}

        {detection && !scanning && (
          <div className="mt-8 space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/40">
              Step 03 — Detection results
            </div>

            {/* Confidence bar */}
            <div className="flex items-center gap-3 border border-slate2 bg-card px-4 py-3">
              {detection.is_advertising ? (
                <CheckCircle2 className="h-5 w-5 text-ozone" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-flare" />
              )}
              <div className="flex-1">
                <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-silver">
                  {detection.is_advertising ? "Advertising detected" : "No advertising detected"}
                </div>
                <div className="mt-1.5 h-1 w-full bg-slate2">
                  <div className="h-full bg-ozone transition-all" style={{ width: `${confidencePct}%` }} />
                </div>
              </div>
              <span className="font-mono text-sm font-bold tabular text-ozone">{confidencePct}%</span>
            </div>

            {/* Fields */}
            {detection.is_advertising && (
              <div className="border border-slate2 bg-card">
                <FieldRow icon={Tag} label="Brand" value={detection.brand_name} />
                <FieldRow icon={FileText} label="Campaign" value={detection.campaign_name} />
                <FieldRow icon={Building2} label="Agency" value={detection.ad_agency} />
                <FieldRow icon={Building2} label="Parent Corp" value={detection.parent_corp} />
                <FieldRow icon={Building2} label="OOH Operator" value={detection.ooh_operator} />
                <FieldRow icon={MapPin} label="Surface Type" value={detection.surface_type} />
                <FieldRow icon={Tag} label="Industry Sector" value={SECTOR_LABELS[detection.industry_sector] || detection.industry_sector} />
                <FieldRow icon={AlertTriangle} label="Harm Tags" value={detection.harm_tags} />
                <FieldRow icon={FileText} label="Description" value={detection.description} />
                <FieldRow icon={FileText} label="Visible Text" value={detection.visible_text} />
              </div>
            )}

            {/* Catalog action */}
            {cataloged ? (
              <div className="flex flex-col items-center gap-3 border border-ozone/40 bg-ozone/5 py-8">
                <CheckCircle2 className="h-8 w-8 text-ozone" />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver">Cataloged to atlas</span>
                <Link
                  to={`/location/${cataloged.id}`}
                  className="flex items-center gap-1.5 border border-ozone bg-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare"
                >
                  View location <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <button
                onClick={catalogLocation}
                disabled={cataloging}
                className="flex w-full items-center justify-center gap-2 border border-slate2 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-silver transition-colors hover:border-ozone hover:text-ozone disabled:opacity-40"
              >
                {cataloging ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Cataloging…</>
                ) : (
                  <><MapPin className="h-4 w-4" /> Catalog to atlas</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}