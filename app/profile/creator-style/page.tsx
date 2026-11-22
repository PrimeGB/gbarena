"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { CREATOR_THEMES, isCreatorTheme, type CreatorStyle, type CreatorTheme } from "@/lib/creatorProfileStyles";
import StylePreview from "./StylePreview";
import CreatorConceptGallery from "./CreatorConceptGallery";

export default function CreatorStylePage() {
  const { user, loading } = useUser();
  const [membership, setMembership] = useState<{ userId: string; style: CreatorStyle | null; error: string } | null>(null);
  const [name, setName] = useState("Example Player");
  const [logo, setLogo] = useState<string | null>(null);
  const [theme, setTheme] = useState<CreatorTheme>("gold");
  const [showName, setShowName] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [previewTier, setPreviewTier] = useState<"affiliate" | "ambassador">("ambassador");
  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    void Promise.all([
      supabase.rpc("gb_creator_profile_style", { p_user: user.id }),
      supabase.from("profiles").select("username, logo_url").eq("id", user.id).maybeSingle(),
    ]).then(([styleResult, profileResult]) => {
      if (!active) return;
      if (styleResult.error || profileResult.error) {
        setMembership({ userId: user.id, style: null, error: styleResult.error?.message || profileResult.error?.message || "Could not load your profile." });
        return;
      }
      const row = Array.isArray(styleResult.data) ? styleResult.data[0] : null;
      if (row && (!isCreatorTheme(row.theme) || (row.tier !== "affiliate" && row.tier !== "ambassador"))) {
        setMembership({ userId: user.id, style: null, error: "Your saved creator style is invalid." });
        return;
      }
      const style: CreatorStyle | null = row ? { tier: row.tier, theme: row.theme, show_name: row.show_name, show_logo: row.show_logo } : null;
      setMembership({ userId: user.id, style, error: "" });
      if (style) {
        setTheme(style.theme); setShowName(style.show_name); setShowLogo(style.show_logo); setPreviewTier(style.tier);
      }
      if (profileResult.data?.username) setName(profileResult.data.username);
      if (profileResult.data?.logo_url) setLogo(profileResult.data.logo_url);
    });
    return () => { active = false; };
  }, [user?.id]);

  const current = membership?.userId === user?.id ? membership : null;
  const canSave = Boolean(current?.style);
  async function saveStyle() {
    setBusy(true); setError(""); setNotice("");
    const { error: saveError } = await supabase.rpc("gb_save_creator_profile_style", {
      p_theme: theme, p_show_name: showName, p_show_logo: showLogo,
    });
    if (saveError) setError(saveError.message);
    else setNotice("Style saved. Visit your profile to see it live.");
    setBusy(false);
  }
  async function submitIdea(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    const { error: ideaError } = await supabase.rpc("gb_submit_creator_profile_idea", { p_idea: idea.trim() });
    if (ideaError) setError(ideaError.message);
    else { setNotice("Your idea was sent to the Founder for review."); setIdea(""); }
    setBusy(false);
  }
  return <main className="style-vault">
    <div className="style-vault-wrap">
      <Link href="/profile" className="style-vault-back">← Back to profile</Link>
      <header className="style-vault-header"><p>GAMEBATTLES CREATOR PROGRAM</p><h1>Creator Style Vault</h1>
        <span>Pick a look that feels like you. Your profile layout, information and awards stay exactly where they are.</span></header>
      {error && <p className="vault-error" role="alert">{error}</p>}
      {notice && <p className="vault-notice" role="status">{notice}</p>}
      {current?.error && <p className="vault-error" role="alert">Creator access could not be loaded: {current.error}</p>}
      <CreatorConceptGallery />
      <div className="vault-layout">
        <section>
          <div className="vault-section-heading"><div><h2>Preview your look</h2><p>{canSave ? "Uses your current profile name and logo." : "Example preview. Active creators can save a style."}</p></div>
            {!canSave && <label>Preview as <select value={previewTier} onChange={(event) => setPreviewTier(event.target.value === "affiliate" ? "affiliate" : "ambassador")}><option value="ambassador">Ambassador</option><option value="affiliate">Affiliate</option></select></label>}
          </div>
          <StylePreview theme={theme} name={name} logo={logo} showName={showName} showLogo={showLogo} tier={previewTier} />
          <p className="vault-scope">Ambassadors receive the full profile treatment. Affiliates receive the themed top section only.</p>
        </section>
        <section className="vault-controls">
          <h2>Choose an available preset</h2><p>Choose your colors and finishing details.</p>
          <div className="vault-options">{CREATOR_THEMES.map((item) => <button key={item.id} type="button" className={`vault-option vault-option-${item.id}${theme === item.id ? " selected" : ""}`} aria-pressed={theme === item.id} onClick={() => setTheme(item.id)}>
            <i aria-hidden="true" /><span><b>{item.name}</b><small>{item.description}</small></span><strong>{theme === item.id ? "✓" : ""}</strong>
          </button>)}</div>
          <div className="vault-toggles">
            <label><input type="checkbox" checked={showName} onChange={(event) => setShowName(event.target.checked)} disabled={theme === "classic"} /> Show my name in the background</label>
            <label><input type="checkbox" checked={showLogo} onChange={(event) => setShowLogo(event.target.checked)} disabled={theme === "classic"} /> Show my profile logo in the background</label>
          </div>
          <p className="vault-hint">Add or change your logo in <Link href="/profile/edit">Account / Profile</Link>. Original keeps your current look.</p>
          {loading || (user && !current) ? <p>Checking creator access...</p>
            : !user ? <p><Link href="/login">Sign in</Link> to save a creator style.</p>
              : !canSave ? <p>Style selection is available to active Affiliates and Ambassadors.</p>
                : <button className="vault-primary" disabled={busy} onClick={() => void saveStyle()}>{busy ? "Saving..." : "Save profile style"}</button>}
        </section>
      </div>
      <section className="vault-request"><div><p className="vault-eyebrow">MAKE IT YOURS</p><h2>Have a custom idea?</h2>
        <p>Tell the Founder what you have in mind for your {previewTier === "affiliate" ? "profile's top section" : "profile"}. You can include a link to inspiration or mention the logo already on your account.</p></div>
        <form onSubmit={submitIdea}><label htmlFor="creator-idea">Your design idea</label>
          <textarea id="creator-idea" minLength={10} maxLength={2000} rows={4} value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Colors, style, background, logo placement..." required disabled={!canSave} />
          <button className="vault-primary" disabled={busy || !canSave}>Send idea to the Founder</button>
        </form></section>
    </div>
  </main>;
}
