import {
  FeedbackStatus,
  PrismaClient,
  Role,
  Sentiment,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORDS = {
  admin: "DemoAdmin123!",
  analyst: "DemoAnalyst123!",
  viewer: "DemoViewer123!",
} as const;

const CHANNELS = [
  "Support ticket",
  "App store review",
  "NPS survey",
  "Sales call note",
  "Community post",
] as const;

const THEMES = [
  {
    name: "Onboarding",
    description: "Setup, invites, and first-run experience",
    color: "#6366f1",
    keywords: ["onboarding", "invite", "setup", "wizard", "getting started"],
  },
  {
    name: "Billing",
    description: "Invoices, pricing, and payments",
    color: "#ef4444",
    keywords: ["billing", "invoice", "pricing", "payment", "subscription"],
  },
  {
    name: "Performance",
    description: "Speed, timeouts, and reliability",
    color: "#f59e0b",
    keywords: ["slow", "timeout", "performance", "lag", "crash", "load"],
  },
  {
    name: "Mobile",
    description: "Mobile web and app experience",
    color: "#10b981",
    keywords: ["mobile", "iphone", "android", "phone"],
  },
  {
    name: "Authentication",
    description: "Login, SSO, and password flows",
    color: "#8b5cf6",
    keywords: ["sso", "login", "password", "auth", "okta", "sign in"],
  },
  {
    name: "Export",
    description: "CSV/PDF export and data download",
    color: "#0ea5e9",
    keywords: ["export", "csv", "download", "report"],
  },
  {
    name: "Dashboard",
    description: "Charts, overview, and analytics UI",
    color: "#14b8a6",
    keywords: ["dashboard", "chart", "analytics", "overview"],
  },
  {
    name: "Integrations",
    description: "Third-party and API integrations",
    color: "#f97316",
    keywords: ["integration", "slack", "api", "webhook", "zapier"],
  },
] as const;

type SeedFeedback = {
  content: string;
  channel: (typeof CHANNELS)[number];
  customerLabel: string;
  sentiment: Sentiment;
  sentimentScore: number;
  status: FeedbackStatus;
};

const BASE_FEEDBACK: SeedFeedback[] = [
  {
    content: "Onboarding took forever — I couldn't figure out how to invite my team.",
    channel: "Support ticket",
    customerLabel: "Acme Corp",
    sentiment: "NEG",
    sentimentScore: -0.8,
    status: "NEW",
  },
  {
    content: "The new dashboard is gorgeous and finally fast. Huge improvement.",
    channel: "App store review",
    customerLabel: "Mobile User #4421",
    sentiment: "POS",
    sentimentScore: 0.9,
    status: "REVIEWED",
  },
  {
    content: "It does the job, but the mobile experience needs work.",
    channel: "NPS survey",
    customerLabel: "Survey respondent",
    sentiment: "NEU",
    sentimentScore: 0.1,
    status: "NEW",
  },
  {
    content: "Prospect wants SSO before they'll sign — third time this month.",
    channel: "Sales call note",
    customerLabel: "Enterprise prospect",
    sentiment: "NEG",
    sentimentScore: -0.5,
    status: "ACTIONED",
  },
  {
    content: "Love the new export feature, saved me an hour today.",
    channel: "Community post",
    customerLabel: "Community member",
    sentiment: "POS",
    sentimentScore: 0.85,
    status: "REVIEWED",
  },
  {
    content: "Billing page keeps timing out when I try to download an invoice.",
    channel: "Support ticket",
    customerLabel: "Finance team lead",
    sentiment: "NEG",
    sentimentScore: -0.7,
    status: "NEW",
  },
  {
    content: "Search is much better after the last update.",
    channel: "App store review",
    customerLabel: "Reviewer #882",
    sentiment: "POS",
    sentimentScore: 0.75,
    status: "ACTIONED",
  },
  {
    content: "Dark mode would be a welcome addition.",
    channel: "NPS survey",
    customerLabel: "Power user",
    sentiment: "NEU",
    sentimentScore: 0.2,
    status: "NEW",
  },
  {
    content: "We need API rate limits documented before our integration goes live.",
    channel: "Sales call note",
    customerLabel: "DevOps lead",
    sentiment: "NEU",
    sentimentScore: -0.1,
    status: "REVIEWED",
  },
  {
    content: "Customer support response time has improved significantly.",
    channel: "Community post",
    customerLabel: "Long-time customer",
    sentiment: "POS",
    sentimentScore: 0.8,
    status: "ACTIONED",
  },
  {
    content: "Unable to reset password — the email never arrives.",
    channel: "Support ticket",
    customerLabel: "New signup",
    sentiment: "NEG",
    sentimentScore: -0.9,
    status: "NEW",
  },
  {
    content: "Pricing page is confusing for teams over 50 seats.",
    channel: "NPS survey",
    customerLabel: "Team admin",
    sentiment: "NEG",
    sentimentScore: -0.4,
    status: "REVIEWED",
  },
  {
    content: "Integrations with Slack work flawlessly now.",
    channel: "App store review",
    customerLabel: "Ops manager",
    sentiment: "POS",
    sentimentScore: 0.7,
    status: "ACTIONED",
  },
  {
    content: "Would love bulk actions in the feedback inbox.",
    channel: "Community post",
    customerLabel: "Product fan",
    sentiment: "NEU",
    sentimentScore: 0.3,
    status: "NEW",
  },
  {
    content: "Security team needs SOC 2 report before procurement approval.",
    channel: "Sales call note",
    customerLabel: "Security reviewer",
    sentiment: "NEU",
    sentimentScore: 0,
    status: "REVIEWED",
  },
];

const CONTENT_TEMPLATES: Array<{
  content: string;
  sentiment: Sentiment;
  sentimentScore: number;
}> = [
  {
    content: "Onboarding checklist is unclear — our team abandoned setup after twenty minutes.",
    sentiment: "NEG",
    sentimentScore: -0.75,
  },
  {
    content: "Invite emails for onboarding land in spam for Gmail workspaces.",
    sentiment: "NEG",
    sentimentScore: -0.55,
  },
  {
    content: "Getting started guide helped our new analysts ramp in under a day.",
    sentiment: "POS",
    sentimentScore: 0.7,
  },
  {
    content: "Billing invoice PDF is missing tax ID on EU accounts.",
    sentiment: "NEG",
    sentimentScore: -0.6,
  },
  {
    content: "Subscription upgrade charged twice last month.",
    sentiment: "NEG",
    sentimentScore: -0.85,
  },
  {
    content: "Transparent pricing made procurement much easier this quarter.",
    sentiment: "POS",
    sentimentScore: 0.65,
  },
  {
    content: "Dashboard charts lag when filtering more than ninety days of data.",
    sentiment: "NEG",
    sentimentScore: -0.5,
  },
  {
    content: "Performance improved a lot after the March release — pages feel snappy.",
    sentiment: "POS",
    sentimentScore: 0.8,
  },
  {
    content: "App sometimes times out on the analytics overview during peak hours.",
    sentiment: "NEG",
    sentimentScore: -0.45,
  },
  {
    content: "Mobile layout clips status dropdowns on smaller phones.",
    sentiment: "NEG",
    sentimentScore: -0.55,
  },
  {
    content: "iPhone app store build is stable, but Android scrolling feels janky.",
    sentiment: "NEU",
    sentimentScore: -0.1,
  },
  {
    content: "Love using LOOP on mobile during standups — inbox filters are quick.",
    sentiment: "POS",
    sentimentScore: 0.75,
  },
  {
    content: "SSO with Okta fails intermittently after session timeout.",
    sentiment: "NEG",
    sentimentScore: -0.7,
  },
  {
    content: "Password reset flow is smoother after the auth redesign.",
    sentiment: "POS",
    sentimentScore: 0.6,
  },
  {
    content: "Need SCIM provisioning before we can roll out company-wide login.",
    sentiment: "NEU",
    sentimentScore: 0.05,
  },
  {
    content: "CSV export truncates long comments — blockers for weekly leadership packs.",
    sentiment: "NEG",
    sentimentScore: -0.65,
  },
  {
    content: "One-click export to CSV is exactly what our CS team needed.",
    sentiment: "POS",
    sentimentScore: 0.85,
  },
  {
    content: "Would like scheduled report downloads in addition to manual export.",
    sentiment: "NEU",
    sentimentScore: 0.25,
  },
  {
    content: "Dashboard empty states are polished — great for new workspaces.",
    sentiment: "POS",
    sentimentScore: 0.7,
  },
  {
    content: "Hard to tell which chart filters apply to top themes on the dashboard.",
    sentiment: "NEU",
    sentimentScore: -0.05,
  },
  {
    content: "Zapier integration dropped events overnight — please check webhooks.",
    sentiment: "NEG",
    sentimentScore: -0.6,
  },
  {
    content: "Slack integration posts theme spikes reliably now. Nice work.",
    sentiment: "POS",
    sentimentScore: 0.8,
  },
  {
    content: "Public API docs need pagination examples for feedback listing.",
    sentiment: "NEU",
    sentimentScore: 0.1,
  },
  {
    content: "Support ticket triage queue is missing assignee fields we rely on.",
    sentiment: "NEG",
    sentimentScore: -0.4,
  },
  {
    content: "App store reviewers keep praising the cleaner navigation.",
    sentiment: "POS",
    sentimentScore: 0.7,
  },
  {
    content: "NPS respondents mention confusing labels on the sentiment badges.",
    sentiment: "NEU",
    sentimentScore: 0,
  },
  {
    content: "Sales call: customer asked for audit logs before enterprise renewal.",
    sentiment: "NEU",
    sentimentScore: 0.05,
  },
  {
    content: "Community loves the keyboard shortcuts in the inbox.",
    sentiment: "POS",
    sentimentScore: 0.75,
  },
  {
    content: "Onboarding video is outdated — still shows the old dashboard shell.",
    sentiment: "NEG",
    sentimentScore: -0.35,
  },
  {
    content: "Billing portal should show upcoming invoice amount more clearly.",
    sentiment: "NEU",
    sentimentScore: -0.15,
  },
];

const CUSTOMERS = [
  "Acme Corp",
  "Northwind",
  "Globex",
  "Initech",
  "Umbrella Retail",
  "Stark Analytics",
  "Wayne Health",
  "Hooli Cloud",
  "Pied Piper",
  "Initrode",
  "Vandelay Imports",
  "Soylent Apps",
];

function buildSeedFeedback(): SeedFeedback[] {
  const items: SeedFeedback[] = [...BASE_FEEDBACK];

  let index = 0;
  while (items.length < 125) {
    const template = CONTENT_TEMPLATES[index % CONTENT_TEMPLATES.length];
    const channel = CHANNELS[index % CHANNELS.length];
    const customer = CUSTOMERS[index % CUSTOMERS.length];
    const statusCycle: FeedbackStatus[] = ["NEW", "REVIEWED", "ACTIONED"];

    items.push({
      content: `${template.content} (${customer} note #${index + 1})`,
      channel,
      customerLabel: customer,
      sentiment: template.sentiment,
      sentimentScore: template.sentimentScore,
      status: statusCycle[index % statusCycle.length],
    });

    index += 1;
  }

  return items;
}

function matchThemes(content: string): string[] {
  const lower = content.toLowerCase();
  return THEMES.filter((theme) =>
    theme.keywords.some((keyword) => lower.includes(keyword)),
  ).map((theme) => theme.name);
}

async function main() {
  console.log("Seeding database...");

  await prisma.feedbackTheme.deleteMany();
  await prisma.embedding.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const workspace = await prisma.workspace.create({
    data: { name: "Acme SaaS (Demo)" },
  });

  const [adminHash, analystHash, viewerHash] = await Promise.all([
    bcrypt.hash(DEMO_PASSWORDS.admin, 12),
    bcrypt.hash(DEMO_PASSWORDS.analyst, 12),
    bcrypt.hash(DEMO_PASSWORDS.viewer, 12),
  ]);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Demo Admin",
        email: "admin@demo.loop",
        passwordHash: adminHash,
        role: Role.ADMIN,
        workspaceId: workspace.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Demo Analyst",
        email: "analyst@demo.loop",
        passwordHash: analystHash,
        role: Role.ANALYST,
        workspaceId: workspace.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Demo Viewer",
        email: "viewer@demo.loop",
        passwordHash: viewerHash,
        role: Role.VIEWER,
        workspaceId: workspace.id,
      },
    }),
  ]);

  const themes = await Promise.all(
    THEMES.map((theme) =>
      prisma.theme.create({
        data: {
          name: theme.name,
          description: theme.description,
          color: theme.color,
          workspaceId: workspace.id,
        },
      }),
    ),
  );

  const themeByName = new Map(themes.map((theme) => [theme.name, theme]));
  const seedFeedback = buildSeedFeedback();

  const createdFeedback = [];
  for (let index = 0; index < seedFeedback.length; index += 1) {
    const item = seedFeedback[index];
    const created = await prisma.feedback.create({
      data: {
        content: item.content,
        channel: item.channel,
        customerLabel: item.customerLabel,
        sourceRef: `SEED-${String(index + 1).padStart(3, "0")}`,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        status: item.status,
        workspaceId: workspace.id,
        createdAt: new Date(Date.now() - index * 6 * 60 * 60 * 1000),
      },
    });
    createdFeedback.push(created);
  }

  const themeLinks = [];
  for (const feedback of createdFeedback) {
    const matched = matchThemes(feedback.content);
    for (const themeName of matched) {
      const theme = themeByName.get(themeName);
      if (!theme) continue;
      themeLinks.push({
        feedbackId: feedback.id,
        themeId: theme.id,
        confidence: 0.85,
      });
    }
  }

  if (themeLinks.length > 0) {
    await prisma.feedbackTheme.createMany({ data: themeLinks });
  }

  console.log("Seed complete.");
  console.log("");
  console.log("Demo workspace:", workspace.name);
  console.log("Demo credentials:");
  console.log("  Admin   — admin@demo.loop   / DemoAdmin123!");
  console.log("  Analyst — analyst@demo.loop / DemoAnalyst123!");
  console.log("  Viewer  — viewer@demo.loop  / DemoViewer123!");
  console.log("");
  console.log(
    `Created ${users.length} users, ${themes.length} themes, ${createdFeedback.length} feedback items, ${themeLinks.length} theme links.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
