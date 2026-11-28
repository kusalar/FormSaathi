/**
 * Sanitizes post-authentication redirect paths to prevent open-redirect vulnerabilities.
 * Only permits safe relative paths within the same origin.
 */
export function sanitizeRedirectPath(
  rawNext: string | null | undefined,
  fallback = "/profile"
): string {
  if (!rawNext || typeof rawNext !== "string") return fallback;
  const trimmed = rawNext.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return fallback;
  if (/[\r\n\t\0\\]/.test(trimmed)) return fallback;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("/%2f") || lower.startsWith("/%5c")) return fallback;

  return trimmed;
}
