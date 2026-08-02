import { useState } from "react";
import { Link } from "react-router-dom";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import { Compass, MessageSquare, Shapes, Camera, Grid3x3, Package, ArrowUpRight, Check, X } from "lucide-react";

// ─── Brand copy (canonical — from the Ad Free Streets standards) ───

const AUDIENCE = [
  { name: "Urban Planners & Activists", needs: ["Data and insights on the proliferation of outdoor ads and their impact on urban aesthetics.", "Mechanisms to involve the public in decisions about ad placements.", "Tools to gather public opinion and objections on new billboard proposals.", "Integration with local councils to streamline the objection process.", "Reporting and analytics to monitor advertising trends and community responses."] },
  { name: "Organisations & Councils", needs: ["Efficient methods for receiving, processing, and addressing public complaints about billboards.", "Insights into public sentiment on outdoor advertising in their jurisdiction.", "Tools to engage the community and promote transparency in decision-making.", "Integration with existing urban-planning systems and processes.", "Real-time data on advertising compliance and public feedback."] },
  { name: "Community Leaders & Organisations", needs: ["Platforms to mobilise members against the encroachment of corporate advertising.", "Tools to document and share the impact of excessive advertising on local culture.", "Features to organise campaigns or petitions against specific ad placements.", "Access to data and resources to support advocacy.", "Augmented-reality tools to visually demonstrate billboard saturation."] },
  { name: "Environmentally Conscious Users", needs: ["Platforms that promote sustainable, responsible use of public space.", "Ways to challenge the environmental impacts of advertising — light pollution, waste.", "Features to support eco-friendly alternatives to traditional billboards.", "The ability to share and spread awareness of OOH advertising's footprint.", "Gamification and rewards for sustainability-driven action."] },
  { name: "Tech-Savvy Users & Early Adopters", needs: ["Cutting-edge tools for active engagement in social issues through technology.", "A seamless user experience with advanced functionality.", "High-quality augmented reality and image-recognition capabilities.", "Integration with other apps and smart-city infrastructure.", "Customisation and advanced settings to tailor the experience."] },
  { name: "Cultural Advocates & Artists", needs: ["Platforms to push back on the commercialisation of public space and promote local culture.", "Tools to transform corporate ads into artistic or cultural expression.", "Features to create, share, and overlay AR-based art on existing billboards.", "Community support to promote artistic initiatives and cultural awareness.", "Opportunities to collaborate on campaigns that reclaim public space for culture."] },
];

const VALUES = [
  ["Empowerment", "We give individuals and communities the tools and platforms they need to take control of their public spaces and make their voices heard."],
  ["Transparency", "We foster openness in the advertising process, ensuring citizens can see how decisions are made and how they can influence them."],
  ["Cultural Integrity", "We protect and promote local culture and aesthetics, so public spaces reflect the community's values and creativity — not just commercial interests."],
  ["Innovation", "We leverage cutting-edge technology to let citizens challenge, reimagine, and reshape the urban advertising landscape."],
  ["Sustainability", "We promote practices that minimise the lasting environmental impact of advertising and encourage responsible use of public resources."],
  ["Community Engagement", "We value collective action and build strong, active communities that can effectively advocate for the integrity of their public spaces."],
  ["Responsibility", "We uphold ethical practice in advertising and urban development, striving for a balanced relationship between commerce and public welfare."],
  ["Creativity", "We celebrate creative expression that challenges the status quo and transforms intrusive ads into meaningful, culturally relevant experiences."],
];

