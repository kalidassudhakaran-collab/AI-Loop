/**
 * Simple deterministic theme name normalization for M3-A.
 * Full clustering belongs in M3-B.
 */
const THEME_ALIASES: Record<string, string> = {
  login: "Authentication",
  "login issues": "Authentication",
  "login problem": "Authentication",
  auth: "Authentication",
  sso: "Authentication",
  password: "Authentication",
  signup: "Onboarding",
  "sign up": "Onboarding",
  "getting started": "Onboarding",
  invite: "Onboarding",
  invoice: "Billing",
  pricing: "Billing",
  payment: "Billing",
  subscription: "Billing",
  slow: "Performance",
  timeout: "Performance",
  lag: "Performance",
  crash: "Performance",
  iphone: "Mobile",
  android: "Mobile",
  phone: "Mobile",
  chart: "Dashboard",
  analytics: "Dashboard",
  csv: "Export",
  download: "Export",
  slack: "Integrations",
  zapier: "Integrations",
  api: "Integrations",
  webhook: "Integrations",
};

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeThemeName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "General";
  }

  const key = cleaned.toLowerCase();
  if (THEME_ALIASES[key]) {
    return THEME_ALIASES[key];
  }

  // Partial alias match for phrases like "login issues again"
  for (const [alias, canonical] of Object.entries(THEME_ALIASES)) {
    if (key.includes(alias)) {
      return canonical;
    }
  }

  return toTitleCase(cleaned);
}

export function normalizeFeatureArea(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "General";
  }
  return toTitleCase(cleaned);
}
