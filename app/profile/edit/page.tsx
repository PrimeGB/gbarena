"use client";

import Link from "next/link";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../../../lib/useUser";
import { supabase } from "../../../lib/supabase";
import AwardArt, { AWARD_CSS } from "../../awards/AwardArt";
import {
  GamingAccount,
  gamingCategories,
  gamingGames,
  gamingPlatformLabel,
  gamingPlatforms,
} from "../../../lib/gamingAccounts";

type AppUser = { id: string; email?: string | null };

type FriendOption = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type EarnedAward = {
  id: number;
  name: string;
  award_group: string;
  reason: string;
};

type EditTab = "main" | "awards" | "friends" | "settings";

function EditProfileContent() {
  const searchParams = useSearchParams();
  const { user, loading } = useUser() as any;
  const currentUser = user as AppUser | null;
  const gamingAccountSectionRef = useRef<HTMLDivElement | null>(null);
  const gamingAccountIdInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<EditTab>("main");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentStatus, setCurrentStatus] = useState("Dynamic");
  const [profileGlow, setProfileGlow] = useState("On");
  const [location, setLocation] = useState("");
  const [initialLocation, setInitialLocation] = useState<string | null>(null);
  const [locationLocked, setLocationLocked] = useState(false);
  const [gtXbox, setGtXbox] = useState("");
  const [gtPlaystation, setGtPlaystation] = useState("");
  const [gtNintendo, setGtNintendo] = useState("");
  const [gtPc, setGtPc] = useState("");
  const [gamingAccounts, setGamingAccounts] = useState<GamingAccount[]>([]);
  const [gamingAccountPlatform, setGamingAccountPlatform] = useState<string>("xbox");
  const [gamingAccountCategory, setGamingAccountCategory] = useState<string>("call-of-duty");
  const [gamingAccountGame, setGamingAccountGame] = useState<string>("modern-warfare-4");
  const [gamingAccountId, setGamingAccountId] = useState("");
  const [gamingAccountError, setGamingAccountError] = useState("");
  const [savingGamingAccount, setSavingGamingAccount] = useState(false);
  const [displayAwards, setDisplayAwards] = useState<string[]>([]);
  const [earnedAwards, setEarnedAwards] = useState<EarnedAward[]>([]);
  const [dragSource, setDragSource] = useState<{ from: "pool" | "slot"; key: string } | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [displayFriends, setDisplayFriends] = useState<string[]>([]);
  const [friendDrag, setFriendDrag] = useState<{ from: "pool" | "slot"; key: string } | null>(null);
  const [friendOver, setFriendOver] = useState<number | null>(null);
  const [friendsMessage, setFriendsMessage] = useState("");
  const [savingFriends, setSavingFriends] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingsMessage, setSettingsMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (searchParams.get("platform") !== "ea") return;

    setGamingAccountPlatform("ea");
    if (searchParams.get("focus") !== "gaming-account") return;

    requestAnimationFrame(() => {
      gamingAccountSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      gamingAccountIdInputRef.current?.focus({ preventScroll: true });
    });
  }, [searchParams]);

  useEffect(() => {
    const existingAccount = gamingAccounts.find(
      (account) =>
        account.platform === gamingAccountPlatform &&
        account.category === gamingAccountCategory &&
        account.game === gamingAccountGame,
    );
    setGamingAccountId(existingAccount?.account_id || "");
  }, [gamingAccounts, gamingAccountPlatform, gamingAccountCategory, gamingAccountGame]);

  useEffect(() => {
    function warnBeforeLeave(event: BeforeUnloadEvent) {
      if (!hasChanges) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [hasChanges]);

  function markChanged() {
    setHasChanges(true);
    setSavedMessage("");
  }

  useEffect(() => {
    async function loadProfileAndRelations() {
      if (!currentUser?.id) return;

      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select(
            `username,profile_glow,avatar_url,logo_url,location,location_locked,gt_xbox,gt_playstation,gt_nintendo,gt_pc,display_awards`
          )
          .eq("id", currentUser.id)
          .maybeSingle();

        let loadedAwards: EarnedAward[] = [];
        if (profileData?.username) {
          const { data: awardRows } = await supabase.rpc("staff_player_award_history", {
            target_username: profileData.username,
          });
          loadedAwards = (awardRows || []) as EarnedAward[];
          setEarnedAwards(loadedAwards);
        }

        if (profileData) {
          setProfileGlow(profileData.profile_glow || "On");
          setAvatarPreview(profileData.avatar_url || null);
          setLogoPreview(profileData.logo_url || null);
          setInitialLocation(profileData.location || "");
          setLocation(profileData.location || "");
          setLocationLocked(!!profileData.location_locked);
          setGtXbox(profileData.gt_xbox || "");
          setGtPlaystation(profileData.gt_playstation || "");
          setGtNintendo(profileData.gt_nintendo || "");
          setGtPc(profileData.gt_pc || "");
          const saved = Array.isArray(profileData.display_awards) ? (profileData.display_awards as string[]) : [];
          const resolved = saved
            .map((entry) => loadedAwards.find((a) => String(a.id) === entry || a.name === entry))
            .filter((a): a is EarnedAward => !!a)
            .map((a) => String(a.id));
          const unique = Array.from(new Set(resolved)).slice(0, 6);
          setDisplayAwards(
            unique.length > 0 || saved.length > 0
              ? unique
              : loadedAwards.slice(0, 6).map((a) => String(a.id)),
          );
        }

        // load linked second email (separate query so a missing column cannot break the page)
        const { data: emailRow } = await supabase
          .from("profiles")
          .select("secondary_email")
          .eq("id", currentUser.id)
          .maybeSingle();
        setSecondaryEmail(emailRow?.secondary_email || "");

        // load accepted friends count
        const { data: requests } = await supabase
          .from("friend_requests")
          .select("*")
          .or(`requester_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`);

        const accepted = (requests || []).filter((r: any) => r.status === "accepted");
        setFriendsCount(accepted.length || 0);

        const friendIds = accepted.map((r: any) =>
          r.requester_id === currentUser.id ? r.recipient_id : r.requester_id,
        ).filter(Boolean);
        if (friendIds.length > 0) {
          const { data: friendProfiles } = await supabase
            .from("profiles")
            .select("id,username,avatar_url")
            .in("id", friendIds);
          const loadedFriends = (friendProfiles || []).map((f: any) => ({
            id: String(f.id),
            username: f.username || "Unknown Player",
            avatar_url: f.avatar_url || null,
          })) as FriendOption[];
          setFriends(loadedFriends);

          const { data: friendPrefs } = await supabase
            .from("profiles")
            .select("display_friends")
            .eq("id", currentUser.id)
            .maybeSingle();
          const savedFriends: string[] = Array.isArray(friendPrefs?.display_friends) ? friendPrefs.display_friends : [];
          const valid = Array.from(new Set(savedFriends.filter((id) => loadedFriends.some((f) => f.id === id)))).slice(0, 4);
          setDisplayFriends(valid.length > 0 || savedFriends.length > 0 ? valid : loadedFriends.slice(0, 4).map((f) => f.id));
        }
      } catch (err) {
        // ignore load errors for now
      }
    }

    if (!loading) loadProfileAndRelations();
  }, [loading, user?.id]);

  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) return;

    async function loadGamingAccounts() {
      const { data, error } = await supabase
        .from("gaming_accounts")
        .select("id,user_id,platform,category,game,account_id,locked_until")
        .eq("user_id", userId)
        .order("platform")
        .order("game");

      if (error) {
        setGamingAccountError("Gaming accounts could not be loaded: " + error.message);
        return;
      }

      setGamingAccounts((data || []) as GamingAccount[]);
    }

    void loadGamingAccounts();
  }, [currentUser?.id]);

  async function saveGamingAccount() {
    const cleanId = gamingAccountId.trim();
    if (!currentUser?.id || !cleanId) {
      setGamingAccountError("Enter a gaming ID before saving.");
      return;
    }

    setSavingGamingAccount(true);
    setGamingAccountError("");

    const { data, error } = await supabase
      .from("gaming_accounts")
      .upsert(
        {
          user_id: currentUser.id,
          platform: gamingAccountPlatform,
          category: gamingAccountCategory,
          game: gamingAccountGame,
          account_id: cleanId,
        },
        { onConflict: "user_id,platform,category,game" },
      )
      .select("id,user_id,platform,category,game,account_id,locked_until")
      .single();

    if (error) {
      setGamingAccountError(error.message);
    } else {
      setGamingAccounts((current) => [
        ...current.filter(
          (account) =>
            account.platform !== gamingAccountPlatform ||
            account.category !== gamingAccountCategory ||
            account.game !== gamingAccountGame,
        ),
        data as GamingAccount,
      ]);
      setGamingAccountId("");
    }

    setSavingGamingAccount(false);
  }

  async function removeGamingAccount(account: GamingAccount) {
    setGamingAccountError("");
    const { error } = await supabase
      .from("gaming_accounts")
      .delete()
      .eq("id", account.id);

    if (error) {
      setGamingAccountError(error.message);
      return;
    }

    setGamingAccounts((current) =>
      current.filter((item) => item.id !== account.id),
    );
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setLogoFile(file);
    markChanged();
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarFile(file);
    markChanged();
  }

  function handleNavClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (hasChanges) {
      const confirmLeave = window.confirm("Please save changes first. Leave without saving?");
      if (!confirmLeave) {
        event.preventDefault();
        return;
      }
    }

    window.location.href = href;
  }

  function handleTabChange(tab: EditTab) {
    if (hasChanges) {
      const confirmSwitch = window.confirm("Please save changes first. Switch sections without saving?");
      if (!confirmSwitch) return;
    }

    setActiveTab(tab);
  }

  function awardKey(award: EarnedAward) {
    return String(award.id);
  }

  function placeAward(key: string, slotIndex: number, fromSlot: number | null) {
    const next = [...displayAwards];
    if (fromSlot !== null) {
      const target = Math.min(slotIndex, next.length - 1);
      [next[fromSlot], next[target]] = [next[target], next[fromSlot]];
    } else {
      const existing = next.indexOf(key);
      if (existing !== -1) next.splice(existing, 1);
      if (slotIndex >= next.length) next.push(key);
      else next[slotIndex] = key;
    }
    setDisplayAwards(next.slice(0, 6));
    markChanged();
  }

  function removeAwardAt(slotIndex: number) {
    setDisplayAwards(displayAwards.filter((_, i) => i !== slotIndex));
    markChanged();
  }

  function addAwardToFirstSlot(key: string) {
    if (displayAwards.includes(key) || displayAwards.length >= 6) return;
    setDisplayAwards([...displayAwards, key]);
    markChanged();
  }

  function handleSlotDrop(slotIndex: number) {
    if (dragSource) {
      if (dragSource.from === "slot") {
        const fromIndex = displayAwards.indexOf(dragSource.key);
        if (fromIndex !== -1 && fromIndex !== slotIndex) placeAward(dragSource.key, slotIndex, fromIndex);
      } else {
        placeAward(dragSource.key, slotIndex, null);
      }
    }
    setDragSource(null);
    setDragOverSlot(null);
  }

  function changeFriends(next: string[]) {
    setDisplayFriends(next.slice(0, 4));
    setFriendsMessage("");
    setHasChanges(true);
  }

  function dropFriend(slotIndex: number) {
    if (friendDrag) {
      const next = [...displayFriends];
      if (friendDrag.from === "slot") {
        const fromIndex = next.indexOf(friendDrag.key);
        const target = Math.min(slotIndex, next.length - 1);
        if (fromIndex !== -1 && fromIndex !== target) {
          [next[fromIndex], next[target]] = [next[target], next[fromIndex]];
        }
      } else {
        const existing = next.indexOf(friendDrag.key);
        if (existing !== -1) next.splice(existing, 1);
        if (slotIndex >= next.length) next.push(friendDrag.key);
        else next[slotIndex] = friendDrag.key;
      }
      changeFriends(next);
    }
    setFriendDrag(null);
    setFriendOver(null);
  }

  async function saveFriends() {
    if (!currentUser) return;
    setSavingFriends(true);
    setFriendsMessage("");
    const { error } = await supabase
      .from("profiles")
      .update({ display_friends: displayFriends })
      .eq("id", currentUser.id);
    setSavingFriends(false);
    if (error) {
      console.error("Top friends save error:", error);
      setFriendsMessage("Could not save top friends. Please try again.");
      return;
    }
    setHasChanges(false);
    setFriendsMessage("Top friends saved.");
  }

  async function linkSecondEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!currentUser || secondaryEmail) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSettingsMessage({ ok: false, text: "Enter a valid email address." });
      return;
    }
    if (email === (currentUser.email || "").toLowerCase()) {
      setSettingsMessage({ ok: false, text: "That is already your primary email." });
      return;
    }
    if (!window.confirm(`Link ${email} to your account? It cannot be changed or removed afterwards.`)) return;
    setSettingsBusy(true);
    setSettingsMessage(null);
    const { error } = await supabase
      .from("profiles")
      .update({ secondary_email: email })
      .eq("id", currentUser.id)
      .is("secondary_email", null);
    setSettingsBusy(false);
    if (error) {
      setSettingsMessage({
        ok: false,
        text: error.code === "23505" ? "That email is already linked to another account." : "Could not link this email. Please try again.",
      });
      return;
    }
    setSecondaryEmail(email);
    setNewEmail("");
    setSettingsMessage({ ok: true, text: "Second email linked." });
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      setSettingsMessage({ ok: false, text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSettingsMessage({ ok: false, text: "Passwords do not match." });
      return;
    }
    setSettingsBusy(true);
    setSettingsMessage(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSettingsBusy(false);
    if (error) {
      setSettingsMessage({ ok: false, text: error.message });
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setSettingsMessage({ ok: true, text: "Password updated." });
  }

  function handleSave() {
    saveProfile();
  }

  async function saveProfile() {
    if (!currentUser) return;
    setSaving(true);
    setSavedMessage("");

    try {
      let avatarUrl: string | null = null;
      let logoUrl: string | null = null;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "png";
        const path = `${currentUser.id}/avatars/avatar-${Date.now()}.${ext}`;

        const { error: avatarUploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { cacheControl: "3600", upsert: true });

        if (avatarUploadError) throw new Error("Avatar upload failed: " + avatarUploadError.message);

        const { data: avatarPublicData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = avatarPublicData.publicUrl;
      }

      if (logoFile) {
        const ext = logoFile.name.split(".").pop() || "png";
        const path = `${currentUser.id}/logos/logo-${Date.now()}.${ext}`;

        const { error: logoUploadError } = await supabase.storage
          .from("team-assets")
          .upload(path, logoFile, { cacheControl: "3600", upsert: true });

        if (logoUploadError) throw new Error("Logo upload failed: " + logoUploadError.message);

        const { data: logoPublicData } = supabase.storage.from("team-assets").getPublicUrl(path);
        logoUrl = logoPublicData.publicUrl;
      }

      const updateData: any = {
        profile_glow: profileGlow || null,
        gt_xbox: gtXbox || null,
        gt_playstation: gtPlaystation || null,
        gt_nintendo: gtNintendo || null,
        gt_pc: gtPc || null,
        display_awards: displayAwards || null,
      };

      if (avatarUrl) updateData.avatar_url = avatarUrl;
      if (logoUrl) updateData.logo_url = logoUrl;

      // Location: only save if initial location was empty (first save)
      if (!initialLocation || initialLocation === "") {
        updateData.location = location || null;
        updateData.location_locked = true;
      }

      const { error } = await supabase.from("profiles").upsert({ id: currentUser.id, ...updateData });

      if (error) throw error;

      setHasChanges(false);
      setSavedMessage("Profile saved.");
      if (!initialLocation || initialLocation === "") setLocationLocked(true);
    } catch (err: any) {
      console.error("Profile save error:", err);
      // fallback: fake save to localStorage
      try {
        const fallback = {
          profileGlow,
          gtXbox,
          gtPlaystation,
          gtNintendo,
          gtPc,
          location,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem("gb_profile_preview", JSON.stringify(fallback));
        setSavedMessage(
          `Saved locally (preview). Supabase unavailable: ${err?.message || ""}`
        );
      } catch (inner) {
        console.error("Local fallback save failed:", inner);
        setSavedMessage("Save failed: " + (err?.message || String(err)));
      }
    }

    setSaving(false);
  }

  if (loading) return <div className="profile-loading">Loading edit profile.</div>;

  if (!currentUser) {
    return <div className="profile-loading">You must be logged in to edit your profile.</div>;
  }

  return (
    <>
      <style>{AWARD_CSS}</style>
      <style>{`
        *{ margin:0; padding:0; box-sizing:border-box; }

        body{
          background:#000;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{text-decoration:none;}
        button,input,select,textarea{font-family:Tahoma,Verdana,Arial,sans-serif;}

        .profile-loading{
          min-height:100vh;
          background:#000;
          color:#fff;
          padding:30px;
        }

        .page{
          min-height:100vh;
          background:#000;
          color:#d7e2ee;
          font-size:13px;
          padding-bottom:6px;
        }

        .wrapper{
          width:1040px;
          margin:0 auto;
          box-shadow:-18px 0 35px rgba(40,120,255,.22),18px 0 35px rgba(40,120,255,.22);
        }

        .top-strip{
          height:22px;
          background:linear-gradient(to bottom,#13304b,#060d14);
          border-bottom:1px solid #214d73;
          display:flex;
          align-items:center;
          justify-content:flex-end;
          padding:0 12px;
        }

        .top-strip a{
          color:#d7eaff;
          font-size:11px;
          font-weight:bold;
          margin-left:14px;
        }

        .header{
          height:82px;
          background:linear-gradient(to bottom,#0d2234,#07111b);
          border-left:1px solid #214d73;
          border-right:1px solid #214d73;
          border-bottom:2px solid #2f6f9f;
          display:flex;
          align-items:center;
          padding:0 14px;
        }

        .logo-box{
          height:62px;
          width:510px;
          background:linear-gradient(to bottom,#102841,#07111b);
          border:1px solid #2f6f9f;
          display:flex;
          align-items:center;
          padding:0 18px;
          box-shadow:inset 0 0 12px rgba(0,0,0,.65);
        }

        .logo-circle{
          width:54px;
          height:54px;
          border-radius:50%;
          background:linear-gradient(to bottom,#1c78c7,#0c2236);
          border:2px solid #74b4e6;
          margin-right:16px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#fff;
          font-weight:bold;
          box-shadow:0 0 10px rgba(50,120,200,.5);
          overflow:hidden;
        }

        .logo-circle img{
          width:100%;
          height:100%;
          object-fit:contain;
        }

        .logo-text{
          color:#f4f8ff;
          font-size:40px;
          font-weight:bold;
          letter-spacing:-2px;
          line-height:34px;
          font-style:italic;
        }

        .logo-sub{
          color:#4daeff;
          font-size:10px;
          font-weight:bold;
          letter-spacing:5px;
          margin-top:4px;
        }

        .title-bar{
          margin-top:5px;
          height:56px;
          background:linear-gradient(to bottom,#15324b,#091521);
          border:1px solid #2f6f9f;
          display:flex;
          align-items:center;
          padding:0 14px;
        }

        .title-main{
          color:#f2c14e;
          font-size:24px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .title-sub{
          color:#a9c3db;
          font-size:12px;
          margin-top:3px;
        }

        .nav{
          height:36px;
          background:linear-gradient(to bottom,#10283d,#07111b);
          border-left:1px solid #244b70;
          border-right:1px solid #244b70;
          border-bottom:1px solid #2f6f9f;
          display:flex;
          align-items:center;
          padding:0 12px;
          margin-top:5px;
        }

        .nav a,.nav button{
          color:#d7eaff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          margin-right:14px;
          background:none;
          border:none;
          cursor:pointer;
        }

        .nav a:hover,.nav button:hover,.nav .active{
          color:#f2c14e;
        }

        .edit-grid{
          margin-top:6px;
          display:grid;
          grid-template-columns:280px 1fr;
          gap:6px;
        }

        .box{
          background:#07111b;
          border:1px solid #244b70;
          margin-bottom:6px;
        }

        .box-title{
          height:28px;
          background:linear-gradient(to bottom,#15324b,#091521);
          border-bottom:1px solid #244b70;
          color:#fff;
          display:flex;
          align-items:center;
          padding-left:10px;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .box-body{
          padding:10px;
          font-size:13px;
          line-height:18px;
        }

        .editor-box{
          width:100%;
          height:145px;
          background:#050c14;
          border:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#8aa7c0;
          font-size:13px;
          font-weight:bold;
          overflow:hidden;
          cursor:pointer;
        }

        .editor-box:hover{
          border-color:#f2c14e;
          color:#f2c14e;
        }

        .editor-box img{
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .editor-box input{ display:none; }

        .edit-button{
          margin-top:8px;
          height:34px;
          width:100%;
          background:linear-gradient(to bottom,#1d5d90,#0a1f33);
          border:1px solid #4daeff;
          color:#fff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .edit-button:hover{
          color:#f2c14e;
          border-color:#f2c14e;
        }

        .edit-button input{ display:none; }

        .profile-preview{
          height:86px;
          background:linear-gradient(to bottom,#102841,#07111b);
          border:1px solid #2f6f9f;
          display:flex;
          align-items:center;
          padding:10px;
          margin-top:8px;
        }

        .avatar-mini{
          width:58px;
          height:58px;
          border-radius:50%;
          background:#050c14;
          border:2px solid #74b4e6;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          margin-right:12px;
          color:#8aa7c0;
          font-size:10px;
          font-weight:bold;
        }

        .avatar-mini img{
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .logo-mini{
          width:58px;
          height:58px;
          background:#050c14;
          border:2px solid #74b4e6;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          margin-right:12px;
          color:#8aa7c0;
          font-size:10px;
          font-weight:bold;
        }

        .logo-mini img{
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .preview-name{
          color:#f2c14e;
          font-size:17px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .preview-sub{
          color:#a9c3db;
          font-size:11px;
          margin-top:3px;
        }

        .help-text{
          color:#a9c3db;
          font-size:12px;
          margin-top:8px;
        }

        .form-row{ margin-bottom:12px; }

        .form-row label{
          display:block;
          color:#f2c14e;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          margin-bottom:5px;
        }

        .form-row input,
        .form-row select,
        .form-row textarea{
          width:100%;
          background:#050c14;
          border:1px solid #244b70;
          color:#fff;
          padding:9px;
          font-size:13px;
        }

        .form-row textarea{
          min-height:130px;
          resize:vertical;
        }

        .field-note{
          color:#8aa7c0;
          font-size:11px;
          margin-top:5px;
        }

        .error-text{
          color:#ff7777;
          font-size:11px;
          margin-top:5px;
          font-weight:bold;
        }

        .save-row{
          display:flex;
          align-items:center;
          gap:12px;
          margin-top:4px;
        }

        .save-button{
          width:180px;
          height:36px;
          background:linear-gradient(to bottom,#1d5d90,#0a1f33);
          border:1px solid #4daeff;
          color:#fff;
          font-size:12px;
          font-weight:bold;
          text-transform:uppercase;
          cursor:pointer;
        }

        .save-button:hover{
          color:#f2c14e;
          border-color:#f2c14e;
        }

        .saved-message{
          color:#00ff88;
          font-size:12px;
          font-weight:bold;
        }

        .warning-message{
          color:#f2c14e;
          font-size:12px;
          font-weight:bold;
        }

        .notice{
          background:#050c14;
          border:1px solid #244b70;
          padding:10px;
          color:#d7e2ee;
          margin-bottom:10px;
        }

        .manage-grid{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:8px;
        }

        .manage-card{
          min-height:92px;
          background:#050c14;
          border:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
          color:#d7eaff;
          font-size:12px;
          font-weight:bold;
          padding:8px;
        }

        .manage-card.top{
          border-color:#f2c14e;
          color:#f2c14e;
          box-shadow:0 0 10px rgba(242,193,78,.35);
        }

        .footer{
          margin-top:5px;
          height:24px;
          background:#07111b;
          border:1px solid #244b70;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:11px;
        }

        /* Modern layout overrides */
        .wrapper{ width:min(1100px,100%); border-radius:0 0 10px 10px; }
        .logo-box{ width:auto; max-width:100%; border-radius:8px; }
        .title-bar{ height:auto; padding:14px 20px; border-radius:8px; }
        .nav{
          height:auto;
          flex-wrap:wrap;
          gap:6px;
          padding:8px 12px;
          border-radius:8px;
        }
        .nav a,.nav button{
          margin:0;
          padding:7px 14px;
          border-radius:999px;
          border:1px solid transparent;
          background:rgba(255,255,255,.04);
        }
        .nav a:hover,.nav button:hover{ background:rgba(77,174,255,.15); }
        .nav button.active{
          background:rgba(242,193,78,.15);
          border-color:#f2c14e;
          color:#f2c14e;
        }
        .edit-grid{
          grid-template-columns:300px minmax(0,1fr);
          gap:16px;
          margin-top:14px;
          padding:0 8px;
          align-items:start;
        }
        .edit-grid aside{ position:sticky; top:12px; }
        .box{ border-radius:10px; overflow:hidden; margin-bottom:16px; }
        .box-title{ height:38px; padding-left:16px; font-size:13px; letter-spacing:.5px; }
        .box-body{ padding:16px; }
        .editor-box{ height:170px; border-radius:8px; }
        .edit-button{ height:38px; border-radius:8px; }
        .profile-preview{ height:auto; border-radius:8px; padding:12px; }
        .form-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          column-gap:18px;
          row-gap:4px;
        }
        .form-grid .form-row:has(textarea),
        .form-grid .form-row:has(input + input),
        .form-grid .save-row{ grid-column:1 / -1; }
        .form-row{ margin-bottom:14px; }
        .form-row input,.form-row select,.form-row textarea{
          border-radius:8px;
          padding:10px 12px;
        }
        .form-row input:focus,.form-row select:focus,.form-row textarea:focus{
          outline:none;
          border-color:#4daeff;
          box-shadow:0 0 0 2px rgba(77,174,255,.25);
        }
        .form-row input + input{ margin-top:8px; }
        .save-button{ border-radius:8px; height:40px; }
        .notice{ border-radius:8px; }
        .manage-card{ border-radius:8px; }
        .footer{ margin-top:16px; }

        .award-slots{ display:grid; grid-template-columns:repeat(6,1fr); gap:10px; margin-bottom:14px; }
        .award-slot{
          position:relative; min-height:170px; padding:22px 6px 8px;
          background:#050c14; border:2px dashed #244b70; border-radius:10px;
          display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;
          transition:border-color .15s, background .15s;
        }
        .award-slot.filled{ border-style:solid; border-color:#2f6f9f; cursor:grab; }
        .award-slot.over{ border-color:#f2c14e; background:rgba(242,193,78,.08); }
        .slot-number{
          position:absolute; top:6px; left:8px; font-size:11px; font-weight:bold; color:#f2c14e;
        }
        .slot-empty{ color:#5f7e9c; font-size:11px; }
        .slot-art{ display:flex; align-items:flex-end; justify-content:center; pointer-events:none; }
        .slot-art .award-art,.slot-art .award-sprite{ width:auto; max-width:100%; }
        .slot-name{ font-size:11px; color:#b9cde0; margin-top:6px; line-height:1.2; overflow-wrap:anywhere; }
        .slot-remove{
          position:absolute; top:4px; right:6px; width:20px; height:20px; line-height:18px;
          border-radius:50%; border:1px solid #244b70; background:#0a1a2a; color:#d7eaff; cursor:pointer;
        }
        .slot-remove:hover{ color:#ff7777; border-color:#ff7777; }
        .award-pool{ display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:10px; }
        .pool-award{
          position:relative; padding:10px 6px; background:#050c14; border:1px solid #244b70;
          border-radius:10px; text-align:center; cursor:grab;
        }
        .pool-award:hover{ border-color:#f2c14e; }
        .pool-award.used{ opacity:.55; }
        .pool-badge{ font-size:10px; color:#00ff88; font-weight:bold; margin-top:4px; }
        .friend-slots{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
        .friend-avatar{
          width:64px; height:64px; border-radius:50%; overflow:hidden; margin:0 auto;
          background:radial-gradient(circle at 30% 25%,#245f94,#0a1521 80%); border:2px solid #3b86c4;
          display:flex; align-items:center; justify-content:center;
          font-weight:bold; font-size:18px; color:#f2c14e; pointer-events:none;
        }
        .friend-avatar img{ width:100%; height:100%; object-fit:cover; }

        @media (max-width:860px){
          .edit-grid{ grid-template-columns:1fr; }
          .edit-grid aside{ position:static; }
          .form-grid{ grid-template-columns:1fr; }
          .award-slots{ grid-template-columns:repeat(3,1fr); }
          .friend-slots{ grid-template-columns:repeat(2,1fr); }
          .manage-grid{ grid-template-columns:repeat(2,1fr); }
          .logo-text{ font-size:28px; }
        }
      `}</style>

      <div className="page">
        <div className="top-strip">
          <Link href="/home" onClick={(event) => handleNavClick(event, "/home")}>Home</Link>
          <Link href="/profile" onClick={(event) => handleNavClick(event, "/profile")}>Back to Profile</Link>
        </div>

        <div className="wrapper">
          <header className="header">
            <div className="logo-box">
              <div className="logo-circle">
                {logoPreview ? <img loading="lazy" decoding="async" src={logoPreview} alt="Logo Preview" /> : "GB"}
              </div>

              <div>
                <div className="logo-text">GAMEBATTLES</div>
                <div className="logo-sub">WHERE GAMING FINDS ITS EDGE</div>
              </div>
            </div>
          </header>

          <div className="title-bar">
            <div>
              <div className="title-main">Account / Profile</div>
              <div className="title-sub">
                Manage the important details that appear on your public player profile.
              </div>
            </div>
          </div>

          <nav className="nav">
            <Link href="/home" onClick={(event) => handleNavClick(event, "/home")}>Home</Link>
            <Link href="/profile" onClick={(event) => handleNavClick(event, "/profile")}>Profile</Link>
            <button className={activeTab === "main" ? "active" : ""} onClick={() => handleTabChange("main")}>Main Edit</button>
            <button className={activeTab === "awards" ? "active" : ""} onClick={() => handleTabChange("awards")}>Awards</button>
            <button className={activeTab === "friends" ? "active" : ""} onClick={() => handleTabChange("friends")}>Friends</button>
            <button className={activeTab === "settings" ? "active" : ""} onClick={() => handleTabChange("settings")}>Settings</button>
          </nav>

          <div className="edit-grid" style={activeTab === "main" ? undefined : { gridTemplateColumns: "minmax(0,1fr)" }}>
            {activeTab === "main" && (
            <aside>
              <div className="box">
                <div className="box-title">Logo Editor</div>
                <div className="box-body">
                  <label className="editor-box">
                    <input type="file" accept="image/*" onChange={handleLogoChange} />
                    {logoPreview ? <img loading="lazy" decoding="async" src={logoPreview} alt="Logo Preview" /> : "LOGO PREVIEW"}
                  </label>

                  <label className="edit-button">
                    <input type="file" accept="image/*" onChange={handleLogoChange} />
                    Edit Logo
                  </label>

                  <div className="help-text">
                    This is the larger profile logo/banner-style image preview.
                  </div>
                </div>
              </div>

              <div className="box">
                <div className="box-title">Avatar Editor</div>
                <div className="box-body">
                  <label className="editor-box">
                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                    {avatarPreview ? <img loading="lazy" decoding="async" src={avatarPreview} alt="Avatar Preview" /> : "AVATAR PREVIEW"}
                  </label>

                  <label className="edit-button">
                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                    Edit Avatar
                  </label>

                  <div className="profile-preview">
                    <div className="avatar-mini">
                      {avatarPreview ? <img loading="lazy" decoding="async" src={avatarPreview} alt="Mini Avatar Preview" /> : "AVATAR"}
                    </div>

                    <div className="logo-mini">
                      {logoPreview ? <img loading="lazy" decoding="async" src={logoPreview} alt="Mini Logo Preview" /> : "LOGO"}
                    </div>

                    <div>
                      <div className="preview-name">Player Preview</div>
                      <div className="preview-sub">Avatar and logo preview</div>
                    </div>
                  </div>

                  <div className="help-text">
                    Avatar preview works instantly while building. Permanent saving comes later.
                  </div>
                </div>
              </div>

              <div className="box">
                <div className="box-title">Save Reminder</div>
                <div className="box-body">
                  {hasChanges ? (
                    <div className="warning-message">You have unsaved changes.</div>
                  ) : (
                    <div className="help-text">No unsaved changes.</div>
                  )}
                </div>
              </div>
            </aside>
            )}
            <main>
              {activeTab === "main" && (
                <>
                <div className="box">
                  <div className="box-title">Main Profile Settings</div>

                  <div className="box-body form-grid">
                    <div className="form-row">
                      <label>Current Status</label>
                      <select value={currentStatus} onChange={(event) => { setCurrentStatus(event.target.value); markChanged(); }}>
                        <option>Dynamic</option>
                        <option>Private</option>
                      </select>
                      <div className="field-note">
                        Dynamic changes based on what you are doing on the site. Private displays private on your profile.
                      </div>
                    </div>

                    <div className="form-row">
                      <label>Profile Glow</label>
                      <select value={profileGlow} onChange={(event) => { setProfileGlow(event.target.value); markChanged(); }}>
                        <option>On</option>
                        <option>Off</option>
                      </select>
                    </div>

                    <div className="form-row">
                      <label>Location</label>
                      <input
                        value={location}
                        onChange={(event) => { setLocation(event.target.value); markChanged(); }}
                        placeholder="Example: Canada"
                        disabled={locationLocked}
                      />
                      {locationLocked && (
                        <div className="field-note">Location locked after first save.</div>
                      )}
                    </div>

                    <div className="form-row">
                      <label>Gamertags</label>
                      <input value={gtXbox} onChange={(e) => { setGtXbox(e.target.value); markChanged(); }} placeholder="Xbox GT" style={{marginBottom:8}} />
                      <input value={gtPlaystation} onChange={(e) => { setGtPlaystation(e.target.value); markChanged(); }} placeholder="PlayStation ID" style={{marginBottom:8}} />
                      <input value={gtNintendo} onChange={(e) => { setGtNintendo(e.target.value); markChanged(); }} placeholder="Nintendo ID" style={{marginBottom:8}} />
                      <input value={gtPc} onChange={(e) => { setGtPc(e.target.value); markChanged(); }} placeholder="PC / Steam ID" />
                      <div className="field-note">Provide platform-specific IDs so friends and teams can find you.</div>
                    </div>

                    <div className="save-row">
                      <button className="save-button" type="button" onClick={handleSave}>
                        Save Changes
                      </button>

                      {savedMessage && (
                        <div className="saved-message">
                          {savedMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="box" ref={gamingAccountSectionRef}>
                  <div className="box-title">Gaming Accounts</div>
                  <div className="box-body">
                    <div className="notice">
                      {gamingAccountPlatform === "ea"
                        ? "Enter the EA ID shown in your EA account, then save it here. Signing in on EA does not automatically share your ID with GameBattles. IDs used for an open or active match cannot be changed until that commitment ends."
                        : "Save one platform ID for each game you compete in. IDs used for an open or active match cannot be changed until that commitment ends."}
                    </div>
                    <div className="form-row">
                      <label>Platform</label>
                      <select
                        value={gamingAccountPlatform}
                        onChange={(event) => setGamingAccountPlatform(event.target.value)}
                      >
                        {gamingPlatforms.map((platform) => (
                          <option key={platform.value} value={platform.value}>{platform.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row">
                      <label>Game Category</label>
                      <select
                        value={gamingAccountCategory}
                        onChange={(event) => {
                          const nextCategory = event.target.value;
                          setGamingAccountCategory(nextCategory);
                          setGamingAccountGame(
                            gamingGames.find((game) => game.category === nextCategory)?.value || "",
                          );
                        }}
                      >
                        {gamingCategories.map((category) => (
                          <option key={category.value} value={category.value}>{category.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row">
                      <label>Game</label>
                      <select
                        value={gamingAccountGame}
                        onChange={(event) => setGamingAccountGame(event.target.value)}
                      >
                        {gamingGames.filter((game) => game.category === gamingAccountCategory).map((game) => (
                          <option key={game.value} value={game.value}>{game.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row">
                      <label>Gaming ID</label>
                      <input
                        ref={gamingAccountIdInputRef}
                        value={gamingAccountId}
                        maxLength={80}
                        onChange={(event) => setGamingAccountId(event.target.value)}
                        placeholder={gamingAccountPlatform === "ea" ? "Enter your EA ID" : "Enter your in-game/platform ID"}
                      />
                    </div>
                    <div className="save-row">
                      <button
                        className="save-button"
                        type="button"
                        disabled={savingGamingAccount}
                        onClick={saveGamingAccount}
                      >
                        {savingGamingAccount ? "Saving..." : "Save Gaming Account"}
                      </button>
                    </div>
                    <div className="field-note">
                      Once saved, a gaming ID is locked to your account for 30 days and cannot be changed, removed, or used on another account.
                    </div>
                    {gamingAccountError && <div className="error-text">{gamingAccountError}</div>}
                    {gamingAccounts.length > 0 ? (
                      <div className="manage-grid">
                        {gamingAccounts.map((account) => (
                          <div className="manage-card" key={account.id}>
                            <div>
                              <strong>{gamingPlatformLabel(account.platform)}</strong>
                              <div className="field-note">{account.category} / {account.game}: {account.account_id}</div>
                              {account.locked_until && new Date(account.locked_until) > new Date() && (
                                <div className="field-note">
                                  🔒 Locked until {new Date(account.locked_until).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <button
                              className="edit-button"
                              type="button"
                              disabled={!!account.locked_until && new Date(account.locked_until) > new Date()}
                              onClick={() => void removeGamingAccount(account)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="field-note">No game-specific accounts saved yet.</div>
                    )}
                  </div>
                </div>
                </>
              )}

              {activeTab === "awards" && (
                <>
                <div className="box">
                  <div className="box-title">Top 6 Awards (shown on your profile)</div>
                  <div className="box-body">
                    <div className="notice">
                      Drag awards from the list below into a slot, drag between slots to reorder, or drag a slot back to the list to remove it. Slot 1 is shown first on your profile.
                    </div>
                    <div className="award-slots">
                      {Array.from({ length: 6 }).map((_, idx) => {
                        const key = displayAwards[idx];
                        const award = earnedAwards.find((a) => awardKey(a) === key);
                        return (
                          <div
                            key={idx}
                            className={`award-slot ${award ? "filled" : ""} ${dragOverSlot === idx ? "over" : ""}`}
                            draggable={!!award}
                            onDragStart={() => award && setDragSource({ from: "slot", key })}
                            onDragEnd={() => { setDragSource(null); setDragOverSlot(null); }}
                            onDragOver={(event) => { event.preventDefault(); setDragOverSlot(idx); }}
                            onDragLeave={() => setDragOverSlot(null)}
                            onDrop={(event) => { event.preventDefault(); handleSlotDrop(idx); }}
                          >
                            <span className="slot-number">{idx + 1}</span>
                            {award ? (
                              <>
                                <div className="slot-art">
                                  <AwardArt name={award.name} group={award.award_group} height={92} />
                                </div>
                                <div className="slot-name">{award.name}</div>
                                <button type="button" className="slot-remove" onClick={() => removeAwardAt(idx)} aria-label={`Remove ${award.name}`}>×</button>
                              </>
                            ) : (
                              <div className="slot-empty">Drop award here</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="save-row">
                      <button className="save-button" type="button" onClick={handleSave}>Save Awards</button>
                      {savedMessage && <div className="saved-message">{savedMessage}</div>}
                    </div>
                  </div>
                </div>

                <div
                  className="box"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragSource?.from === "slot") removeAwardAt(displayAwards.indexOf(dragSource.key));
                    setDragSource(null);
                    setDragOverSlot(null);
                  }}
                >
                  <div className="box-title">All My Awards ({earnedAwards.length})</div>
                  <div className="box-body">
                    {earnedAwards.length === 0 ? (
                      <div className="help-text">You have not earned any awards yet.</div>
                    ) : (
                      <div className="award-pool">
                        {earnedAwards.map((award) => {
                          const key = awardKey(award);
                          const used = displayAwards.includes(key);
                          return (
                            <div
                              key={key}
                              className={`pool-award ${used ? "used" : ""}`}
                              draggable
                              onDragStart={() => setDragSource({ from: "pool", key })}
                              onDragEnd={() => { setDragSource(null); setDragOverSlot(null); }}
                              onClick={() => addAwardToFirstSlot(key)}
                              title={`${award.name} — ${award.reason}. Click or drag to add.`}
                            >
                              <div className="slot-art">
                                <AwardArt name={award.name} group={award.award_group} height={72} />
                              </div>
                              <div className="slot-name">{award.name}</div>
                              {used && <div className="pool-badge">On profile</div>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                </>
              )}

              {activeTab === "friends" && (
                <>
                <div className="box">
                  <div className="box-title">Top 4 Friends</div>
                  <div className="box-body">
                    <div className="notice">
                      Drag friends from the list below into a slot, drag between slots to reorder, or drag a slot back to the list to remove it. Slot 1 is shown first on your profile.
                    </div>
                    <div className="friend-slots">
                      {Array.from({ length: 4 }).map((_, idx) => {
                        const key = displayFriends[idx];
                        const friend = friends.find((f) => f.id === key);
                        return (
                          <div
                            key={idx}
                            className={`award-slot ${friend ? "filled" : ""} ${friendOver === idx ? "over" : ""}`}
                            draggable={!!friend}
                            onDragStart={() => friend && setFriendDrag({ from: "slot", key })}
                            onDragEnd={() => { setFriendDrag(null); setFriendOver(null); }}
                            onDragOver={(event) => { event.preventDefault(); setFriendOver(idx); }}
                            onDragLeave={() => setFriendOver(null)}
                            onDrop={(event) => { event.preventDefault(); dropFriend(idx); }}
                          >
                            <span className="slot-number">{idx + 1}</span>
                            {friend ? (
                              <>
                                <div className="friend-avatar">
                                  {friend.avatar_url ? <img loading="lazy" decoding="async" src={friend.avatar_url} alt={friend.username} /> : friend.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="slot-name">{friend.username}</div>
                                <button type="button" className="slot-remove" onClick={() => changeFriends(displayFriends.filter((_, i) => i !== idx))} aria-label={`Remove ${friend.username}`}>×</button>
                              </>
                            ) : (
                              <div className="slot-empty">Drop friend here</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="save-row">
                      <button className="save-button" type="button" disabled={savingFriends} onClick={saveFriends}>
                        {savingFriends ? "Saving..." : "Save Friends"}
                      </button>
                      {friendsMessage && (
                        <div className={friendsMessage.startsWith("Could not") ? "warning-message" : "saved-message"}>{friendsMessage}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="box"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (friendDrag?.from === "slot") changeFriends(displayFriends.filter((id) => id !== friendDrag.key));
                    setFriendDrag(null);
                    setFriendOver(null);
                  }}
                >
                  <div className="box-title">All My Friends ({friendsCount})</div>
                  <div className="box-body">
                    {friends.length === 0 ? (
                      <div className="help-text">You have no friends yet.</div>
                    ) : (
                      <div className="award-pool">
                        {friends.map((friend) => {
                          const used = displayFriends.includes(friend.id);
                          return (
                            <div
                              key={friend.id}
                              className={`pool-award ${used ? "used" : ""}`}
                              draggable
                              onDragStart={() => setFriendDrag({ from: "pool", key: friend.id })}
                              onDragEnd={() => { setFriendDrag(null); setFriendOver(null); }}
                              onClick={() => {
                                if (!used && displayFriends.length < 4) changeFriends([...displayFriends, friend.id]);
                              }}
                              title={`${friend.username}. Click or drag to add.`}
                            >
                              <div className="friend-avatar">
                                {friend.avatar_url ? <img loading="lazy" decoding="async" src={friend.avatar_url} alt={friend.username} /> : friend.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="slot-name">{friend.username}</div>
                              {used && <div className="pool-badge">On profile</div>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                </>
              )}

              {activeTab === "settings" && (
                <>
                <div className="box">
                  <div className="box-title">Email</div>
                  <div className="box-body">
                    <div className="form-row">
                      <label>Primary Email</label>
                      <input value={currentUser?.email || ""} readOnly />
                      <div className="field-note">Your primary email is linked to this account and cannot be changed.</div>
                    </div>
                    <div className="form-row">
                      <label>Second Email</label>
                      {secondaryEmail ? (
                        <>
                          <input value={secondaryEmail} readOnly />
                          <div className="field-note">Linked. Accounts can have at most 2 emails, and linked emails cannot be changed or removed.</div>
                        </>
                      ) : (
                        <>
                          <input type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="Add one more email address" />
                          <div className="field-note">You can link one extra email. Once linked it cannot be changed or removed.</div>
                        </>
                      )}
                    </div>
                    {!secondaryEmail && (
                      <div className="save-row">
                        <button className="save-button" type="button" disabled={settingsBusy} onClick={linkSecondEmail}>Link Email</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="box">
                  <div className="box-title">Password</div>
                  <div className="box-body">
                    <div className="form-row">
                      <label>New Password</label>
                      <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="At least 8 characters" />
                    </div>
                    <div className="form-row">
                      <label>Confirm New Password</label>
                      <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter new password" />
                    </div>
                    <div className="save-row">
                      <button className="save-button" type="button" disabled={settingsBusy} onClick={changePassword}>Update Password</button>
                    </div>
                  </div>
                </div>

                {settingsMessage && (
                  <div className={settingsMessage.ok ? "saved-message" : "error-text"}>{settingsMessage.text}</div>
                )}
                </>
              )}
            </main>
          </div>

          <footer className="footer">© 2026 Competitive Gaming Network</footer>
        </div>
      </div>
    </>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense fallback={<div style={{ color: "white", padding: 40 }}>Loading profile editor...</div>}>
      <EditProfileContent />
    </Suspense>
  );
}
