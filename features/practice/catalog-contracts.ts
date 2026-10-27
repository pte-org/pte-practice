import { asArray, asNullableNumber, asNullableString, asNumber, asRecord, asString, humanize } from "./contract-helpers";
import { allowlistedRendererKey, isClientRuntimeSupported } from "./renderer-allowlist";

export type CatalogAvailability = "RUNNABLE" | "VISIBLE" | "UNAVAILABLE";

export interface PracticeCatalogTask {
  code: string;
  displayName: string;
  section: string;
  scored: boolean;
  availability: CatalogAvailability;
  unavailableReason: string | null;
  profileKey: string | null;
  profileVersion: number | null;
  rendererKey: string | null;
  contractVersion: number | null;
  answerSchemaVersion: number | null;
  requiredClientCapabilities: string[];
  contentStatus: string | null;
  provenance: string | null;
  /** Whether the active Score Template can pace this task in timed mode; false when the server did not say. */
  timedAvailable: boolean;
  timedUnavailableReason: string | null;
  /** Distinct questions of this task type the student has answered; 0 when the server did not say. */
  answeredQuestionCount: number;
  /** Mean score (0-100) of the student's scored answers; null while none is scored. */
  averageScore: number | null;
}

export interface PracticeCatalogSection {
  code: string;
  displayName: string;
  taskTypes: PracticeCatalogTask[];
  /** Practice-ready questions of the skill; 0 when the server did not say. */
  practiceQuestionCount: number;
  /** Distinct questions of the skill the student has answered; 0 when the server did not say. */
  answeredQuestionCount: number;
}

export interface PracticeCatalog {
  productCode: string;
  title: string;
  catalogVersion: string;
  /** Deprecated: sessions have no overall limit any more, the server always sends 0. */
  timeLimitSeconds: number;
  sections: PracticeCatalogSection[];
}

export function normalizeCatalogResponse(value: unknown): PracticeCatalog | null {
  const record = asRecord(value);
  const sections = asArray(record.sections)
    .map(normalizeCatalogSection)
    .filter((section): section is PracticeCatalogSection => section !== null);

  if (!asString(record.productCode, "") || sections.length === 0) return null;

  return {
    productCode: asString(record.productCode, "PTE_CORE_PRACTICE"),
    title: asString(record.title, "PTE Practice"),
    catalogVersion: asString(record.catalogVersion, "unknown"),
    timeLimitSeconds: asNumber(record.timeLimitSeconds, 0),
    sections,
  };
}

export function canStartPractice(
  entitlementState: string | null,
  task: Pick<PracticeCatalogTask, "availability" | "rendererKey">,
): boolean {
  return entitlementState === "UNLOCKED" && task.availability === "RUNNABLE"
    && isClientRuntimeSupported(task.rendererKey);
}

export function normalizeCatalogSection(value: unknown): PracticeCatalogSection | null {
  const record = asRecord(value);
  const taskTypes = asArray(record.taskTypes)
    .map(normalizeCatalogTask)
    .filter((task): task is PracticeCatalogTask => task !== null);
  const code = asString(record.code, "");
  if (!code || taskTypes.length === 0) return null;
  return {
    code,
    displayName: asString(record.displayName, humanize(code)),
    taskTypes,
    practiceQuestionCount: Math.max(0, asNumber(record.practiceQuestionCount, 0)),
    answeredQuestionCount: Math.max(0, asNumber(record.answeredQuestionCount, 0)),
  };
}

function normalizeCatalogTask(value: unknown): PracticeCatalogTask | null {
  const record = asRecord(value);
  const code = asString(record.code, "");
  if (!code) return null;
  return {
    code,
    displayName: asString(record.displayName, humanize(code)),
    section: asString(record.section, "UNKNOWN"),
    scored: Boolean(record.scored),
    availability: normalizeAvailability(record.availability),
    unavailableReason: asNullableString(record.unavailableReason),
    profileKey: asNullableString(record.profileKey),
    profileVersion: asNullableNumber(record.profileVersion),
    rendererKey: allowlistedRendererKey(record.rendererKey),
    contractVersion: asNullableNumber(record.contractVersion),
    answerSchemaVersion: asNullableNumber(record.answerSchemaVersion),
    requiredClientCapabilities: asArray(record.requiredClientCapabilities).filter(
      (capability): capability is string => typeof capability === "string",
    ),
    contentStatus: asNullableString(record.contentStatus),
    provenance: asNullableString(record.provenance),
    timedAvailable: record.timedAvailable === true,
    timedUnavailableReason: asNullableString(record.timedUnavailableReason),
    answeredQuestionCount: Math.max(0, asNumber(record.answeredQuestionCount, 0)),
    averageScore: asNullableNumber(record.averageScore),
  };
}

function normalizeAvailability(value: unknown): CatalogAvailability {
  if (value === "RUNNABLE" || value === "VISIBLE" || value === "UNAVAILABLE") return value;
  return "UNAVAILABLE";
}
