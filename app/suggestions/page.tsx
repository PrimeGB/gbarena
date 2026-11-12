"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../lib/useUser";
import { bugAreas, bugBrowsers, bugDevices, maxBugDetailsLength } from "../../lib/feedbackOptions";

type PostType = "Suggestion" | "Bug Report";

export default function SuggestionsPage() {
  const { user, loading: authLoading } = useUser();
  const [selectedType, setSelectedType] = useState<PostType>("Suggestion");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [area, setArea] = useState("");
  const [device, setDevice] = useState("");
  const [browser, setBrowser] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const cleanTitle = title.trim();
    const cleanDetails = details.trim();
    if (cleanTitle.length < 4 || cleanDetails.length < 10) {
      setError("Enter a title of at least 4 characters and details of at least 10 characters.");
      return;
    }
    if (selectedType === "Bug Report" && (!area || cleanDetails.length > maxBugDetailsLength)) {
      setError(!area ? "Choose where you found the bug." : `Bug report details must be ${maxBugDetailsLength} characters or fewer.`);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (sessionError || !token) {
        setError("Sign in to submit a suggestion or bug report.");
        return;
      }

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: selectedType, title: cleanTitle, details: cleanDetails,
          ...(selectedType === "Bug Report" ? { area, device, browser } : {}),
        }),
      });
      const result: { error?: string; emailDelivered?: boolean } = await response.json();
      if (!response.ok) {
        setError(result.error || "Your submission could not be sent. Please try again.");
        return;
      }

      setTitle("");
      setDetails("");
      setArea("");
      setDevice("");
      setBrowser("");
      setSuccess(
        selectedType === "Bug Report"
          ? "Your bug report is saved for staff review and in the founder's inbox. Bug Finder awards require staff to confirm the issue is fixed."
          : "Your suggestion is saved for staff review and in the founder's inbox."
      );
      if (result.emailDelivered !== true) {
        setError("Your submission was saved, but the founder email notification could not be sent.");
      }
    } catch (submitError) {
      setError(`Delivery could not be confirmed: ${submitError instanceof Error ? submitError.message : "Please check your connection."} Contact support before resubmitting to avoid duplicates.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box}
        body{margin:0;background:#000;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif}
        .feedback-page{max-width:1240px;min-height:100vh;margin:0 auto;background:#07111b;border:1px solid #315f88}
        .feedback-header{padding:22px 24px;background:linear-gradient(110deg,#173956,#07111b);border-bottom:2px solid #315f88}
        .feedback-brand{color:#fff;font-size:30px;font-weight:900;text-transform:uppercase}
        .feedback-subtitle{margin-top:5px;color:#f2c14e;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase}
        .feedback-content{padding:24px}
        .feedback-back{color:#9bc9ec;font-size:12px;font-weight:bold;text-decoration:none}
        .feedback-heading{margin:22px 0}
        .feedback-heading h1{margin:0;color:#f2c14e;font-size:28px}
        .feedback-heading p{margin:8px 0 0;color:#b9cddd;font-size:13px;line-height:1.6}
        .feedback-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(240px,1fr);gap:14px;align-items:start}
        .feedback-panel{min-width:0;background:#0a1622;border:1px solid #315f88}
        .feedback-panel-title{margin:0;padding:12px 16px;background:#0f2a40;border-bottom:1px solid #315f88;color:#f2c14e;font-size:12px;font-weight:bold;text-transform:uppercase}
        .feedback-form,.feedback-guide{padding:18px}
        .feedback-type{min-width:0;margin:0 0 20px;padding:0;border:0}
        .feedback-type legend{padding:0;color:#fff;font-size:14px;font-weight:bold}
        .feedback-type-hint{margin:6px 0 12px;color:#b9cddd;font-size:12px;line-height:1.5}
        .feedback-type-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .feedback-type button{min-height:112px;padding:14px;text-align:left;border:2px solid #6198bf;background:linear-gradient(to bottom,#193d59,#10283d);color:#fff;font:inherit;cursor:pointer}
        .feedback-type button:hover{border-color:#b9e1ff;background:#214d6c}
        .feedback-type button:focus-visible{outline:2px solid #fff;outline-offset:3px}
        .feedback-type button[aria-pressed="true"]{border-color:#f2c14e;background:linear-gradient(to bottom,#e2bd5e,#a77b20);color:#151000}
        .feedback-type button:disabled{cursor:wait;opacity:.7}
        .feedback-type-name,.feedback-type-description,.feedback-type-state{display:block}
        .feedback-type-name{font-size:15px;font-weight:bold}
        .feedback-type-description{margin-top:5px;font-size:12px;line-height:1.4}
        .feedback-type-state{margin-top:10px;font-size:11px;font-weight:bold;text-transform:uppercase}
        .feedback-label{display:block;margin:0 0 7px;color:#f2c14e;font-size:12px;font-weight:bold}
        .feedback-input,.feedback-textarea,.feedback-select{display:block;width:100%;margin-bottom:16px;padding:12px;border:1px solid #315b7d;background:#02070c;color:#fff;font:inherit;font-size:14px}
        .feedback-select{cursor:pointer}
        .feedback-context{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px}
        .feedback-context-area{grid-column:1 / -1}
        .feedback-context-hint{margin:-5px 0 15px;color:#b9cddd;font-size:12px;line-height:1.5}
        .feedback-textarea{min-height:180px;resize:vertical;line-height:1.5}
        .feedback-input:focus,.feedback-textarea:focus,.feedback-select:focus{outline:2px solid #8dcaff;outline-offset:1px}
        .feedback-submit{padding:12px 20px;border:1px solid #e8c46a;background:linear-gradient(to bottom,#d6a943,#8a6218);color:#07111b;font:inherit;font-size:12px;font-weight:bold;text-transform:uppercase;cursor:pointer}
        .feedback-submit:disabled{opacity:.55;cursor:not-allowed}
        .feedback-message{margin:0 0 16px;padding:12px;border:1px solid #a34a4a;background:#2a1010;color:#ffd1d1;font-size:13px;line-height:1.5}
        .feedback-success{border-color:#387854;background:#102e21;color:#b8ebc8}
        .feedback-guide h3{margin:0 0 7px;color:#fff;font-size:14px}
        .feedback-guide p,.feedback-guide li{color:#c8d8e8;font-size:13px;line-height:1.6}
        .feedback-guide p{margin:0 0 16px}
        .feedback-guide ul{margin:0 0 18px;padding-left:20px}
        .feedback-guide a,.feedback-message a{color:#8dcaff}
        @media(max-width:768px){.feedback-content{padding:18px 14px}.feedback-header{padding:18px}.feedback-grid{grid-template-columns:minmax(0,1fr)}.feedback-heading h1{font-size:24px}}
        @media(max-width:450px){.feedback-type-options,.feedback-context{grid-template-columns:1fr}.feedback-type button{min-height:0}.feedback-context-area{grid-column:auto}}
      `}</style>
      <div className="feedback-page">
        <header className="feedback-header">
          <div className="feedback-brand">GameBattles</div>
          <div className="feedback-subtitle">Community Feedback</div>
        </header>
        <main className="feedback-content">
          <Link className="feedback-back" href="/latest-news/accepted-suggestions">← Back to Accepted Suggestions</Link>
          <div className="feedback-heading">
            <h1>Suggestions &amp; Bug Reports</h1>
            <p>Share an idea or let us know when something is not working.</p>
          </div>
          <div className="feedback-grid">
            <section className="feedback-panel">
              <h2 className="feedback-panel-title">Submit feedback</h2>
              <form className="feedback-form" onSubmit={submitPost}>
                {!authLoading && !user && (
                  <p className="feedback-message"><Link href="/login?next=%2Fsuggestions">Sign in</Link> to submit feedback.</p>
                )}
                {error && <p role="alert" className="feedback-message">{error}</p>}
                {success && <p role="status" className="feedback-message feedback-success">{success}</p>}
                <fieldset className="feedback-type">
                  <legend>What would you like to send?</legend>
                  <p className="feedback-type-hint">Choose one below. You can switch between an idea and a bug report.</p>
                  <div className="feedback-type-options">
                    <button type="button" disabled={submitting} aria-pressed={selectedType === "Suggestion"} onClick={() => setSelectedType("Suggestion")}>
                      <span className="feedback-type-name">Suggestion</span>
                      <span className="feedback-type-description">Share an idea to improve GameBattles.</span>
                      <span className="feedback-type-state">{selectedType === "Suggestion" ? "Selected" : "Select suggestion →"}</span>
                    </button>
                    <button type="button" disabled={submitting} aria-pressed={selectedType === "Bug Report"} onClick={() => setSelectedType("Bug Report")}>
                      <span className="feedback-type-name">Report a Bug</span>
                      <span className="feedback-type-description">Tell us about something that is not working.</span>
                      <span className="feedback-type-state">{selectedType === "Bug Report" ? "Selected" : "Select bug report →"}</span>
                    </button>
                  </div>
                </fieldset>
                {selectedType === "Bug Report" && (
                  <>
                    <p className="feedback-context-hint">Help us narrow it down before describing the problem.</p>
                    <div className="feedback-context">
                      <div className="feedback-context-area">
                        <label className="feedback-label" htmlFor="bug-area">Where did you find the bug? (required)</label>
                        <select id="bug-area" className="feedback-select" value={area} onChange={(event) => setArea(event.target.value)} required>
                          <option value="">Choose a page or area</option>
                          {bugAreas.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="feedback-label" htmlFor="bug-device">Device (optional)</label>
                        <select id="bug-device" className="feedback-select" value={device} onChange={(event) => setDevice(event.target.value)}>
                          <option value="">Select a device</option>
                          {bugDevices.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="feedback-label" htmlFor="bug-browser">Browser (optional)</label>
                        <select id="bug-browser" className="feedback-select" value={browser} onChange={(event) => setBrowser(event.target.value)}>
                          <option value="">Select a browser</option>
                          {bugBrowsers.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}
                <label className="feedback-label" htmlFor="feedback-title">Title</label>
                <input id="feedback-title" className="feedback-input" value={title} onChange={(event) => setTitle(event.target.value)} minLength={4} maxLength={160} required placeholder={selectedType === "Suggestion" ? "What is your idea?" : "What is not working?"} />
                <label className="feedback-label" htmlFor="feedback-details">Details</label>
                <textarea id="feedback-details" className="feedback-textarea" value={details} onChange={(event) => setDetails(event.target.value)} minLength={10} maxLength={selectedType === "Bug Report" ? maxBugDetailsLength : 5000} required placeholder={selectedType === "Suggestion" ? "Describe your idea and how it would help." : "Describe what happened and how to reproduce it."} />
                <button className="feedback-submit" type="submit" disabled={submitting || authLoading || !user}>
                  {submitting ? "Sending..." : `Submit ${selectedType}`}
                </button>
              </form>
            </section>
            <aside className="feedback-panel">
              <h2 className="feedback-panel-title">Before you send</h2>
              <div className="feedback-guide">
                <h3>{selectedType === "Suggestion" ? "Share a clear idea" : "Help us reproduce the bug"}</h3>
                {selectedType === "Suggestion" ? (
                  <ul><li>Explain what you would like to see.</li><li>Tell us how it would help players.</li></ul>
                ) : (
                  <ul><li>Include the page and steps to reproduce it.</li><li>Describe what happened and what you expected.</li><li>Verify your account email before submitting a bug report.</li></ul>
                )}
                <h3>What happens next?</h3>
                <p>Feedback is sent to staff for review and to the founder&apos;s inbox. We also send an email notification to the founder.</p>
                <h3>Need match help?</h3>
                <p>For disputes, score issues, or urgent match help, visit <Link href="/support">Support</Link> instead.</p>
                <Link href="/latest-news/accepted-suggestions">See accepted suggestions →</Link>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
