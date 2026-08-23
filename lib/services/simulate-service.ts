import type { Sentiment } from "@prisma/client";
import { createManyWorkspaceFeedback } from "@/lib/services/feedback-service";
import { FEEDBACK_CHANNELS } from "@/lib/validation/feedback";

type SimulatedItem = {
  content: string;
  channel: (typeof FEEDBACK_CHANNELS)[number];
  customerLabel: string;
  sentiment: Sentiment;
  sentimentScore: number;
};

const SUPPORT_TICKETS: SimulatedItem[] = [
  {
    content:
      "Onboarding wizard hangs on step 3 when inviting teammates via email.",
    channel: "Support ticket",
    customerLabel: "Acme Ops",
    sentiment: "NEG",
    sentimentScore: -0.75,
  },
  {
    content:
      "Billing page times out when downloading invoices from last quarter.",
    channel: "Support ticket",
    customerLabel: "Finance Lead",
    sentiment: "NEG",
    sentimentScore: -0.7,
  },
  {
    content:
      "Password reset emails never arrive — tried three times this morning.",
    channel: "Support ticket",
    customerLabel: "New signup",
    sentiment: "NEG",
    sentimentScore: -0.9,
  },
  {
    content:
      "SSO login works for Google but fails for Okta with a generic 500.",
    channel: "Support ticket",
    customerLabel: "Enterprise IT",
    sentiment: "NEG",
    sentimentScore: -0.65,
  },
  {
    content:
      "Export to CSV truncates long feedback comments after 255 characters.",
    channel: "Support ticket",
    customerLabel: "Product Analyst",
    sentiment: "NEG",
    sentimentScore: -0.55,
  },
  {
    content:
      "Dashboard charts load slowly on accounts with more than 10k feedback items.",
    channel: "Support ticket",
    customerLabel: "Growth Team",
    sentiment: "NEG",
    sentimentScore: -0.5,
  },
  {
    content:
      "Mobile web layout clips the filter bar on iPhone SE — cannot change status.",
    channel: "Support ticket",
    customerLabel: "Field Manager",
    sentiment: "NEG",
    sentimentScore: -0.6,
  },
  {
    content:
      "Support replied in under an hour and walked me through the inbox filters. Great experience.",
    channel: "Support ticket",
    customerLabel: "Happy Customer",
    sentiment: "POS",
    sentimentScore: 0.85,
  },
];

export async function simulateSupportTicketChannel(workspaceId: string) {
  const now = Date.now();

  const rows = SUPPORT_TICKETS.map((item, index) => ({
    content: item.content,
    channel: item.channel,
    customerLabel: item.customerLabel,
    sourceRef: `SIM-SUPPORT-${Date.now()}-${index + 1}`,
    sentiment: item.sentiment,
    sentimentScore: item.sentimentScore,
    status: "NEW" as const,
    createdAt: new Date(now - index * 3_600_000),
  }));

  const result = await createManyWorkspaceFeedback(workspaceId, rows);

  return {
    channel: "Support ticket",
    created: result.count,
  };
}
