/**
 * Every environment lookup in the app lives here. Moving from a laptop to a
 * private endpoint should mean setting these, and nothing else.
 */
export type Config = {
  port: number;
  isProduction: boolean;
  /**
   * Allowed browser origin for the socket handshake. In production the client
   * is served by this same process, so same-origin is the default and no value
   * is required. In dev, Vite serves the client from another port.
   */
  corsOrigin: string | string[] | boolean;
};

const DEFAULT_PORT = 3001;
const DEV_CLIENT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function readPort(): number {
  const raw = process.env.PORT;
  if (!raw) return DEFAULT_PORT;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0 || parsed > 65_535) {
    throw new Error(`Invalid PORT: ${raw}`);
  }
  return parsed;
}

export function loadConfig(): Config {
  const isProduction = process.env.NODE_ENV === 'production';
  const configured = process.env.CORS_ORIGIN?.trim();

  return {
    port: readPort(),
    isProduction,
    corsOrigin: configured
      ? configured.split(',').map((origin) => origin.trim())
      : isProduction
        ? false // same-origin only: the client is served from this process
        : DEV_CLIENT_ORIGINS,
  };
}
