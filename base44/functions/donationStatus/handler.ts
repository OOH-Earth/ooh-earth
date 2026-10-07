const MAX_SESSION_ID_LENGTH = 255;
// Real Stripe Checkout Session ids look like cs_live_... / cs_test_...
const SESSION_ID_PATTERN = /^cs_[A-Za-z0-9_]{10,}$/;

function isValidSessionId(value: unknown) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_SESSION_ID_LENGTH &&
    SESSION_ID_PATTERN.test(value)
  );
}

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
};

// Read-only, unauthenticated (donations require no login) confirmation check
// for the donation success page. The opaque Stripe session id from the
// browser's success_url is the only input, and the only thing this ever
// returns is a boolean -- no FundingLead fields, no arbitrary lookup, no
// enumeration surface beyond "does this exact session id have a confirmed
// record" (session ids are Stripe-generated, high-entropy, and not
// guessable). stripeWebhook remains the sole writer of FundingLead; this
// function never creates or mutates anything.
export async function handleDonationStatus(
  req: Request,
  { createClientFromRequest }: Dependencies,
) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'POST only' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = body?.session_id;
    if (!isValidSessionId(sessionId)) {
      return Response.json({ error: 'Invalid session id' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const hits = await base44.asServiceRole.entities.FundingLead.filter(
      { ext_ref: sessionId },
      '-created_date',
      1,
    );
    return Response.json({ confirmed: !!(hits && hits.length) });
  } catch (error) {
    console.error('donationStatus error:', error instanceof Error ? error.message : 'unknown');
    // Fail closed on unconfirmed, never surface the underlying error -- this
    // is a best-effort read for analytics, not something the donation flow
    // itself depends on.
    return Response.json({ confirmed: false });
  }
}