const PERSONALITY = [
  ["Empathetic", "We understand the concerns and aspirations of the communities we serve — always listening and responding with compassion."],
  ["Bold", "We aren't afraid to challenge the status quo and stand up against the overwhelming presence of corporate advertising in public spaces."],
  ["Innovative", "We are forward-thinking, always seeking creative and technological solutions that push the boundaries of what's possible."],
  ["Empowering", "We inspire and enable individuals and communities to take action, giving them the confidence and tools to reclaim public space."],
  ["Transparent", "We communicate openly and honestly, ensuring our actions and decisions are clear and understandable."],
  ["Engaging", "We are approachable and actively connect with our audience, fostering collaboration and shared purpose."],
  ["Visionary", "We are driven by a long-term vision for a better, more culturally reflective urban environment — always keeping our eyes on the future."],
  ["Inclusive", "We value diversity and welcome voices from all walks of life, so everyone can help transform public space."],
];

const PRINCIPLES = [
  ["Clear & Concise", "We communicate in a straightforward, accessible way, ensuring our message is easily understood by all audiences.", "Avoid jargon, technical language, and unnecessary complexity. Break complex ideas into simple, digestible parts."],
  ["Empowering & Encouraging", "Our language uplifts and inspires our audience to take action and feel confident in their ability to influence change.", "Use positive, action-oriented words that encourage participation and reinforce that every individual can make a difference."],
  ["Inclusive & Respectful", "We ensure our language respects and reflects the diversity of the communities we serve.", "Avoid anything that could alienate or exclude. Use gender-neutral terms and be mindful of cultural sensitivities."],
  ["Engaging & Relatable", "We speak with warmth and creativity, inviting people into the mission rather than lecturing them.", "Write as if speaking to a friend or community member. Use an informal but respectful tone that invites dialogue."],
  ["Bold & Visionary", "We are confident in our mission, and our language reflects it through bold, assertive statements that inspire change.", "Use strong, decisive language that reflects our commitment to challenging the status quo and defending community rights."],
  ["Transparent & Honest", "We value openness and honesty, ensuring our audience always knows where we stand.", "Communicate facts clearly, acknowledge challenges, avoid spin. Be upfront about our intentions, actions, and realities."],
  ["Community-Centric", "The community is at the heart of everything we do, and our language consistently reflects it.", "Use 'we', 'us', and 'our' to foster shared responsibility. Emphasise community voice and participation."],
  ["Visionary & Ambitious", "We frame our work as a movement — appealing to aspiration and a transformed future.", "Paint the future we're building. Position the tools as part of a broader movement to reshape urban environments."],
];

const STORY = {
  Short: "Having witnessed first-hand the dominance of corporate interests in the creative industry, we wanted to build a platform that truly makes a difference — with no corporate edge attached. Our goal is to reclaim public spaces from commercial control and empower communities to challenge intrusive ads. Join us in transforming how advertising interacts with our cities and celebrating local identity and creativity.",
  Medium: "From our years in the advertising industry, we've seen how corporate interests increasingly overshadow community values. Despite our efforts to push for more creative, community-focused advertising, our ideas were frequently sidelined by commercial priorities. Determined to drive real change, we left the traditional advertising world and built our own platform. It represents our commitment to reclaiming public spaces from corporate control — empowering individuals and communities to challenge intrusive ads and restore local creativity and identity to our cities. Join us in redefining urban environments and making a lasting difference.",
  Long: "We've always been deeply aware of the growing impact of corporate interests on our public spaces. As seasoned advertising professionals, we saw first-hand how the industry increasingly prioritised commercial gain over community values. Despite our best efforts to advocate for more creative and community-centred approaches within the industry, our ideas were often overshadowed by corporate agendas. Realising that true change was unattainable within the existing system, we stepped away from the conventional advertising world and channelled our expertise into a platform designed to make a real difference. Our platform isn't just a tool — it's a movement to reclaim public spaces from corporate dominance. We're committed to empowering individuals and communities to challenge intrusive ads and restore a sense of local identity and creativity to our cities. Public spaces should reflect our collective values and spirit, not commercial interests. Join us in reshaping how advertising interacts with our urban environment — together, we can turn public spaces into vibrant reflections of community identity.",
};

