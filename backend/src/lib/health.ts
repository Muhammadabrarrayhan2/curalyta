/**
 * Health check used by GET /health and GET /api/health.
 *
 * Runs a trivial query against the database and reports the overall status,
 * database latency, and total response time. Returns HTTP 503 when the
 * database is unreachable so load balancers and uptime checks see a failure.
 */

export interface HealthResult {
  httpStatus: 200 | 503;
  body: {
    status: 'ok' | 'error';
    service: string;
    version: string;
    timestamp: string;
    uptimeSeconds: number;
    responseTimeMs: number;
    database: { status: 'up' | 'down'; latencyMs: number | null };
  };
}

interface CheckHealthInput {
  ping: () => Promise<unknown>;
  timeoutMs?: number;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Health check timed out')), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function checkHealth(input: CheckHealthInput): Promise<HealthResult> {
  const started = process.hrtime.bigint();
  const elapsedMs = () => Number(process.hrtime.bigint() - started) / 1e6;

  let dbUp = false;
  let dbLatency: number | null = null;
  try {
    await withTimeout(input.ping(), input.timeoutMs ?? 3000);
    dbLatency = Math.round(elapsedMs() * 10) / 10;
    dbUp = true;
  } catch {
    dbUp = false;
  }

  return {
    httpStatus: dbUp ? 200 : 503,
    body: {
      status: dbUp ? 'ok' : 'error',
      service: 'curalyta-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      responseTimeMs: Math.round(elapsedMs() * 10) / 10,
      database: { status: dbUp ? 'up' : 'down', latencyMs: dbLatency },
    },
  };
}
