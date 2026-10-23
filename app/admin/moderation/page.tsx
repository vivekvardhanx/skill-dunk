"use client";

import { useState } from "react";
import type { WebsiteCategory, WebsiteListing } from "@/data/websites";
import { websiteCategories } from "@/data/websites";
import type { WebsiteSuggestion } from "@/lib/website-store";

type ModerationData = { pending: WebsiteSuggestion[]; approved: WebsiteListing[] };

function SuggestionReview({ suggestion, token, onChange }: {
  suggestion: WebsiteSuggestion;
  token: string;
  onChange: (message: string) => void;
}) {
  const [name, setName] = useState(suggestion.name);
  const [description, setDescription] = useState(suggestion.description);
  const [category, setCategory] = useState<WebsiteCategory>(suggestion.category);
  const [minutes, setMinutes] = useState(suggestion.minutes);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function decide(action: "approve" | "reject") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: suggestion.id, action, name, description, category, minutes, verificationConfirmed: verified }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "The moderation action failed.";
        throw new Error(message);
      }
      onChange(action === "approve" ? "Suggestion approved and published." : "Suggestion rejected.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The moderation action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="admin-review-card">
      <div className="admin-review-top"><span className="subhead-label">PENDING REVIEW</span><time dateTime={suggestion.submittedAt}>{new Date(suggestion.submittedAt).toLocaleString()}</time></div>
      <p className="admin-submitter">{suggestion.nickname ? `Suggested by ${suggestion.nickname}` : "Anonymous suggestion"}</p>
      <a href={suggestion.url} target="_blank" rel="noopener noreferrer" className="admin-external-link">{suggestion.url} ↗ <span>Opens in a new tab; inspect before approving.</span></a>
      <div className="admin-edit-fields">
        <label>Website name<input maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Category<select value={category} onChange={(event) => setCategory(event.target.value as WebsiteCategory)}>{websiteCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Exploration time (minutes)<input type="number" min={1} max={180} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} /></label>
        <label className="suggestion-wide">Description<textarea maxLength={500} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      </div>
      <label className="admin-verify-check"><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} /> I opened this destination and checked that the description and category are accurate.</label>
      {error && <p className="suggestion-error" role="alert">{error}</p>}
      <div className="admin-actions">
        <button className="button button-lime" type="button" disabled={busy || !verified} onClick={() => void decide("approve")}>{busy ? "Saving…" : "Approve & publish"}</button>
        <button className="button button-outline" type="button" disabled={busy} onClick={() => void decide("reject")}>Reject</button>
      </div>
    </article>
  );
}

export default function ModerationPage() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<ModerationData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadModerationData() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/websites", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok) {
        const text = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "The moderation queue could not be loaded.";
        throw new Error(text);
      }
      if (!result || typeof result !== "object" || !("pending" in result) || !("approved" in result)
        || !Array.isArray(result.pending) || !Array.isArray(result.approved)) {
        throw new Error("The moderation response was invalid.");
      }
      setData(result as ModerationData);
    } catch (caught) {
      setData(null);
      setError(caught instanceof Error ? caught.message : "The moderation queue could not be loaded.");
    } finally {
      setBusy(false);
    }
  }

  async function removeListing(listing: WebsiteListing) {
    if (!window.confirm(`Remove ${listing.name} from the public collection?`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: listing.id.replace(/^suggestion-/, ""), action: "remove" }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const text = result && typeof result === "object" && "error" in result && typeof result.error === "string" ? result.error : "The listing could not be removed.";
        throw new Error(text);
      }
      await loadModerationData();
      setMessage("Listing removed from the public collection.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The listing could not be removed.");
      setBusy(false);
    }
  }

  function refreshAfterAction(text: string) {
    void loadModerationData().then(() => setMessage(text));
  }

  return (
    <main className="admin-page">
      <header className="detail-header"><a className="brand" href="/"><span className="brand-mark">s<span>.</span></span><span>skill dunk</span></a><a className="back-link" href="/">← Back to exploring</a></header>
      <section className="admin-wrap">
        <span className="eyebrow"><span className="eyebrow-dot" /> RESTRICTED WORKSPACE</span>
        <h1>Website moderation</h1>
        <p className="admin-intro">Review community suggestions before publishing. Every moderation action is checked by the server.</p>
        <form className="admin-login" onSubmit={(event) => { event.preventDefault(); void loadModerationData(); }}>
          <label>Administrator token<input type="password" autoComplete="current-password" value={token} onChange={(event) => setToken(event.target.value)} required /></label>
          <button className="button button-lime" type="submit" disabled={busy}>{busy ? "Loading…" : data ? "Refresh queue" : "Open moderation queue"}</button>
        </form>
        {error && <p className="suggestion-error" role="alert">{error}</p>}
        {message && <p className="suggestion-success admin-message" role="status">{message}</p>}
        {data && <>
          <section className="admin-list-section"><h2>Pending suggestions <span>{data.pending.length}</span></h2>
            {data.pending.length ? <div className="admin-review-list">{data.pending.map((suggestion) => <SuggestionReview key={suggestion.id} suggestion={suggestion} token={token} onChange={refreshAfterAction} />)}</div> : <p className="admin-empty">No suggestions are waiting for review.</p>}
          </section>
          <section className="admin-list-section"><h2>Approved community listings <span>{data.approved.length}</span></h2>
            {data.approved.length ? <div className="admin-approved-list">{data.approved.map((listing) => <article className="admin-approved-row" key={listing.id}><div><strong>{listing.name}</strong><a href={listing.url} target="_blank" rel="noopener noreferrer">{listing.url} ↗</a></div><button className="button button-outline" type="button" disabled={busy} onClick={() => void removeListing(listing)}>Remove listing</button></article>)}</div> : <p className="admin-empty">No community listings have been published.</p>}
          </section>
        </>}
      </section>
    </main>
  );
}
