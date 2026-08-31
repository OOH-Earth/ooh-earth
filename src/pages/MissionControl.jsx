import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Command, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { APP_ENV } from '@/lib/appEnv';
import {
  ENVIRONMENTS,
  environmentFromBuild,
  fetchMissionControlHealth,
  serviceRows,
} from '@/lib/missionControlData';
import { buildSystemBrief, normalizeEvidence, rollbackAssessment } from '@/lib/jarvisReasoning';
import {
  assessAutopilotRollback,
  buildRemediationPlan,
  diagnoseAutopilot,
  nextBestAction,
} from '@/lib/autopilotReasoning';
import '@/styles/mission-control.css';

const formatTime = (value) => {
  if (!value) return 'UNKNOWN';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'UNKNOWN'
    : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' });
};
const formatDuration = (value) =>
  Number.isFinite(Number(value)) ? `${Math.round(Number(value))} ms` : 'UNKNOWN';
const statusClass = (status) => String(status || 'UNKNOWN').toLowerCase();

function QueryState({ error }) {
  const title =
    error?.code === 'AUTHORIZATION_REQUIRED'
      ? 'AUTHORIZATION REQUIRED'
      : error?.code === 'INVALID_OPERATIONAL_CONTRACT'
        ? 'INVALID OPERATIONAL CONTRACT'
        : 'OPERATIONAL DATA UNAVAILABLE';
  const copy =
    error?.code === 'AUTHORIZATION_REQUIRED'
      ? 'This surface is protected by the application admin boundary. Sign in with an authorized operator identity.'
      : error?.code === 'INVALID_OPERATIONAL_CONTRACT'
        ? 'The endpoint responded, but not with the allowlisted Mission Control contract.'
        : 'The bounded health source could not be read. Native logs remain an independent channel and are not substituted here.';
  return (
    <div className="mc-notice" role="alert">
      <strong>{title}</strong>
      <br />
      {copy}
    </div>
  );
}

