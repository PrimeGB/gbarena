"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "../../../lib/supabase";
import {
  auditCategories, auditChanges, auditLabel, auditSearchParams, emptyAuditFilters,
  type AuditCursor, type AuditEvent, type AuditFilters, type AuditPage,
} from "../../../lib/ownerAudit";

type Tab = "snapshot" | "logs" | "lookup" | "coverage";
type Coverage = {
  retention_months: number;
  cleanup_scheduled: boolean;
  legacy_staff_events: number;
  legacy_moderation_events: number;
  sources: {
    table_name: string;
    category: string;
    capture_started_at: string;
    active: boolean;
    recorded_fields: string[];
    private_fields: string[];
    events_7d: number;
  }[];
};
type Lookup = {
  accounts: { id: string; username: string; role: string; created_at: string }[];
  teams: {
    id: string; name: string; platform: string; game: string; ladder: string;
    owner_id: string | null; owner_username: string | null; created_at: string;
  }[];
};

const tabs: { key: Tab; label: string }[] = [
  { key: "snapshot", label: "Site snapshot" },
  { key: "logs", label: "Search activity logs" },
  { key: "lookup", label: "Find account / team" },
  { key: "coverage", label: "Coverage & services" },
];

function formText(form: FormData, name: string) {
  return String(form.get(name) || "");
}

