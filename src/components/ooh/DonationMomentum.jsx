import { FUNDING_UNAVAILABLE_LABEL } from '@/lib/fundingTotal';
import { CAMPAIGN } from '@/components/ooh/fundConfig';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';

// The Home funding strip used to sum every FundingLead row (pledges and leads
// included) as "raised" and to show a wallet balance as "on-chain · live".
// Neither is verified funding, so only the configured target is shown here; see
// src/lib/fundingTotal.js and the Campaign page.
export default function DonationMomentum() {
  const goal = CAMPAIGN.goalUsd;
  const fmt = (n) => '$' + Math.round(n).toLocaleString('en-US');

  return (
    <section id="momentum" className="border-t border-slate2/40 bg-void">
      <div className="hi-vis-stripes h-1 w-full opacity-60" />
      <div className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
                // Field offensive — live
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-5xl">
                {CAMPAIGN.tagline}
              </h2>
            </div>
            <Link
              to="/campaign"
              className="flex shrink-0 items-center gap-2 border-2 border-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
              style={{ backgroundColor: '#EDFF00' }}
            >
              <Rocket className="h-3.5 w-3.5" /> Fund the offensive
            </Link>
          </div>

          <div className="mt-8">
            <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
              <span className="text-ozone">{FUNDING_UNAVAILABLE_LABEL}</span>
              <span className="text-dim">{fmt(goal)} target</span>
            </div>
            <div className="mt-2 text-right font-mono text-[9px] uppercase tracking-[0.18em] text-dim">
              The target is a goal, not a result
            </div>
          </div>

          <p className="mt-6 max-w-xl font-display text-sm font-normal leading-[1.5] text-darkgray">
            {CAMPAIGN.urgency}
          </p>
        </div>
      </div>
    </section>
  );
}