function CommandPalette({ onClose, onCommand }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const commands = [
    ['overview', 'Go to System Overview', '⌘ 1'],
    ['production', 'Show Production', '⌘ 2'],
    ['backup', 'Show BACKUP', '⌘ 3'],
    ['services', 'Show Services', '⌘ 4'],
    ['release', 'Show Release', '⌘ 5'],
    ['security', 'Show Security', '⌘ 6'],
    ['evidence', 'Show Evidence', '⌘ 7'],
    ['refresh', 'Refresh health', 'R'],
    ['jarvis', 'Ask: System status', '⌘ 8'],
    ['evidence', 'Explain Production health', '⌘ 9'],
    ['release', 'Explain release', '⌘ 0'],
    ['security', 'Show unknowns', 'U'],
    ['jarvis', 'Recommended next action', 'N'],
    ['rollback', 'Assess rollback', 'B'],
    ['release', 'Release status', ''],
    ['jarvis', 'What changed?', ''],
    ['jarvis', 'Show attention', ''],
    ['evidence', 'Show stale evidence', ''],
    ['jarvis', 'Compare environments', ''],
    ['evidence', 'Why?', ''],
    ['refresh', 'Refresh evidence', ''],
    ['autopilot', 'Critical capability health', ''],
    ['autopilot', 'What needs attention?', ''],
    ['autopilot', 'Diagnose Production', ''],
    ['autopilot', 'Compare BACKUP and Production', ''],
    ['autopilot', 'Generate remediation plan', ''],
    ['autopilot', 'What should I check next?', ''],
  ];
  const filtered = commands.filter(([, label]) =>
    label.toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => setActive(0), [query]);
  const choose = (command) => {
    onCommand(command);
    onClose();
  };
  return (
    <div
      className="mc-command-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="mc-command"
        role="dialog"
        aria-modal="true"
        aria-label="Mission Control commands"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Mission Control"
          aria-label="Search commands"
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, filtered.length - 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            }
            if (event.key === 'Enter' && filtered[active]) choose(filtered[active][0]);
          }}
        />
        <ul>
          {filtered.map(([id, label, shortcut], index) => (
            <li className={index === active ? 'active' : ''} key={id}>
              <button type="button" onClick={() => choose(id)}>
                <span>{label}</span>
                <kbd>{shortcut}</kbd>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function JarvisPanel({ environment, health }) {
  const evidence = useMemo(
    () => normalizeEvidence({ environment, health, release: health?.release }),
    [environment, health],
  );
  const brief = useMemo(() => buildSystemBrief(evidence), [evidence]);
  const rollback = useMemo(() => rollbackAssessment(brief), [brief]);
  const autopilot = useMemo(
    () =>
      diagnoseAutopilot({
        evidence: {
          production: environment === 'production' ? health?.services || [] : [],
          backup: environment === 'backup' ? health?.services || [] : [],
        },
      }),
    [environment, health],
  );
  const nextAction = useMemo(() => nextBestAction(autopilot), [autopilot]);
  const remediationPlan = useMemo(() => buildRemediationPlan(autopilot), [autopilot]);
  const autopilotRollback = useMemo(() => assessAutopilotRollback(autopilot), [autopilot]);
  return (
    <section id="jarvis" className="mc-panel mc-jarvis" aria-label="JARVIS read-only system brief">
      <div className="mc-panel-pad">
        <div className="mc-panel-title">
          <div>
            <h2>JARVIS / system brief</h2>
            <p>Deterministic reasoning over bounded evidence · read-only</p>
          </div>
          <span className={`mc-pill ${brief.status === 'HEALTHY' ? 'verified' : 'missing'}`}>
            {brief.risk}
          </span>
        </div>
        <div className="mc-jarvis-grid">
          <div>
            <div className="mc-jarvis-label">HOW ARE WE?</div>
            <p className="mc-jarvis-statement">{brief.statement}</p>
            <div className="mc-jarvis-label">NEXT ACTION</div>
            <p className="mc-jarvis-copy">{brief.recommendation}</p>
          </div>
          <div>
            <div className="mc-jarvis-label">RELEASE TRUTH</div>
            <p className="mc-jarvis-copy">
              Candidate: <strong>{brief.release.candidate_sha}</strong>
              <br />
              State: <strong>{brief.release.release_state}</strong>
              <br />
              Runtime identity: <strong>{brief.release.runtime_revision}</strong>
            </p>
            <div className="mc-jarvis-label">ROLLBACK ADVISOR</div>
            <p className="mc-jarvis-copy">
              <strong>{rollback.classification}</strong> · {rollback.statement}
            </p>
            <div className="mc-jarvis-label">RELEASE DRIFT</div>
            <p className="mc-jarvis-copy">
              <strong>{brief.drift.state}</strong> · {brief.drift.statement}
            </p>
          </div>
        </div>
        <div className="mc-jarvis-attention" aria-label="JARVIS limitations">
          <div className="mc-jarvis-label">UNKNOWN / LIMITATIONS</div>
          {brief.attention.map((item) => (
            <p key={item}>— {item}</p>
          ))}
        </div>
        <div className="mc-jarvis-grid mc-jarvis-detail-grid">
          <div>
            <div className="mc-jarvis-label">SERVICE COVERAGE</div>
            <p className="mc-jarvis-copy">
              {brief.coverage.verified_count} verified · {brief.coverage.stale_count} stale ·{' '}
              {brief.coverage.unknown_count} unknown
            </p>
          </div>
          <div>
            <div className="mc-jarvis-label">ATTENTION</div>
            {brief.attention_items.length ? (
              brief.attention_items.slice(0, 3).map((item) => (
                <p className="mc-jarvis-copy" key={item.reason}>
                  <strong>{item.priority}</strong> {item.reason}
                </p>
              ))
            ) : (
              <p className="mc-jarvis-copy">No deterministic attention items.</p>
            )}
          </div>
        </div>
        <div className="mc-jarvis-grid mc-jarvis-detail-grid" id="autopilot">
          <div>
            <div className="mc-jarvis-label">AUTOPILOT DIAGNOSIS / READ-ONLY</div>
            <p className="mc-jarvis-copy">
              <strong>{autopilot.systemState}</strong> ·{' '}
              {autopilot.diagnosis[0]?.statement || 'UNKNOWN'}
            </p>
            <div className="mc-jarvis-label">NEXT BEST ACTION</div>
            <p className="mc-jarvis-copy">
              <strong>{nextAction.classification}</strong> · {nextAction.action}
            </p>
          </div>
          <div>
            <div className="mc-jarvis-label">REMEDIATION PLAN</div>
            <p className="mc-jarvis-copy">{remediationPlan.diagnostic_steps[0]}</p>
            <div className="mc-jarvis-label">ROLLBACK INTELLIGENCE</div>
            <p className="mc-jarvis-copy">
              <strong>{autopilotRollback.classification}</strong> · {autopilotRollback.statement}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HealthPanel({ environment, health, isLoading, error, onRefresh }) {
  const target = ENVIRONMENTS[environment];
  const rows = serviceRows(health);
  const fieldStats = rows.find((row) => row.service === 'fieldStats')?.snapshot;
  const runtimeRelease =
    fieldStats?.release && fieldStats.release !== 'unknown' ? fieldStats.release : 'UNKNOWN';
  const releaseCandidate = health?.release?.git_sha || 'UNKNOWN';
  const releaseState = health?.release?.release_state || 'UNKNOWN';
  const ciState = [
    'CI_QUALIFIED',
    'BACKUP_DEPLOYED',
    'BACKUP_VERIFIED',
    'PRODUCTION_APPROVED',
    'PRODUCTION_DEPLOYED',
    'PRODUCTION_VERIFIED',
    'CERTIFIED',
  ].includes(releaseState)
    ? 'VERIFIED'
    : 'NOT VERIFIED';
  return (
    <>
      <div className="mc-statusline">
        <span>
          READING <strong>{target.label}</strong> / OPERATIONALHEALTH
        </span>
        <span>
          {isLoading
            ? 'FETCHING…'
            : health?.generated_at
              ? `OBSERVED ${formatTime(health.generated_at)}`
              : 'OBSERVATION UNKNOWN'}
        </span>
      </div>
      {error ? <QueryState error={error} /> : null}
      <section id="overview" className="mc-grid" aria-label="System overview">
        <div className="mc-panel">
          <div className="mc-panel-pad">
            <div className="mc-panel-title">
              <div>
                <h2>System core</h2>
                <p>Aggregate state from bounded operational snapshots</p>
              </div>
              <span
                className={`mc-pill ${health?.evidence_status === 'VERIFIED' ? 'verified' : 'missing'}`}
              >
                {health?.evidence_status || 'INSUFFICIENT_DATA'}
              </span>
            </div>
            <div className="mc-overview">
              <div
                className={`mc-core ${statusClass(health?.status)}`}
                role="img"
                aria-label={`System status ${health?.status || 'UNKNOWN'}`}
              >
                <div className="mc-core-label">
                  <strong>{health?.status || 'UNKNOWN'}</strong>
                  <span>{target.short}</span>
                </div>
              </div>
              <div className="mc-facts">
                <div className="mc-fact">
                  <label>Environment</label>
                  <span className="mc-value-display">{target.label}</span>
                </div>
                <div className="mc-fact">
                  <label>Evidence quality</label>
                  <span
                    className={health?.evidence_status === 'VERIFIED' ? 'mc-healthy' : 'mc-warning'}
                  >
                    {health?.evidence_status || 'INSUFFICIENT_DATA'}
                  </span>
                </div>
                <div className="mc-fact">
                  <label>Services with evidence</label>
                  <span className="mc-value-display">
                    {health?.services?.length || 0} / 1 instrumented
                  </span>
                </div>
                <div className="mc-fact">
                  <label>Last observation</label>
                  <span className="mc-value-display">{formatTime(health?.generated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mc-panel" id="release">
          <div className="mc-panel-pad">
            <div className="mc-panel-title">
              <div>
                <h2>Release truth</h2>
                <p>Claims are separated by evidence source</p>
              </div>
              <ExternalLink size={15} aria-hidden="true" />
            </div>
            <table className="mc-table">
              <tbody>
                <tr>
                  <td>Deployment candidate</td>
                  <td>
                    {releaseCandidate}
                    <small className="mc-muted">Static artifact manifest</small>
                  </td>
                </tr>
                <tr>
                  <td>Runtime revision</td>
                  <td>
                    {runtimeRelease}
                    <small className="mc-muted">Base44 release field</small>
                  </td>
                </tr>
                <tr>
                  <td>CI / qualification</td>
                  <td>
                    {ciState}
                    <small className="mc-muted">Manifest state: {releaseState}</small>
                  </td>
                </tr>
                <tr>
                  <td>Native log retrieval</td>
                  <td className="mc-warning">
                    NOT VERIFIED<small className="mc-muted">Runtime-dependent</small>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <JarvisPanel environment={environment} health={health} />
      <section className="mc-panel" id="services" style={{ marginTop: 16 }}>
        <div className="mc-panel-pad">
          <div className="mc-panel-title">
            <div>
              <h2>Service matrix</h2>
              <p>Only fieldStats has a production operational-state pilot</p>
            </div>
            <Activity size={16} aria-hidden="true" />
          </div>
          <div className="mc-service-list">
            {rows.map(({ service, snapshot }) => (
              <div className="mc-service" key={service}>
                <div className="mc-service-name">
                  <strong>{service}</strong>
                  <span>{snapshot ? snapshot.environment : 'PERSISTENCE NOT ENABLED'}</span>
                </div>
                <div className="mc-value">
                  State
                  <strong
                    className={snapshot ? `mc-${statusClass(snapshot.status)}` : 'mc-unknown'}
                  >
                    {snapshot?.status || 'NOT INSTRUMENTED'}
                  </strong>
                </div>
                <div className="mc-value">
                  Evidence<strong>{snapshot?.evidence_status || 'UNKNOWN'}</strong>
                </div>
                <div className="mc-value">
                  Last success<strong>{formatTime(snapshot?.last_success_at)}</strong>
                </div>
              </div>
            ))}
          </div>
          {!fieldStats && !error ? (
            <div className="mc-notice">
              EVIDENCE NOT YET AVAILABLE — this environment has no returned fieldStats snapshot.
            </div>
          ) : null}
        </div>
      </section>
      <div className="mc-lower">
        <section className="mc-panel" id="evidence">
          <div className="mc-panel-pad">
            <div className="mc-panel-title">
              <div>
                <h2>Evidence inspector</h2>
                <p>Why the system core reports its current state</p>
              </div>
              <ShieldCheck size={16} aria-hidden="true" />
            </div>
            {fieldStats ? (
              <div className="mc-evidence">
                <p>
                  <strong>{target.label}</strong> → <strong>{fieldStats.service}</strong> →{' '}
                  <strong>{fieldStats.status}</strong>
                </p>
                <p>
                  <strong>Classification:</strong> {fieldStats.evidence_status}
                </p>
                <p>
                  <strong>Observed:</strong>{' '}
                  {formatTime(fieldStats.updated_at || health.generated_at)}
                </p>
                <p>
                  <strong>Duration:</strong> {formatDuration(fieldStats.last_duration_ms)}
                </p>
                <p>
                  <strong>Source:</strong> authenticated operationalHealth response
                </p>
                <p className="mc-muted">
                  Limitations: runtime release identity is unknown; native log retrieval and gateway
                  correlation propagation remain not verified.
                </p>
              </div>
            ) : (
              <div className="mc-notice">
                INSUFFICIENT DATA — no allowlisted snapshot is available to inspect.
              </div>
            )}
          </div>
        </section>
        <section className="mc-panel" id="security">
          <div className="mc-panel-pad">
            <div className="mc-panel-title">
              <div>
                <h2>Security posture</h2>
                <p>Boundary facts only; no live attack statistics</p>
              </div>
              <ShieldCheck size={16} aria-hidden="true" />
            </div>
            <table className="mc-table">
              <tbody>
                <tr>
                  <td>Mission Control route</td>
                  <td>AUTHENTICATED</td>
                </tr>
                <tr>
                  <td>Operational health read</td>
                  <td>
                    {error?.code === 'AUTHORIZATION_REQUIRED'
                      ? 'REJECTED'
                      : health
                        ? 'AUTHORIZED'
                        : 'UNKNOWN'}
                  </td>
                </tr>
                <tr>
                  <td>Runtime health</td>
                  <td>ADMIN-ONLY</td>
                </tr>
                <tr>
                  <td>Response redaction</td>
                  <td>VERIFIED</td>
                </tr>
                <tr>
                  <td>Mutating controls</td>
                  <td>NONE IN V1</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <div className="mc-notice" role="note">
        {health ? 'REAL OPERATIONAL DATA' : 'OPERATIONAL DATA PENDING'} · Refresh is bounded to
        manual action or the repository query policy. No request payloads, PII, secrets, Stripe
        bodies, or native log text are rendered.
      </div>
      <button type="button" className="mc-sr-only" onClick={onRefresh}>
        Refresh operational health
      </button>
    </>
  );
}

export default function MissionControl() {
  const { isAuthenticated } = useAuth();
  const [environment, setEnvironment] = useState(environmentFromBuild());
  const [palette, setPalette] = useState(false);
  const query = useQuery({
    queryKey: ['mission-control', 'operational-health', environment],
    queryFn: () => fetchMissionControlHealth(environment),
    enabled: Boolean(isAuthenticated),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
  const refresh = useCallback(() => query.refetch(), [query]);
  const command = useCallback(
    (id) => {
      if (id === 'production' || id === 'backup') setEnvironment(id);
      else if (id === 'refresh') refresh();
      else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [refresh],
  );
  useEffect(() => {
    const key = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPalette(true);
      }
      if (event.key === 'Escape') setPalette(false);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const envNote = useMemo(
    () =>
      APP_ENV === 'stage'
        ? 'This build is the BACKUP operator surface.'
        : 'This build is the Production operator surface.',
    [],
  );
  return (
    <main className="mc-shell">
      <div className="mc-frame">
        <header className="mc-topbar">
          <div>
            <div className="mc-kicker">OOH EARTH / RELIABILITY PLATFORM</div>
            <h1 className="mc-brand">
              Mission <span>Control</span>
            </h1>
          </div>
          <div className="mc-toolbar">
            <button
              type="button"
              className="mc-button"
              onClick={() => setPalette(true)}
              aria-label="Open command palette"
            >
              <Command size={15} aria-hidden="true" /> <small>⌘K COMMANDS</small>
            </button>
            <button
              type="button"
              className="mc-button"
              onClick={() => refresh()}
              aria-label="Refresh health"
              disabled={query.isFetching}
            >
              <RefreshCw
                size={15}
                aria-hidden="true"
                className={query.isFetching ? 'animate-spin' : ''}
              />{' '}
              <small>{query.isFetching ? 'FETCHING' : 'REFRESH'}</small>
            </button>
          </div>
        </header>
        <p className="mc-kicker" style={{ margin: '15px 0 0' }}>
          {envNote}
        </p>
        <nav aria-label="Environment selector" style={{ display: 'flex', gap: 8, marginTop: 13 }}>
          <button
            className="mc-button"
            type="button"
            aria-pressed={environment === 'production'}
            onClick={() => setEnvironment('production')}
          >
            PRODUCTION
          </button>
          <button
            className="mc-button"
            type="button"
            aria-pressed={environment === 'backup'}
            onClick={() => setEnvironment('backup')}
          >
            BACKUP
          </button>
        </nav>
        <HealthPanel
          environment={environment}
          health={query.data}
          isLoading={query.isLoading}
          error={query.error}
          onRefresh={refresh}
        />
      </div>
      {palette ? <CommandPalette onClose={() => setPalette(false)} onCommand={command} /> : null}
    </main>
  );
}