export default function FounderAuditCenter({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>("snapshot");
  const [filters, setFilters] = useState<AuditFilters>(emptyAuditFilters);
  const [cursor, setCursor] = useState<AuditCursor | null>(null);
  const [auditPage, setAuditPage] = useState<AuditPage | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [coverageError, setCoverageError] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupRequest, setLookupRequest] = useState(0);
  const [retry, setRetry] = useState(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  useEffect(() => {
    if (tab !== "logs") return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setLogLoading(true);
      setLogError("");
      const { data, error } = await supabase.rpc("owner_search_audit", auditSearchParams(filters, cursor));
      if (cancelled) return;
      setLogLoading(false);
      if (error || !data) {
        setLogError(`Activity logs could not be loaded: ${error?.message || "No data was returned."}`);
        return;
      }
      const result = data as AuditPage;
      setAuditPage((previous) => ({
        ...result,
        events: cursor && previous
          ? [...previous.events, ...result.events.filter((event) => !previous.events.some((old) => old.id === event.id))]
          : result.events,
      }));
    });
    return () => { cancelled = true; };
  }, [tab, filters, cursor, retry]);

  useEffect(() => {
    if (tab !== "coverage") return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      const { data, error } = await supabase.rpc("owner_audit_coverage");
      if (cancelled) return;
      if (error || !data) {
        setCoverageError(`Logging coverage could not be loaded: ${error?.message || "No data was returned."}`);
      } else {
        setCoverage(data as Coverage);
        setCoverageError("");
      }
    });
    return () => { cancelled = true; };
  }, [tab, retry]);

  useEffect(() => {
    if (!lookupRequest) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      const { data, error } = await supabase.rpc("owner_lookup_accounts_teams", { p_query: lookupQuery });
      if (cancelled) return;
      setLookupLoading(false);
      if (error || !data) {
        setLookupError(`Account / team lookup failed: ${error?.message || "No data was returned."}`);
      } else {
        setLookup(data as Lookup);
      }
    });
    return () => { cancelled = true; };
  }, [lookupQuery, lookupRequest]);

  function applyFilters(next: AuditFilters) {
    try {
      auditSearchParams(next);
    } catch (error) {
      setLogError(error instanceof Error ? error.message : "Invalid search filters.");
      return;
    }
    setLogError("");
    setExportNotice("");
    setAuditPage(null);
    setCursor(null);
    setFilters(next);
    setTab("logs");
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    applyFilters({
      query: formText(form, "query"), actor: formText(form, "actor"),
      target: formText(form, "target"), category: formText(form, "category"),
      audience: formText(form, "audience"), from: formText(form, "from"), to: formText(form, "to"),
    });
  }

  function findAccountTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = formText(new FormData(event.currentTarget), "lookup").trim();
    if (query.length < 2 || query.length > 100) {
      setLookupError("Enter between 2 and 100 characters.");
      return;
    }
    setLookupError("");
    setLookup(null);
    setLookupLoading(true);
    setLookupQuery(query);
    setLookupRequest((request) => request + 1);
  }

  async function exportLogs() {
    setExporting(true);
    setExportNotice("");
    setLogError("");
    try {
      const events: AuditEvent[] = [];
      let next: AuditCursor | null = null;
      let more = true;
      while (more) {
        const { data, error } = await supabase.rpc("owner_search_audit", auditSearchParams(filters, next, 200));
        if (!alive.current) return;
        if (error || !data) throw new Error(error?.message || "No log data was returned.");
        const result = data as AuditPage;
        events.push(...result.events);
        more = result.has_more;
        if (events.length >= 5000 && more) {
          throw new Error("More than 5,000 records match. Narrow the date range or filters before downloading; no partial file was saved.");
        }
        if (more && (!result.next_cursor || result.next_cursor.id === next?.id)) {
          throw new Error("The log cursor did not advance. No partial file was saved.");
        }
        next = result.next_cursor;
      }
      const { error: exportError } = await supabase.rpc("owner_record_audit_export", {
        p_count: events.length, p_category: filters.category, p_from: auditSearchParams(filters).p_from,
        p_to: auditSearchParams(filters).p_to,
      });
      if (!alive.current) return;
      if (exportError) throw new Error(`The export could not be recorded: ${exportError.message}`);
      const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), filters, events }, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gamebattles-audit-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportNotice(`Downloaded ${events.length.toLocaleString()} matching records. Keep this private file secure.`);
    } catch (error) {
      if (alive.current) setLogError(`Log download failed: ${error instanceof Error ? error.message : "Unexpected error."}`);
    } finally {
      if (alive.current) setExporting(false);
    }
  }

  return (
    <div className="founder-audit-center">
      <nav className="founder-audit-tabs" aria-label="Site overview sections">
        {tabs.map((item) => (
          <button type="button" key={item.key} aria-pressed={tab === item.key}
            onClick={() => setTab(item.key)}>{item.label}</button>
        ))}
      </nav>
      {tab === "snapshot" && children}
      {tab === "logs" && (
        <section className="founder-audit-body" aria-labelledby="founder-log-title">
          <div className="founder-audit-heading">
            <div>
              <p className="founder-overview-kicker">SEARCHABLE AUDIT TRAIL</p>
              <h3 id="founder-log-title">Staff, member & system activity</h3>
              <p>Successful saved actions, newest first. Expand a record to see changes and related IDs.</p>
            </div>
            <button type="button" disabled={exporting || logLoading || !auditPage?.events.length}
              onClick={() => void exportLogs()}>{exporting ? "Preparing download..." : "Download filtered logs"}</button>
          </div>
          <form className="founder-audit-filters" onSubmit={search} key={JSON.stringify(filters)}>
            <label className="founder-audit-wide">Search activity
              <input name="query" defaultValue={filters.query} maxLength={200} placeholder="Action, username, record ID or transaction ID" />
            </label>
            <label>Actor
              <input name="actor" defaultValue={filters.actor} maxLength={100} placeholder="Username or account ID" />
            </label>
            <label>Target
              <input name="target" defaultValue={filters.target} maxLength={100} placeholder="Account, team, match or record ID" />
            </label>
            <label>Category
              <select name="category" defaultValue={filters.category}>
                <option value="">All categories</option>
                {auditCategories.map((category) => <option key={category} value={category}>{auditLabel(category)}</option>)}
              </select>
            </label>
            <label>Performed by
              <select name="audience" defaultValue={filters.audience}>
                <option value="">Everyone</option>
                <option value="staff">Staff</option><option value="member">Members</option>
                <option value="system">System / service</option><option value="unknown">Unknown actor</option>
              </select>
            </label>
            <label>From date (UTC)<input type="date" name="from" defaultValue={filters.from} /></label>
            <label>Through date (UTC)<input type="date" name="to" defaultValue={filters.to} /></label>
            <div className="founder-audit-form-actions">
              <button type="submit" disabled={exporting}>Search logs</button>
              <button type="button" disabled={exporting} onClick={() => applyFilters({ ...emptyAuditFilters })}>Clear filters</button>
            </div>
          </form>
          <p className="founder-audit-note">New capture starts with this release and is retained for 12 months.
            Existing staff and moderation logs are also included. This is not a record of every page visit or failed attempt.
            Downloads include all matching records, up to 5,000; use filters for larger histories.</p>
          {logError && <p className="founder-audit-error" role="alert">{logError}
            <button type="button" onClick={() => setRetry((value) => value + 1)}>Retry logs</button>
          </p>}
          {exportNotice && <p className="founder-audit-note" role="status">{exportNotice}</p>}
          {logLoading && <p role="status">Loading activity logs...</p>}
          {auditPage && (
            <>
              <p className="founder-audit-count">{auditPage.events.length.toLocaleString()} records loaded
                {auditPage.has_more ? " · More available" : " · End of results"}</p>
              {!auditPage.events.length && <p>No saved actions match these filters. Earlier unlogged member actions cannot be recovered.</p>}
              <div className="founder-audit-list">
                {auditPage.events.map((event) => (
                  <details className="founder-audit-event" key={event.id}>
                    <summary>
                      <span className="founder-audit-category">{auditLabel(event.category)}</span>
                      <span><strong>{auditLabel(event.action)}</strong><small>{event.actor_name} · {auditLabel(event.actor_role)}</small></span>
                      <span className="founder-audit-target">{event.target_label}</span>
                      <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time>
                    </summary>
                    <div className="founder-audit-event-detail">
                      <dl>
                        <div><dt>Record ID</dt><dd>{event.id}</dd></div>
                        <div><dt>Time (UTC)</dt><dd>{event.created_at}</dd></div>
                        <div><dt>Actor ID</dt><dd>{event.actor_id || "No authenticated actor (system/service write)"}</dd></div>
                        <div><dt>Target ID</dt><dd>{event.target_id || "Not recorded in historical log"}</dd></div>
                        <div><dt>Source</dt><dd>{event.source_table}</dd></div>
                        <div><dt>Transaction</dt><dd>{event.transaction_id || "Not recorded in historical log"}</dd></div>
                      </dl>
                      <div className="founder-audit-links">
                        {event.actor_id && <Link href={`/profile/${event.actor_id}`}>View actor profile</Link>}
                        {event.target_href && <Link href={event.target_href}>Open affected area</Link>}
                        {event.transaction_id && <button type="button" onClick={() => applyFilters({ ...emptyAuditFilters, query: event.transaction_id || "" })}>Related transaction</button>}
                      </div>
                      {event.reason && <p><strong>Recorded reason:</strong> {event.reason}</p>}
                      <div className="founder-audit-changes">
                        {auditChanges(event).map((change) => (
                          <div key={change.field}>
                            <strong>{auditLabel(change.field)}</strong>
                            {change.private ? <span>Content changed · value intentionally not stored</span>
                              : <><span>Before: {change.before}</span><span>After: {change.after}</span></>}
                          </div>
                        ))}
                      </div>
                      {event.source_table.startsWith("staff_") && !event.transaction_id &&
                        <p className="founder-audit-note">Historical log: actor names use the current account name; rank and transaction were not recorded at the time.</p>}
                    </div>
                  </details>
                ))}
              </div>
              {auditPage.has_more && <button type="button" disabled={logLoading || exporting}
                onClick={() => setCursor(auditPage.next_cursor)}>Load more records</button>}
            </>
          )}
        </section>
      )}
      {tab === "lookup" && (
        <section className="founder-audit-body" aria-labelledby="founder-lookup-title">
          <h3 id="founder-lookup-title">Find an account or team</h3>
          <p>Search a username, team name or ID, then open its page or check its audit history.</p>
          <form className="founder-audit-lookup-form" onSubmit={findAccountTeam}>
            <label>Account / team search<input name="lookup" minLength={2} maxLength={100} required placeholder="At least 2 characters" /></label>
            <button type="submit" disabled={lookupLoading}>Find account / team</button>
          </form>
          {lookupLoading && <p role="status">Searching accounts and teams...</p>}
          {lookupError && <p className="founder-audit-error" role="alert">{lookupError}</p>}
          {lookup && <div className="founder-overview-panels">
            <section>
              <h4>Accounts ({lookup.accounts.length}{lookup.accounts.length === 20 ? "+" : ""})</h4>
              {!lookup.accounts.length && <p>No matching accounts.</p>}
              {lookup.accounts.map((account) => <article className="founder-lookup-result" key={account.id}>
                <strong>{account.username}</strong><span>{auditLabel(account.role)} · Joined {new Date(account.created_at).toLocaleDateString()}</span>
                <small>{account.id}</small><div className="founder-audit-links">
                  <Link href={`/profile/${account.id}`}>Open profile</Link>
                  <button type="button" onClick={() => applyFilters({ ...emptyAuditFilters, query: account.id })}>Account history</button>
                </div>
              </article>)}
            </section>
            <section>
              <h4>Teams ({lookup.teams.length}{lookup.teams.length === 20 ? "+" : ""})</h4>
              {!lookup.teams.length && <p>No matching teams.</p>}
              {lookup.teams.map((team) => <article className="founder-lookup-result" key={team.id}>
                <strong>{team.name}</strong><span>{team.platform} · {auditLabel(team.game)} · {auditLabel(team.ladder)}</span>
                <span>Team leader: {team.owner_username || "Unavailable"}</span><small>{team.id}</small>
                <div className="founder-audit-links">
                  <Link href={`/teams/${team.id}`}>Open team</Link>
                  <button type="button" onClick={() => applyFilters({ ...emptyAuditFilters, target: team.id })}>Team history</button>
                </div>
              </article>)}
            </section>
          </div>}
          <p className="founder-audit-note">Up to 20 accounts and 20 teams per search. Use a more specific name or ID to narrow results.</p>
        </section>
      )}
      {tab === "coverage" && (
        <section className="founder-audit-body" aria-labelledby="founder-coverage-title">
          <h3 id="founder-coverage-title">Logging coverage & service access</h3>
          <p>Database changes are recorded automatically, including staff actions and system writes.
            Related changes share a transaction ID. No authenticated actor is labelled as system/service—not attributed to a guessed member.</p>
          {coverageError && <p className="founder-audit-error" role="alert">{coverageError}</p>}
          {!coverage && !coverageError && <p role="status">Checking logging coverage...</p>}
          <button type="button" onClick={() => setRetry((value) => value + 1)}>Refresh coverage</button>
          {coverage && <>
            <div className="founder-audit-status">
              <span>New records: {coverage.retention_months}-month retention</span>
              <span className={coverage.cleanup_scheduled ? "" : "founder-audit-warning"}>
                Daily cleanup: {coverage.cleanup_scheduled ? "Scheduled" : "NOT SCHEDULED"}
              </span>
              <span>Existing history: {coverage.legacy_staff_events} staff / {coverage.legacy_moderation_events} moderation records</span>
            </div>
            <p className="founder-audit-note">Application users cannot insert, edit or delete audit records.
              Daily cleanup removes expired new records; existing staff history keeps its previous retention.
              Private messages, passwords, tokens, payment details, proof contents and personal profile values are not copied into new logs.
              Private-field edits record only the field name. Public thread titles, names, IDs and relevant status changes are retained.</p>
            <div className="founder-audit-list">
              {coverage.sources.map((source) => <details className="founder-audit-source" key={source.table_name}>
                <summary><strong>{auditLabel(source.table_name)}</strong><span>{auditLabel(source.category)}</span>
                  <b className={source.active ? "" : "founder-audit-warning"}>{source.active ? "Recording" : "NOT RECORDING"}</b>
                  <span>{source.events_7d} records in 7 days</span></summary>
                <div>
                  <p>Capture started: {new Date(source.capture_started_at).toLocaleString()}</p>
                  <p>Recorded values: {source.recorded_fields.map(auditLabel).join(", ")}</p>
                  <p>Change markers only: {source.private_fields.length ? source.private_fields.map(auditLabel).join(", ") : "None"}</p>
                </div>
              </details>)}
            </div>
          </>}
          <h4>Service consoles & status</h4>
          <p>These open provider tools and require your provider login. Their logs are separate from saved site actions.</p>
          <div className="founder-service-links">
            <a href="https://supabase.com/dashboard/project/rnmpfswimtnwopnddwgt/logs/explorer" target="_blank" rel="noopener noreferrer">Database / authentication logs</a>
            <a href="https://supabase.com/dashboard/project/rnmpfswimtnwopnddwgt/auth/users" target="_blank" rel="noopener noreferrer">Authentication accounts</a>
            <a href="https://vercel.com/oggb/gbarena" target="_blank" rel="noopener noreferrer">Deployments / runtime logs</a>
            <a href="https://status.supabase.com" target="_blank" rel="noopener noreferrer">Supabase service status</a>
            <a href="https://www.vercel-status.com" target="_blank" rel="noopener noreferrer">Vercel service status</a>
          </div>
          <p className="founder-audit-note">Not captured here: sign-ins, failed requests, page views, private-message contents,
            browser errors or platform outages. Use provider logs for sign-in and runtime investigations.
            Unlogged historical member actions cannot be reconstructed, and deleting a record may make its direct link unavailable.</p>
        </section>
      )}
    </div>
  );
}
