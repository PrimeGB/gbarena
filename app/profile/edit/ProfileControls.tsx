"use client";

import { useEffect, useState } from "react";
import StaffPlayerPicker from "../../staff/dashboard/StaffPlayerPicker";
import { supabase } from "../../../lib/supabase";
import { getProfileListVisibility, setProfileListVisibility, type ProfileList, type ProfileListVisibility } from "../../../lib/profileListVisibility";

const lists: { key: ProfileList; label: string }[] = [
  { key: "awards", label: "All awards" },
  { key: "friends", label: "All friends" },
  { key: "teams", label: "All teams" },
];

export default function ProfileControls({ userId, isOwner }: { userId: string; isOwner: boolean }) {
  const [visibility, setVisibility] = useState<ProfileListVisibility | null>(null);
  const [specialAccess, setSpecialAccess] = useState<boolean | null>(null);
  const [visibilityError, setVisibilityError] = useState("");
  const [specialError, setSpecialError] = useState("");
  const [savingList, setSavingList] = useState<ProfileList | null>(null);
  const [username, setUsername] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantMessage, setGrantMessage] = useState("");

  useEffect(() => {
    let active = true;
    void getProfileListVisibility(userId).then((value) => {
      if (active) { setVisibility(value); setVisibilityError(""); }
    }, (error: unknown) => {
      if (active) setVisibilityError(`List settings could not be loaded: ${error instanceof Error ? error.message : String(error)}`);
    });
    void supabase.rpc("gb_my_special_profile_access").then(({ data, error }) => {
      if (!active) return;
      if (error || typeof data !== "boolean") {
        setSpecialError(`Special profile access could not be loaded${error ? `: ${error.message}` : "."}`);
      } else {
        setSpecialAccess(data);
        setSpecialError("");
      }
    });
    return () => { active = false; };
  }, [userId]);

  async function changeVisibility(list: ProfileList, value: boolean) {
    if (savingList) return;
    setSavingList(list);
    setVisibilityError("");
    try {
      await setProfileListVisibility(list, value);
      setVisibility((current) => current && { ...current, [list]: value });
    } catch (error) {
      setVisibilityError(`List setting could not be saved: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSavingList(null);
    }
  }

  async function setAccess(unlocked: boolean) {
    if (!username.trim() || grantBusy) return;
    setGrantBusy(true);
    setGrantMessage("");
    const { data, error } = await supabase.rpc("gb_founder_set_special_profile_access", {
      p_username: username.trim(), p_unlocked: unlocked,
    });
    setGrantMessage(error ? `Access could not be changed: ${error.message}` : `${data}'s special profile area is ${unlocked ? "unlocked" : "locked"}.`);
    setGrantBusy(false);
  }

  return <>
    <details className="box profile-list-controls compact-section" open={visibilityError ? true : undefined}>
      <summary className="box-title">Profile List Access</summary>
      <div className="box-body">
        <p className="section-intro">Lock full lists on your profile. Featured items stay visible; friends also follow your Settings privacy. Other pages are unaffected.</p>
        {visibilityError && <p className="error-text" role="alert">{visibilityError}</p>}
        {!visibility && !visibilityError && <p className="field-note" role="status">Loading list settings...</p>}
        {visibility && <div className="visibility-list">
          {lists.map((list) => <label className="visibility-row" key={list.key}>
            <span><strong>{list.label}</strong></span>
            <span className="visibility-switch"><input type="checkbox" checked={visibility[list.key]} disabled={!!savingList} onChange={(event) => void changeVisibility(list.key, event.target.checked)} /><span>{visibility[list.key] ? "Public" : "Locked"}</span></span>
          </label>)}
        </div>}
      </div>
    </details>
    <details className="box special-profile compact-section" open={specialError ? true : undefined}>
      <summary className="box-title">Special Profile Studio {specialAccess === null ? "" : specialAccess ? "· Unlocked" : "· Locked"}</summary>
      <div className="box-body">
        <div className="special-profile-heading"><span aria-hidden="true">✦</span><div><strong>{specialAccess === null ? "Checking access..." : specialAccess ? "Special access unlocked" : "Special access locked"}</strong><p>Exclusive banners and profile looks are coming later.</p></div></div>
        {specialError && <p className="error-text" role="alert">{specialError}</p>}
        {specialAccess === false && <p className="field-note">A Founder can unlock this area for your account.</p>}
        {isOwner && <div className="founder-profile-access">
          <strong>Founder access controls</strong>
          <p className="field-note">Choose a player to unlock or lock their future special profile area.</p>
          <StaffPlayerPicker value={username} onChange={setUsername} />
          <div className="founder-access-actions">
            <button type="button" className="save-button" disabled={!username.trim() || grantBusy} onClick={() => void setAccess(true)}>Unlock access</button>
            <button type="button" className="edit-button" disabled={!username.trim() || grantBusy} onClick={() => void setAccess(false)}>Lock access</button>
          </div>
          {grantMessage && <p className={grantMessage.startsWith("Access could not") ? "error-text" : "saved-message"} role={grantMessage.startsWith("Access could not") ? "alert" : "status"}>{grantMessage}</p>}
        </div>}
      </div>
    </details>
  </>;
}
