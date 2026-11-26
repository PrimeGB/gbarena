"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type LinkedId = { id: string; service: string; account_id: string };

export default function LinkedIds({ userId }: { userId: string }) {
  const [accounts, setAccounts] = useState<LinkedId[] | null>(null);
  const [service, setService] = useState("");
  const [accountId, setAccountId] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.from("profile_linked_ids").select("id,service,account_id")
      .eq("user_id", userId).order("created_at").then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) setError(`Additional IDs could not be loaded: ${loadError.message}`);
        else setAccounts(data || []);
      });
    return () => { active = false; };
  }, [userId]);

  async function save() {
    const name = service.trim();
    const value = accountId.trim();
    if (!name || !value) {
      setError("Enter both the service and your ID.");
      return;
    }
    setBusy(true); setError(""); setMessage("");
    const query = editing
      ? supabase.from("profile_linked_ids").update({ service: name, account_id: value }).eq("id", editing).eq("user_id", userId)
      : supabase.from("profile_linked_ids").insert({ user_id: userId, service: name, account_id: value });
    const { data, error: saveError } = await query.select("id,service,account_id").maybeSingle();
    if (saveError || !data) setError(saveError ? `ID could not be saved: ${saveError.message}` : "ID could not be saved. Please try again.");
    else {
      setAccounts((current) => [...(current || []).filter((item) => item.id !== data.id), data]);
      setService(""); setAccountId(""); setEditing(null); setMessage("ID saved.");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    setBusy(true); setError(""); setMessage("");
    const { data, error: deleteError } = await supabase.from("profile_linked_ids")
      .delete().eq("id", id).eq("user_id", userId).select("id").maybeSingle();
    if (deleteError || !data) setError(deleteError ? `ID could not be removed: ${deleteError.message}` : "ID could not be removed. Please try again.");
    else {
      setAccounts((current) => (current || []).filter((item) => item.id !== id));
      if (editing === id) { setEditing(null); setService(""); setAccountId(""); }
      setMessage("ID removed.");
    }
    setBusy(false);
  }

  return <details className="box linked-ids compact-section" open={error ? true : undefined}>
    <summary className="box-title">More Gamertags &amp; Usernames</summary>
    <div className="box-body">
      <p className="section-intro">Add a public username for any service, like Battle.net or EA.</p>
      <div className="linked-id-form">
        <label>Service<input value={service} maxLength={32} placeholder="e.g. Battle.net" onChange={(event) => setService(event.target.value)} /></label>
        <label>Gamertag or username<input value={accountId} maxLength={80} placeholder="Your ID" onChange={(event) => setAccountId(event.target.value)} /></label>
        <button type="button" className="save-button" disabled={busy || !accounts} onClick={() => void save()}>{busy ? "Saving..." : editing ? "Update ID" : "Add ID"}</button>
        {editing && <button type="button" className="linked-id-cancel" onClick={() => { setEditing(null); setService(""); setAccountId(""); }}>Cancel</button>}
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      {message && <p className="saved-message" role="status">{message}</p>}
      {!accounts && !error && <p className="field-note" role="status">Loading IDs...</p>}
      {accounts && accounts.length > 0 && <div className="linked-id-list">
        {accounts.map((account) => <div className="linked-id-row" key={account.id}>
          <span><strong>{account.service}</strong><small>{account.account_id}</small></span>
          <div><button type="button" disabled={busy} onClick={() => { setEditing(account.id); setService(account.service); setAccountId(account.account_id); setMessage(""); setError(""); }}>Edit</button><button type="button" disabled={busy} onClick={() => void remove(account.id)}>Remove</button></div>
        </div>)}
      </div>}
    </div>
  </details>;
}