const HEADLINES = [
  ["Inspiration & Vision", ["Redefine Urban Spaces: Embrace Creativity Over Corporate Control", "Join the Movement: Reclaim Public Spaces from Corporate Dominance"]],
  ["Empowerment & Action", ["Take a Stand: Challenge Intrusive Ads and Reclaim Your Space", "Empower Your Voice: Transform Public Spaces with Our Platform"]],
];

const CTA_DO = ["Start Transforming Your City Now", "Join Us in Reclaiming Public Spaces", "Challenge Unwanted Ads — Get Involved Today", "Help Us Redefine Public Spaces"];
const CTA_DONT = ["Act Now — Save Big on Public Spaces!", "Register Today for Exclusive Access to Space Redesign", "Find Out How to Get the Best Ads in Your City", "Act Now: Redefine Advertising and Restore Community Spirit"];

const SECTIONS = [
  { id: "strategy", label: "Strategy", icon: Compass, done: true },
  { id: "language", label: "Language", icon: MessageSquare, done: true },
  { id: "logo", label: "Logo", icon: Shapes, done: false },
  { id: "photography", label: "Photography", icon: Camera, done: false },
  { id: "graphic", label: "Graphic", icon: Grid3x3, done: false },
  { id: "applications", label: "Applications", icon: Package, done: false },
];

// ─── Reusable bits ───
function Eyebrow({ children }) {
  return <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">{children}</span>;
}
function SectionHead({ id, kicker, title, lede }) {
  return (
    <div id={id} className="scroll-mt-28 border-t border-slate2/50 pt-10">
      <Eyebrow>{kicker}</Eyebrow>
      <h2 className="mt-2 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-5xl">{title}</h2>
      {lede && <p className="mt-3 max-w-2xl font-display text-sm leading-[1.6] text-darkgray md:text-base">{lede}</p>}
    </div>
  );
}
function Sub({ children }) {
  return <h3 className="mt-8 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-flare">// {children}</h3>;
}
function Card({ title, children, accent = "ozone" }) {
  const c = accent === "green" ? "border-[#39FF14]/30" : accent === "flare" ? "border-flare/30" : "border-slate2/50";
  return (
    <div className={`border ${c} bg-card p-5`}>
      {title && <div className="font-display text-base font-bold tracking-[-0.01em] text-silver">{title}</div>}
      <div className="mt-1.5 font-display text-[13px] leading-[1.6] text-darkgray">{children}</div>
    </div>
  );
}

