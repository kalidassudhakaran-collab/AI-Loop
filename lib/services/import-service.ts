import Papa from "papaparse";
import {
  createManyWorkspaceFeedback,
  type BulkFeedbackCreateInput,
} from "@/lib/services/feedback-service";
import { queueClassificationOnIngest } from "@/lib/services/ai/queue-classification";
import {
  csvRowSchema,
  normalizeChannel,
  parseOptionalDate,
} from "@/lib/validation/feedback";

export type CsvImportFailure = {
  row: number;
  message: string;
};

export type CsvImportResult = {
  imported: number;
  failed: number;
  failures: CsvImportFailure[];
  classificationQueued: number;
};

type CsvRecord = Record<string, string>;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

export async function importFeedbackCsv(
  workspaceId: string,
  csvText: string,
): Promise<CsvImportResult> {
  const parsed = Papa.parse<CsvRecord>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return {
      imported: 0,
      failed: 1,
      failures: [
        {
          row: 1,
          message: parsed.errors[0]?.message ?? "Unable to parse CSV",
        },
      ],
      classificationQueued: 0,
    };
  }

  const validRows: BulkFeedbackCreateInput[] = [];
  const failures: CsvImportFailure[] = [];

  parsed.data.forEach((raw, index) => {
    const rowNumber = index + 2; // account for header row

    const validated = csvRowSchema.safeParse({
      content: raw.content ?? "",
      channel: raw.channel ?? "",
      customer_label: raw.customer_label ?? raw.customerlabel ?? null,
      created_at: raw.created_at ?? raw.createdat ?? null,
    });

    if (!validated.success) {
      failures.push({
        row: rowNumber,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
      return;
    }

    const channel = normalizeChannel(validated.data.channel);
    if (!channel) {
      failures.push({
        row: rowNumber,
        message: `invalid channel "${validated.data.channel}"`,
      });
      return;
    }

    let createdAt: Date | undefined;
    try {
      const parsedDate = parseOptionalDate(
        validated.data.created_at,
        "date",
      );
      createdAt = parsedDate ?? undefined;
    } catch {
      failures.push({
        row: rowNumber,
        message: "invalid date",
      });
      return;
    }

    validRows.push({
      content: validated.data.content.trim(),
      channel,
      customerLabel: validated.data.customer_label?.trim() || null,
      sourceRef: `CSV-ROW-${rowNumber}`,
      createdAt,
      status: "NEW",
    });
  });

  let classificationQueued = 0;

  if (validRows.length > 0) {
    const created = await createManyWorkspaceFeedback(workspaceId, validRows);
    classificationQueued = queueClassificationOnIngest(
      workspaceId,
      created.ids,
    ).queued;
  }

  return {
    imported: validRows.length,
    failed: failures.length,
    failures,
    classificationQueued,
  };
}
