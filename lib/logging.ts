/**
 * Learn LMS — Structured Application Logger & Observability
 * Production-ready JSON logging with correlation IDs, log levels, and PII masking.
 */

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "SECURITY";

export interface LogContext {
  correlationId?: string;
  userId?: string;
  role?: string;
  path?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "secret",
  "jwt_secret",
  "authorization",
  "cookie",
  "privatekey",
  "d",
  "evm_signer_private_key",
]);

function maskSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      masked[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export function log(
  level: LogLevel,
  event: string,
  message: string,
  context?: LogContext
): void {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    event,
    message,
    ...(context ? (maskSensitiveData(context) as LogContext) : {}),
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case "ERROR":
    case "SECURITY":
      console.error(output);
      break;
    case "WARN":
      console.warn(output);
      break;
    default:
      console.log(output);
      break;
  }
}

export const logger = {
  debug: (event: string, msg: string, ctx?: LogContext) => log("DEBUG", event, msg, ctx),
  info: (event: string, msg: string, ctx?: LogContext) => log("INFO", event, msg, ctx),
  warn: (event: string, msg: string, ctx?: LogContext) => log("WARN", event, msg, ctx),
  error: (event: string, msg: string, ctx?: LogContext) => log("ERROR", event, msg, ctx),
  security: (event: string, msg: string, ctx?: LogContext) => log("SECURITY", event, msg, ctx),
};
