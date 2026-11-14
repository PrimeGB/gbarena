export type AuditFilters = {
  query: string;
  actor: string;
  category: string;
  audience: string;
  target: string;
  from: string;
  to: string;
};

export type AuditCursor = { at: string; id: string };

export type AuditEvent = {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  audience: string;
  category: string;
  action: string;
  source_table: string;
  target_id: string;
  target_label: string;
  target_href: string | null;
  changed_fields: string[];
  private_fields: string[];
  previous_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  transaction_id: string | null;
  reason: string;
};

export type AuditPage = {
  events: AuditEvent[];
  has_more: boolean;
  next_cursor: AuditCursor | null;
};

export const emptyAuditFilters: AuditFilters = {
  query: "", actor: "", category: "", audience: "", target: "", from: "", to: "",
};

export const auditCategories = [
  "accounts", "teams", "matches", "forums", "reports", "awards", "credits", "tournaments", "staff",
];

function dateBoundary(value: string, nextDay: boolean) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Enter a valid date.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Enter a valid date.");
  }
  if (nextDay) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

export function auditSearchParams(filters: AuditFilters, cursor: AuditCursor | null = null, limit = 50) {
  const from = dateBoundary(filters.from, false);
  const to = dateBoundary(filters.to, true);
  if (from && to && from >= to) throw new Error("The end date must not be before the start date.");
  if (filters.query.trim().length > 200 || filters.actor.trim().length > 100 || filters.target.trim().length > 100) {
    throw new Error("Shorten the search text.");
  }
  return {
    p_query: filters.query.trim(),
    p_actor: filters.actor.trim(),
    p_category: filters.category,
    p_audience: filters.audience,
    p_target: filters.target.trim(),
    p_from: from,
    p_to: to,
    p_before: cursor?.at ?? null,
    p_before_id: cursor?.id ?? null,
    p_limit: limit,
  };
}

export function auditLabel(value: string) {
  if (value === "owner") return "Founder";
  if (value === "historical_staff") return "Staff (historical rank unavailable)";
  if (value === "system") return "System / service";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function auditValue(value: unknown) {
  if (value === undefined) return "Not present";
  if (value === null) return "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function auditChanges(event: AuditEvent) {
  const fields = event.changed_fields.length
    ? event.changed_fields
    : [...new Set([...Object.keys(event.previous_values), ...Object.keys(event.new_values)])]
        .filter((field) => JSON.stringify(event.previous_values[field]) !== JSON.stringify(event.new_values[field]));
  return fields.map((field) => ({
    field,
    private: event.private_fields.includes(field),
    before: auditValue(event.previous_values[field]),
    after: auditValue(event.new_values[field]),
  }));
}
