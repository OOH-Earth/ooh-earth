// Generates a branded 1200x630 social-share (Open Graph) image for a route,
// using the OOH Earth brand kit, and persists it to the PageMeta entity.
// Admin-only. Uses the Core GenerateImage integration.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const SITE = "OOH Earth";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { path, title, subtitle } = body;
    if (!path || !title) {
      return Response.json({ error: "Missing path or title" }, { status: 400 });
    }

    // Brand-kit-encoded prompt. The OOH visual system: pure black canvas,
    // high-vis yellow (#EDFF00) + neon orange (#FF5C00) accents, Inter Tight
    // type, orbital/grid aesthetic, mono technical labels.
    const safeTitle = String(title).slice(0, 80);
    const safeSub = subtitle ? String(subtitle).slice(0, 100) : "";

    const prompt = [
      "A 1200x630 social share banner, dark cinematic, pure black background (#000000).",
      "Bold high-vis yellow (#EDFF00) and neon orange (#FF5C00) accent lines and a subtle technical grid overlay.",
      "Top-left: a small mono technical label reading 'OOH EARTH' in uppercase, tracking wide, yellow.",
      "Center: the headline text \"" + safeTitle + "\" rendered large, white, heavy sans-serif (Inter Tight), tight leading, left-aligned within a left margin.",
      safeSub ? ("Below the headline, a single line of smaller muted gray (#B2B2B2) text: \"" + safeSub + "\".") : "",
      "Bottom-right corner: a small orbital gyroscope mark in yellow outline.",
      "Minimal, high-contrast, no photographic imagery, no people, no logos other than the wordmark. Clean editorial poster aesthetic."
    ].filter(Boolean).join(" ");

    const res = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
    const imageUrl = (res && (res as any)).url || (res && (res as any).data?.url);
    if (!imageUrl) {
      return Response.json({ error: "Image generation returned no URL" }, { status: 502 });
    }

    // Persist to PageMeta (create or update by path).
    const existing = await base44.asServiceRole.entities.PageMeta.filter({ path: String(path) }, "-updated_date", 1);
    const rec = existing && existing[0];
    let saved;
    if (rec) {
      saved = await base44.asServiceRole.entities.PageMeta.update(rec.id, {
        og_image: String(imageUrl),
        og_generated: true,
        title: rec.title || safeTitle,
      });
    } else {
      saved = await base44.asServiceRole.entities.PageMeta.create({
        path: String(path),
        title: safeTitle,
        description: safeSub,
        og_image: String(imageUrl),
        og_generated: true,
      });
    }

    return Response.json({ ok: true, url: imageUrl, saved });
  } catch (error) {
    console.error("generateOgImage error:", error?.message || error);
    return Response.json({ error: error?.message || "Generation failed" }, { status: 500 });
  }
}