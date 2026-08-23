import { Role, Sentiment } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORDS = {
  admin: "DemoAdmin123!",
  analyst: "DemoAnalyst123!",
  viewer: "DemoViewer123!",
} as const;

const SAMPLE_FEEDBACK: Array<{
  content: string;
  channel: string;
  customerLabel: string;
  sentiment?: Sentiment;
  sentimentScore?: number;
}> = [
  {
    content:
      "Onboarding took forever — I couldn't figure out how to invite my team.",
    channel: "Support ticket",
    customerLabel: "Acme Corp",
    sentiment: "NEG",
    sentimentScore: -0.8,
  },
  {
    content:
      "The new dashboard is gorgeous and finally fast. Huge improvement.",
    channel: "App store review",
    customerLabel: "Mobile User #4421",
    sentiment: "POS",
    sentimentScore: 0.9,
  },
  {
    content: "It does the job, but the mobile experience needs work.",
    channel: "NPS survey",
    customerLabel: "Survey respondent",
    sentiment: "NEU",
    sentimentScore: 0.1,
  },
  {
    content: "Prospect wants SSO before they'll sign — third time this month.",
    channel: "Sales call note",
    customerLabel: "Enterprise prospect",
    sentiment: "NEG",
    sentimentScore: -0.5,
  },
  {
    content: "Love the new export feature, saved me an hour today.",
    channel: "Community post",
    customerLabel: "Community member",
    sentiment: "POS",
    sentimentScore: 0.85,
  },
  {
    content:
      "Billing page keeps timing out when I try to download an invoice.",
    channel: "Support ticket",
    customerLabel: "Finance team lead",
    sentiment: "NEG",
    sentimentScore: -0.7,
  },
  {
    content: "Search is much better after the last update.",
    channel: "App store review",
    customerLabel: "Reviewer #882",
    sentiment: "POS",
    sentimentScore: 0.75,
  },
  {
    content: "Dark mode would be a welcome addition.",
    channel: "NPS survey",
    customerLabel: "Power user",
    sentiment: "NEU",
    sentimentScore: 0.2,
  },
  {
    content: "We need API rate limits documented before our integration goes live.",
    channel: "Sales call note",
    customerLabel: "DevOps lead",
    sentiment: "NEU",
    sentimentScore: -0.1,
  },
  {
    content: "Customer support response time has improved significantly.",
    channel: "Community post",
    customerLabel: "Long-time customer",
    sentiment: "POS",
    sentimentScore: 0.8,
  },
  {
    content: "Unable to reset password — the email never arrives.",
    channel: "Support ticket",
    customerLabel: "New signup",
    sentiment: "NEG",
    sentimentScore: -0.9,
  },
  {
    content: "Pricing page is confusing for teams over 50 seats.",
    channel: "NPS survey",
    customerLabel: "Team admin",
    sentiment: "NEG",
    sentimentScore: -0.4,
  },
  {
    content: "Integrations with Slack work flawlessly now.",
    channel: "App store review",
    customerLabel: "Ops manager",
    sentiment: "POS",
    sentimentScore: 0.7,
  },
  {
    content: "Would love bulk actions in the feedback inbox.",
    channel: "Community post",
    customerLabel: "Product fan",
    sentiment: "NEU",
    sentimentScore: 0.3,
  },
  {
    content: "Security team needs SOC 2 report before procurement approval.",
    channel: "Sales call note",
    customerLabel: "Security reviewer",
    sentiment: "NEU",
    sentimentScore: 0,
  },
];

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

  await prisma.feedback.createMany({
    data: SAMPLE_FEEDBACK.map((item, index) => ({
      content: item.content,
      channel: item.channel,
      customerLabel: item.customerLabel,
      sourceRef: `SEED-${String(index + 1).padStart(3, "0")}`,
      sentiment: item.sentiment ?? null,
      sentimentScore: item.sentimentScore ?? null,
      status: "NEW",
      workspaceId: workspace.id,
      createdAt: new Date(Date.now() - index * 86_400_000),
    })),
  });

  console.log("Seed complete.");
  console.log("");
  console.log("Demo workspace:", workspace.name);
  console.log("Demo credentials:");
  console.log("  Admin   — admin@demo.loop   / DemoAdmin123!");
  console.log("  Analyst — analyst@demo.loop / DemoAnalyst123!");
  console.log("  Viewer  — viewer@demo.loop  / DemoViewer123!");
  console.log("");
  console.log(`Created ${users.length} users and ${SAMPLE_FEEDBACK.length} feedback items.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