export default function Brand() {
  const [story, setStory] = useState("Medium");

  return (
    <div className="relative min-h-screen bg-void page-top grid-bg">
      <HorizonProgress />
      <Nav />
      <main className="px-5 pb-24 pt-28 md:px-8">
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs items={[{ label: "Brand" }]} className="mb-6" />

          {/* Hero */}
          <div className="border-b border-slate2/50 pb-8">
            <Eyebrow>// Brand Standards · Ad Free Streets</Eyebrow>
            <h1 className="mt-3 font-display text-5xl font-bold leading-[0.98] tracking-[-0.03em] text-silver md:text-7xl">
              The brand<br />guidelines.
            </h1>
            <p className="mt-4 max-w-2xl font-display text-sm leading-[1.6] text-darkgray md:text-base">
              Our guiding compass. Strategy sets the foundation; language keeps our voice consistent. These tenets shape every design and messaging decision we make.
            </p>
          </div>

          {/* Section nav */}
          <nav className="sticky top-16 z-20 -mx-5 mt-6 flex flex-wrap gap-1.5 border-b border-slate2/40 bg-void/90 px-5 py-3 backdrop-blur md:mx-0 md:rounded md:border md:border-slate2/50 md:px-3">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className={`flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${s.done ? "border-slate2/60 text-darkgray hover:border-ozone hover:text-ozone" : "border-slate2/40 text-dim"}`}>
                <s.icon className="h-3 w-3" /> {s.label}{!s.done && <span className="text-[7px] text-flare">soon</span>}
              </a>
            ))}
          </nav>

          {/* ───────── STRATEGY ───────── */}
          <SectionHead id="strategy" kicker="01 · Strategy" title="Strategy" lede="This is our guiding compass. These ideas set the foundation for our brand, and their central tenets shape future decisions." />

          <Sub>Positioning</Sub>
          <div className="mt-3 border-l-2 border-ozone/60 pl-5">
            <p className="font-display text-xl font-semibold leading-[1.35] text-silver md:text-2xl">AdFree Streets is a citizen-driven platform that empowers communities to reclaim public spaces from intrusive corporate advertising.</p>
            <p className="mt-3 font-display text-sm leading-[1.6] text-darkgray">Fostering community engagement and advocacy — turning passive observers into active participants in shaping the aesthetic and cultural integrity of their surroundings.</p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <Card title="Vision" accent="ozone">
              Our vision is a world where public spaces are vibrant, culturally rich, and free from the overwhelming presence of intrusive corporate advertising. We aspire to empower communities to take control of their urban environments — so public spaces reflect the values, creativity, and spirit of the people who live there.
            </Card>
            <Card title="Mission" accent="ozone">
              We empower individuals and communities to challenge and transform the dominance of corporate advertising in public space. We provide user-friendly tools to report, object, and creatively reimagine outdoor ads — amplifying community voices, removing propaganda that drives needless consumption and waste, and ensuring public space serves people, not just commercial interests.
            </Card>
          </div>

          <Sub>Audience</Sub>
          <p className="mt-2 font-display text-sm leading-[1.6] text-darkgray">A closer look at the groups that help the movement thrive — who they are and how they think should shape our design and messaging.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {AUDIENCE.map((a) => (
              <div key={a.name} className="border border-slate2/50 bg-card p-5">
                <div className="font-display text-base font-bold text-silver">{a.name}</div>
                <ul className="mt-3 space-y-1.5">
                  {a.needs.map((n) => (
                    <li key={n} className="flex items-start gap-2 font-display text-[12.5px] leading-[1.5] text-darkgray"><span className="mt-1.5 h-1 w-1 shrink-0 bg-ozone" /> {n}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Sub>Values</Sub>
          <p className="mt-2 font-display text-sm leading-[1.6] text-darkgray">Core beliefs that shape our internal culture and are expressed to the world — critical to the brand's existing and future developments.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(([t, d]) => <Card key={t} title={t}>{d}</Card>)}
          </div>

          <Sub>Personality</Sub>
          <p className="mt-2 font-display text-sm leading-[1.6] text-darkgray">A unique set of characteristics that make our brand feel human. We maintain this personality across all communications.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PERSONALITY.map(([t, d]) => <Card key={t} title={t} accent="flare">{d}</Card>)}
          </div>

          {/* ───────── LANGUAGE ───────── */}
          <div className="mt-16" />
          <SectionHead id="language" kicker="02 · Language" title="Language" lede="Language guidance helps everyone who communicates on behalf of the brand express a consistent tone and message, so audiences have a cohesive experience." />

          <Sub>Tagline</Sub>
          <div className="mt-3 border border-ozone/40 bg-ozone/[0.04] p-6 text-center">
            <p className="font-display text-2xl font-black tracking-[-0.02em] text-ozone md:text-4xl">Creative Activism for a Better Urban Landscape.</p>
          </div>

          <Sub>Principles</Sub>
          <p className="mt-2 font-display text-sm leading-[1.6] text-darkgray">Refer to these when authoring written content. They guide the tone, structure, and content of everything we write.</p>
          <div className="mt-4 space-y-2.5">
            {PRINCIPLES.map(([name, principle, application], i) => (
              <div key={name} className="border border-slate2/50 bg-card p-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm font-black text-ozone">{String(i + 1).padStart(2, "0")}</span>
                  <div className="font-display text-base font-bold text-silver">{name}</div>
                </div>
                <p className="mt-2 font-display text-[13px] leading-[1.6] text-silver/80"><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-flare">Principle · </span>{principle}</p>
                <p className="mt-1.5 font-display text-[13px] leading-[1.6] text-darkgray"><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">Application · </span>{application}</p>
              </div>
            ))}
          </div>

          <Sub>Story</Sub>
          <div className="mt-3">
            <div className="inline-flex border border-slate2/60 bg-void p-1">
              {Object.keys(STORY).map((k) => (
                <button key={k} onClick={() => setStory(k)} className={`px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${story === k ? "bg-ozone text-void" : "text-darkgray hover:text-ozone"}`}>{k}</button>
              ))}
            </div>
            <p className="mt-4 max-w-3xl font-display text-[14px] leading-[1.7] text-silver/85">{STORY[story]}</p>
          </div>

          <Sub>Headlines</Sub>
          <p className="mt-2 font-display text-sm leading-[1.6] text-darkgray">High-impact, best used when space and time are limited. Always deliver on our brand personality.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {HEADLINES.map(([group, lines]) => (
              <div key={group} className="border border-slate2/50 bg-card p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-flare">{group}</div>
                <ul className="mt-3 space-y-2">
                  {lines.map((l) => <li key={l} className="font-display text-base font-bold leading-[1.2] tracking-[-0.01em] text-silver">"{l}"</li>)}
                </ul>
              </div>
            ))}
          </div>

          <Sub>Calls to action</Sub>
          <p className="mt-2 font-display text-sm leading-[1.6] text-darkgray">Clarity and brevity are critical. Avoid ambiguous actions or drawn-out phrasing. Use action verbs.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="border border-[#39FF14]/30 bg-card p-5">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-[#39FF14]"><Check className="h-3.5 w-3.5" /> Do</div>
              <ul className="mt-3 space-y-2">{CTA_DO.map((c) => <li key={c} className="font-display text-sm text-silver/85">{c}</li>)}</ul>
            </div>
            <div className="border border-[#FF0040]/30 bg-card p-5">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-[#FF0040]"><X className="h-3.5 w-3.5" /> Don't</div>
              <ul className="mt-3 space-y-2">{CTA_DONT.map((c) => <li key={c} className="font-display text-sm text-darkgray line-through decoration-[#FF0040]/40">{c}</li>)}</ul>
            </div>
          </div>

          {/* ───────── COMING NEXT ───────── */}
          <div className="mt-16" />
          <SectionHead id="logo" kicker="03–06 · Visual system" title="Logo · Photography · Graphic · Applications" lede="The visual sections are next. Their guidance is set — logo lockups and don'ts, photography categories (billboards, bus stops, subway), the iconography + 'keys' access system and offense-type icon set, and applications from cards to out-of-home. These are asset-heavy, so the imagery is being prepped for hosting." />
          <div id="photography" /><div id="graphic" /><div id="applications" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[["Logo", "Primary + supporting marks, on-colour pairings, clear space, scaling, social icon, don'ts."], ["Photography", "Categories — billboards, bus stops, subway — plus principles and don'ts."], ["Graphic", "Iconography, the 'Yeah we got keys for that' access guide, offense-type icons, posters."], ["Applications", "Business cards, merch, signage, print, out-of-home, digital ads, web + app."]].map(([t, d]) => (
              <div key={t} className="border border-dashed border-slate2/50 bg-card/40 p-5">
                <div className="flex items-center justify-between"><div className="font-display text-base font-bold text-silver">{t}</div><span className="border border-flare/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">Soon</span></div>
                <p className="mt-2 font-display text-[12.5px] leading-[1.5] text-darkgray">{d}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-2 border-t border-slate2/50 pt-6">
            <Link to="/kit" className="inline-flex items-center gap-1.5 border border-slate2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">UI Kit <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            <Link to="/" className="inline-flex items-center gap-1.5 border border-slate2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
