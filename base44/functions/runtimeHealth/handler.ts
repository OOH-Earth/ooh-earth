import { correlationHeaders, telemetryFor } from './telemetry.ts';

function isAppAdmin(user: any) {
  const role = user?.role ?? user?.data?.role ?? 'user';
  const access = user?.access ?? user?.data?.access ?? 'member';
  return !!user && (role === 'admin' || access === 'admin');
}

export async function handleRuntimeHealth(
  req: Request,
  {
    createClientFromRequest,
    getEnv = (name: string) => Deno.env.get(name),
  }: {
    createClientFromRequest: (req: Request) => any;
    getEnv?: (name: string) => string | undefined;
  },
) {
  const telemetry = telemetryFor(req, { functionName: 'runtimeHealth', getEnv });
  if (req.method !== 'GET') {
    telemetry.finish('rejected', { error_code: 'INVALID_METHOD' });
    return Response.json(
      { error: 'GET only' },
      { status: 405, headers: correlationHeaders(telemetry) },
    );
  }
  try {
    const user = await createClientFromRequest(req).auth.me();
    if (!isAppAdmin(user)) {
      telemetry.finish('rejected', { error_code: 'AUTH_REQUIRED' });
      return Response.json(
        { error: 'Forbidden' },
        { status: 403, headers: correlationHeaders(telemetry) },
      );
    }
    const release = getEnv('BASE44_RELEASE_ID') || getEnv('RELEASE_ID') || 'unknown';
    telemetry.finish('success', { operation: 'health' });
    return Response.json(
      {
        status: 'ok',
        release: /^[A-Za-z0-9._:-]{1,96}$/.test(release) ? release : 'unknown',
        timestamp: Date.now(),
      },
      { headers: correlationHeaders(telemetry) },
    );
  } catch {
    telemetry.finish('failed', { error_code: 'INTERNAL_FAILURE' });
    return Response.json(
      { error: 'Health unavailable' },
      { status: 503, headers: correlationHeaders(telemetry) },
    );
  }
}
