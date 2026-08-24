/**
 * Deterministic canonical theme normalization (no Claude / no embeddings).
 * Keep the alias dictionary small and intentional — full semantic clustering is future work.
 */

export const CANONICAL_THEMES = [
  "Authentication",
  "Onboarding",
  "Billing",
  "Performance",
  "Mobile",
  "Dashboard",
  "Export",
  "Integrations",
  "Search",
  "Notifications",
  "Reporting",
  "Support",
  "General",
] as const;

export type CanonicalThemeName = (typeof CANONICAL_THEMES)[number];

/** Exact phrase → canonical theme (after scrubbing). Keep this list short. */
const EXACT_ALIASES: Record<string, CanonicalThemeName> = {
  login: "Authentication",
  "log in": "Authentication",
  "sign in": "Authentication",
  signin: "Authentication",
  auth: "Authentication",
  authentication: "Authentication",
  sso: "Authentication",
  password: "Authentication",
  "password reset": "Authentication",
  okta: "Authentication",
  onboarding: "Onboarding",
  "getting started": "Onboarding",
  setup: "Onboarding",
  invite: "Onboarding",
  "sign up": "Onboarding",
  signup: "Onboarding",
  billing: "Billing",
  invoice: "Billing",
  pricing: "Billing",
  payment: "Billing",
  subscription: "Billing",
  performance: "Performance",
  slow: "Performance",
  timeout: "Performance",
  lag: "Performance",
  crash: "Performance",
  mobile: "Mobile",
  iphone: "Mobile",
  android: "Mobile",
  phone: "Mobile",
  dashboard: "Dashboard",
  chart: "Dashboard",
  analytics: "Dashboard",
  overview: "Dashboard",
  export: "Export",
  csv: "Export",
  download: "Export",
  integrations: "Integrations",
  integration: "Integrations",
  slack: "Integrations",
  zapier: "Integrations",
  api: "Integrations",
  webhook: "Integrations",
  search: "Search",
  notifications: "Notifications",
  notification: "Notifications",
  alerts: "Notifications",
  reporting: "Reporting",
  report: "Reporting",
  support: "Support",
};

/** Keyword token → canonical (used when exact match fails). */
const KEYWORD_ALIASES: Array<{ keyword: string; theme: CanonicalThemeName }> = [
  { keyword: "login", theme: "Authentication" },
  { keyword: "signin", theme: "Authentication" },
  { keyword: "password", theme: "Authentication" },
  { keyword: "sso", theme: "Authentication" },
  { keyword: "auth", theme: "Authentication" },
  { keyword: "onboard", theme: "Onboarding" },
  { keyword: "invite", theme: "Onboarding" },
  { keyword: "billing", theme: "Billing" },
  { keyword: "invoice", theme: "Billing" },
  { keyword: "pricing", theme: "Billing" },
  { keyword: "payment", theme: "Billing" },
  { keyword: "slow", theme: "Performance" },
  { keyword: "timeout", theme: "Performance" },
  { keyword: "performance", theme: "Performance" },
  { keyword: "mobile", theme: "Mobile" },
  { keyword: "iphone", theme: "Mobile" },
  { keyword: "android", theme: "Mobile" },
  { keyword: "dashboard", theme: "Dashboard" },
  { keyword: "export", theme: "Export" },
  { keyword: "csv", theme: "Export" },
  { keyword: "slack", theme: "Integrations" },
  { keyword: "zapier", theme: "Integrations" },
  { keyword: "webhook", theme: "Integrations" },
  { keyword: "search", theme: "Search" },
  { keyword: "notif", theme: "Notifications" },
  { keyword: "report", theme: "Reporting" },
];

function scrub(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[_/\\|+]+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Map a free-form theme label to a canonical workspace theme name.
 */
export function normalizeThemeName(raw: string): string {
  const cleaned = scrub(raw);
  if (!cleaned) {
    return "General";
  }

  if (EXACT_ALIASES[cleaned]) {
    return EXACT_ALIASES[cleaned];
  }

  // Prefer longer keywords first to avoid weak short matches.
  const sorted = [...KEYWORD_ALIASES].sort(
    (a, b) => b.keyword.length - a.keyword.length,
  );
  for (const entry of sorted) {
    if (
      cleaned === entry.keyword ||
      cleaned.includes(` ${entry.keyword} `) ||
      cleaned.startsWith(`${entry.keyword} `) ||
      cleaned.endsWith(` ${entry.keyword}`)
    ) {
      return entry.theme;
    }
  }

  // Already a known canonical name (case-insensitive).
  const known = CANONICAL_THEMES.find(
    (theme) => theme.toLowerCase() === cleaned,
  );
  if (known) {
    return known;
  }

  return toTitleCase(cleaned);
}

export function normalizeFeatureArea(raw: string): string {
  const cleaned = scrub(raw);
  if (!cleaned) {
    return "General";
  }
  return toTitleCase(cleaned);
}

/**
 * Given existing workspace theme names, prefer an exact canonical match
 * after normalization, else return the normalized label for create.
 */
export function resolveCanonicalThemeName(
  raw: string,
  existingNames: string[],
): string {
  const normalized = normalizeThemeName(raw);
  const match = existingNames.find(
    (name) => name.toLowerCase() === normalized.toLowerCase(),
  );
  return match ?? normalized;
}
