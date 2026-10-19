import { useState, useEffect } from 'react';
import Nav from '@/components/ooh/Nav';
import HorizonProgress from '@/components/ooh/HorizonProgress';
import CryptoDonations from '@/components/ooh/campaign/CryptoDonations';
import StripeDonate from '@/components/ooh/campaign/StripeDonate';
import LeadCapture from '@/components/ooh/campaign/LeadCapture';
import MovementContext from '@/components/ooh/MovementContext';
import WalletButton from '@/components/ooh/WalletButton';
import DonationWatcher from '@/components/ooh/campaign/DonationWatcher';
import { CAMPAIGN } from '@/components/ooh/fundConfig';
import { base44 } from '@/api/base44Client';
import { trackEvent } from '@/lib/trackEvent';
import { fundingTotalView, FUNDING_UNAVAILABLE_LABEL } from '@/lib/fundingTotal';
import { Megaphone, CheckCircle2 } from 'lucide-react';

const PAYMENT_CONFIRMED_SESSION_KEY = 'ooh_payment_confirmed_session';
const CONFIRM_POLL_ATTEMPTS = 4;
const CONFIRM_POLL_DELAY_MS = 2500;

export default function Campaign() {
  const [thanks, setThanks] = useState(false);
  const [funding, setFunding] = useState(
    /** @type {import('@/lib/fundingTotal').FundingTotalView | { state: 'loading' }} */ ({
      state: 'loading',
    }),
  );
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'thanks') setThanks(true);

    // payment_confirmed is never inferred from this URL alone -- the session
    // id it carries is just a capability token for asking the server (which
    // only reflects stripeWebhook's own durable state) whether this specific
    // checkout actually completed. The webhook can land a moment after the
    // browser redirect, so this polls briefly rather than checking once.
    const sessionId = urlParams.get('session_id');
    if (!sessionId) return;
    if (sessionStorage.getItem(PAYMENT_CONFIRMED_SESSION_KEY) === sessionId) return;

    let cancelled = false;
    (async () => {
      for (let attempt = 0; attempt < CONFIRM_POLL_ATTEMPTS && !cancelled; attempt++) {
        try {
          const res = await base44.functions.invoke('donationStatus', { session_id: sessionId });
          if (res?.data?.confirmed) {
            if (!cancelled) {
              trackEvent('payment_confirmed', { offer: 'donation' });
              sessionStorage.setItem(PAYMENT_CONFIRMED_SESSION_KEY, sessionId);
            }
            return;
          }
        } catch {
          /* a transient check failure should not stop the remaining attempts,
             and must never affect the thank-you page itself */
        }
        if (!cancelled) await new Promise((r) => setTimeout(r, CONFIRM_POLL_DELAY_MS));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Funding total: fieldStats.raised is an unverified sum of FundingLead rows
  // (pledges/manual entries/unchecked provider rows), so it is never shown as
  // money raised. A total appears only if the backend returns a provider-verified
  // object (see src/lib/fundingTotal.js); otherwise it is "unavailable", not $0.
  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke('fieldStats', {})
      .then((res) => {
        if (!cancelled) setFunding(fundingTotalView(res?.data ?? res));
      })
      .catch(() => {
        if (!cancelled) setFunding({ state: 'unavailable' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pct =
    funding.state === 'verified'
      ? Math.min(100, Math.round((funding.amount / CAMPAIGN.goalUsd) * 100))
      : 0;

  return (
    <div className="relative min-h-screen bg-void">
      <HorizonProgress />
      <Nav />
      <main className="page-top px-4 pb-24 md:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">
            // Campaign · live · urgent
          </span>
          <h1 className="mt-3 font-display text-5xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-7xl">
            {CAMPAIGN.tagline}
          </h1>
          <p className="mt-4 max-w-2xl font-display text-sm leading-[1.6] text-darkgray">
            {CAMPAIGN.urgency}
          </p>

          {thanks && (
            <div className="mt-6 flex items-center gap-2 border border-ozone/50 bg-ozone/5 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-ozone" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
                Thank you. A payment counts as received only once the payment provider confirms it.
              </span>
            </div>
          )}

          <div className="mt-6 overflow-hidden border border-slate2/60 bg-card p-4 md:p-5">
            <div className="flex items-end justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.25em]">
              <span className="text-ozone" data-testid="funding-total">
                {funding.state === 'verified'
                  ? `$${funding.amount.toLocaleString()} verified`
                  : funding.state === 'loading'
                    ? 'Checking funding total…'
                    : FUNDING_UNAVAILABLE_LABEL}
              </span>
              <span className="text-dim">Target ${CAMPAIGN.goalUsd.toLocaleString()}</span>
            </div>
            {funding.state === 'verified' && (
              <div className="mt-2 h-1.5 w-full overflow-hidden bg-slate2/40">
                <div
                  className="h-full bg-ozone transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-dim">
              {funding.state === 'verified'
                ? `Provider-verified as of ${new Date(funding.asOf).toLocaleDateString('en-GB')}. The target is a goal, not a result.`
                : 'Payments are not yet reconciled against provider records, so no total is shown. This does not mean nothing has been received. The target is a goal, not a result.'}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-3">
            <StripeDonate />
            <CryptoDonations />
            <LeadCapture />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 border border-slate2/40 bg-card/50 p-4">
            <span className="w-full font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
              // Crypto native? Connect your wallet
            </span>
            <WalletButton chain="solana" />
            <WalletButton chain="evm" />
          </div>

          <div className="mt-10">
            <DonationWatcher />
          </div>

          <MovementContext className="mt-12" />

          <div className="mt-10 flex items-start gap-3 border-t border-slate2/40 pt-6">
            <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-ozone" />
            <p className="font-display text-sm leading-[1.6] text-darkgray">
              Confirmed contributions support the open record, field documentation, and creative
              adbusting work. Funding is not evidence of reach, impact, or complete coverage.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
