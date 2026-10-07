import { allowlistedRendererKey } from "./renderer-allowlist";

export type EntitlementState = "UNLOCKED" | "LOCKED" | "AMBIGUOUS" | "UNAVAILABLE" | "UNKNOWN";
export type CatalogAvailability = "RUNNABLE" | "VISIBLE" | "UNAVAILABLE";

export interface PracticeSessionTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  mustChangePassword: boolean;
  expiresAt?: number;
}

export interface PracticeEntitlement {
  student: { publicId: string | null; status: string } | null;
  organizationContext: OrganizationContext | null;
  availableOrganizations: OrganizationContext[];
  practice: { state: EntitlementState };
  refreshAt: string | null;
}

export interface OrganizationContext {
  publicId: string;
  displayName: string;
  organizationType: string;
}

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
}

export interface PracticeCatalogSection {
  code: string;
  displayName: string;
  taskTypes: PracticeCatalogTask[];
}

export interface PracticeCatalog {
  productCode: string;
  title: string;
  catalogVersion: string;
  timeLimitSeconds: number;
  sections: PracticeCatalogSection[];
}

export interface PracticeChallenge {
  challengeId: string;
  expiresAt: string;
}

export function normalizeEntitlementResponse(value: unknown): PracticeEntitlement {
  const record = asRecord(value);
  const student = asRecord(record.student);
  const practice = asRecord(record.practice);
  const state = normalizeEntitlementState(practice.state);

  return {
    student: student
      ? {
          publicId: asNullableString(student.publicId),
          status: asString(student.status, "UNKNOWN"),
        }
      : null,
    organizationContext: normalizeOrganization(record.organizationContext),
    availableOrganizations: asArray(record.availableOrganizations)
      .map(normalizeOrganization)
      .filter((organization): organization is OrganizationContext => organization !== null),
    practice: { state },
    refreshAt: asNullableString(record.refreshAt),
  };
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
  entitlementState: EntitlementState | null,
  task: Pick<PracticeCatalogTask, "availability">,
): boolean {
  return entitlementState === "UNLOCKED" && task.availability === "RUNNABLE";
}

function normalizeCatalogSection(value: unknown): PracticeCatalogSection | null {
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
  };
}

function normalizeOrganization(value: unknown): OrganizationContext | null {
  const record = asRecord(value);
  const publicId = asString(record.publicId, "");
  if (!publicId) return null;
  return {
    publicId,
    displayName: asString(record.displayName, "Organization"),
    organizationType: asString(record.organizationType, "Organization"),
  };
}

function normalizeEntitlementState(value: unknown): EntitlementState {
  if (value === "UNLOCKED" || value === "LOCKED" || value === "AMBIGUOUS" || value === "UNAVAILABLE") {
    return value;
  }
  return "UNKNOWN";
}

function normalizeAvailability(value: unknown): CatalogAvailability {
  if (value === "RUNNABLE" || value === "VISIBLE" || value === "UNAVAILABLE") return value;
  return "UNAVAILABLE";
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
