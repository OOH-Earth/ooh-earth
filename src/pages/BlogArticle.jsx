import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useParams } from "react-router-dom";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import { Loader2, Lock, ArrowLeft, Copy, Check } from "lucide-react";
import { useSeo } from "@/lib/seoContext";

const payload = (res) => (res && typeof res === "object" && "data" in res ? res.data : res);

const fmtDate = (s) => {
  if (!s) return "";
  try { return new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
  catch { return s; }
};

// Light body renderer: blank-line-separated blocks. "## " → heading,
// lines starting "- " → bullet list, otherwise a paragraph.
function Body({ text }) {
  const blocks = String(text || "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i} className="mt-8 font-display text-xl font-bold tracking-[-0.01em] text-silver">{b.slice(3)}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2 font-display text-[14px] leading-[1.6] text-darkgray">
                  <span className="mt-2 h-1 w-1 shrink-0 bg-ozone" />
                  <span>{l.trim().slice(2)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="font-display text-[14px] leading-[1.7] text-darkgray">{b}</p>;
      })}
    </div>
  );
}

export default function BlogArticle({ scope = "public" }) {
  const { slug } = useParams();
  const isAgency = scope === "agency";
  const base = isAgency ? "/agency/blog" : "/blog";
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | forbidden | notfound | error
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      setStatus("loading");
      try {
        const res = await base44.functions.invoke("blog", { action: "get", slug });
        const data = payload(res);
        if (data?.post) { setPost(data.post); setStatus("ok"); return; }
        setStatus(data?.error && /forbidden|agency/i.test(data.error) ? "forbidden" : "notfound");
      } catch (e) {
        const msg = String(e?.message || "");
        setStatus(/403|forbidden|agency/i.test(msg) ? "forbidden" : /404|not found/i.test(msg) ? "notfound" : "error");
      }
    })();
  }, [slug]);

  useSeo(post && status === "ok" ? {
    title: `${post.title} — OOH Earth Blog`,
    desc: post.excerpt || post.title,
    image: post.cover_image,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt || "",
      image: post.cover_image ? [post.cover_image] : undefined,
      author: post.author ? { "@type": "Organization", name: post.author } : undefined,
      datePublished: post.published_date || undefined
    }
  } : null);

  const copyBody = async () => {
    try { await navigator.clipboard.writeText(`${post.title}\n\n${post.body || ""}`); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ }
  };

  const crumbs = isAgency
    ? [{ label: "Agency", to: "/agency/blog" }, { label: "Newsroom", to: "/agency/blog" }, { label: post?.title || "Post" }]
    : [{ label: "Blog", to: "/blog" }, { label: post?.title || "Post" }];

  return (
    <div className="relative min-h-screen bg-void page-top">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs items={crumbs} className="mb-6" />

          {status === "loading" && <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-ozone" /></div>}

          {status === "forbidden" && (
            <div className="flex flex-col items-center gap-3 border border-flare/40 bg-flare/[0.04] p-10 text-center">
              <Lock className="h-6 w-6 text-flare" />
              <h2 className="font-display text-lg font-bold text-silver">Agency access required</h2>
              <p className="max-w-md font-display text-[13px] leading-relaxed text-darkgray">This post is part of the internal newsroom. Ask an admin to enable your agency status.</p>
              <Link to="/blog" className="mt-1 border border-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void">Public blog →</Link>
            </div>
          )}

          {(status === "notfound" || status === "error") && (
            <div className="flex flex-col items-center gap-3 border border-slate2/50 bg-card p-10 text-center">
              <h2 className="font-display text-lg font-bold text-silver">{status === "notfound" ? "Post not found" : "Something went wrong"}</h2>
              <Link to={base} className="mt-1 flex items-center gap-1.5 border border-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"><ArrowLeft className="h-3.5 w-3.5" /> Back to {isAgency ? "newsroom" : "blog"}</Link>
            </div>
          )}

          {status === "ok" && post && (
            <article>
              <div className="flex flex-wrap items-center gap-2">
                {post.category && <span className="border border-ozone/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone">{post.category}</span>}
                {post.network && <span className="border border-slate2/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-darkgray">{post.network}</span>}
                {post.audience === "agency" && <span className="border border-flare/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">agency</span>}
                {post.status && post.status !== "published" && <span className="border border-flare/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">{post.status}</span>}
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">{fmtDate(post.published_date)}</span>
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-4xl">{post.title}</h1>
              {post.author && <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{post.author}</p>}
              {post.excerpt && <p className="mt-4 border-l-2 border-ozone/50 pl-4 font-display text-[15px] leading-[1.6] text-silver/80">{post.excerpt}</p>}

              <div className="mt-8">
                <Body text={post.body} />
              </div>

              {post.cta && (
                <div className="mt-8 border border-ozone/40 bg-ozone/[0.04] p-4 font-display text-[14px] leading-relaxed text-silver">{post.cta}</div>
              )}

              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-slate2/50 pt-6">
                <Link to={base} className="flex items-center gap-1.5 border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"><ArrowLeft className="h-3.5 w-3.5" /> {isAgency ? "Newsroom" : "Blog"}</Link>
                {isAgency && (
                  <button onClick={copyBody} className="flex items-center gap-1.5 border border-flare/50 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-flare transition-colors hover:bg-flare hover:text-void">
                    {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy to post</>}
                  </button>
                )}
              </div>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}