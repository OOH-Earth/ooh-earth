import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  { q: "Is OOH Earth really open-source?", a: "Yes — AGPL-3.0 for code, CC BY-SA 4.0 for content. The platform, maps, and field record are community-owned and aligned to the UN Sustainable Development Goals." },
  { q: "Do I need an account to use the map?", a: "No. The Field Atlas is public. Register a member handle only to file reports, mint location NFTs, or claim leads." },
  { q: "Where does my donation go?", a: "Straight to the OOH Earth treasury — platform development, field tools, and community outreach. Card donations run through Stripe; crypto lands directly on-chain." },
  { q: "How do I report an advertising offense?", a: "Open /report, drop a pin, add a photo and the access key if you know it. It saves to the public record as pending until a moderator verifies it." },
  { q: "What is adbusting?", a: "Subverting, reclaiming, or replacing corporate advertising in public space — documented, non-destructive, and part of the wider subvertising movement." },
  { q: "Can my organisation partner with OOH Earth?", a: "Yes. Use the contact form here or reach the agency directly — we work with NGOs, Adfree Cities networks, and civic-tech funders." },
];

export default function SupportFaq() {
  return (
    <Accordion type="single" collapsible className="border border-slate2">
      {FAQS.map((f, i) => (
        <AccordionItem key={i} value={`q-${i}`} className="border-b border-slate2/50 last:border-0 px-1">
          <AccordionTrigger className="px-3 py-4 text-left font-display text-sm font-semibold text-silver hover:no-underline hover:text-ozone data-[state=open]:text-ozone">
            {f.q}
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-4 font-mono text-[11px] leading-relaxed text-darkgray">
            {f.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}