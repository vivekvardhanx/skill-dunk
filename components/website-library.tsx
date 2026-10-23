"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { websiteCategories, websites as starterWebsites, type WebsiteCategory, type WebsiteListing } from "@/data/websites";

type SuggestionValues = {
  name: string;
  url: string;
  category: WebsiteCategory;
  description: string;
  minutes: string;
  nickname: string;
};

const emptySuggestion: SuggestionValues = {
  name: "",
  url: "",
  category: websiteCategories[0],
  description: "",
  minutes: "10",
  nickname: "",
};

function formatTime(minutes: number) {
  return `${minutes} min`;
}

export default function WebsiteLibrary() {
  const [listings, setListings] = useState<WebsiteListing[]>(starterWebsites);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<WebsiteCategory | "All">("All");
  const [sort, setSort] = useState<"recommended" | "name" | "time">("recommended");
  const [surpriseId, setSurpriseId] = useState<string | null>(null);
  const previousSurprise = useRef<string | null>(null);
  const formStartedAt = useRef(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);
  const submissionInFlight = useRef(false);
  const [formValues, setFormValues] = useState<SuggestionValues>(emptySuggestion);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function loadListings() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/websites", { cache: "no-store" });
      if (!response.ok) throw new Error("The website collection could not be loaded.");
      const result: unknown = await response.json();
      if (!Array.isArray(result)) throw new Error("The website collection response was invalid.");
      const approved = result.filter((entry): entry is WebsiteListing => {
        if (!entry || typeof entry !== "object") return false;
        const listing = entry as WebsiteListing;
        return listing.status === "approved" && listing.verification === "verified";
      });
      setListings(approved);
    } catch {
      setLoadError("The full website collection could not be loaded. Showing the locally curated starter sites; retry to refresh community listings.");
      setListings(starterWebsites);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadListings(); }, []);

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = listings.filter((listing) => {
      const searchable = `${listing.name} ${listing.description} ${listing.category} ${listing.tags.join(" ")}`.toLocaleLowerCase();
      return (category === "All" || listing.category === category)
        && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
    if (sort === "name") filtered.sort((left, right) => left.name.localeCompare(right.name));
    if (sort === "time") filtered.sort((left, right) => left.minutes - right.minutes || left.name.localeCompare(right.name));
    return filtered;
  }, [category, listings, query, sort]);

  function surpriseMe() {
    if (!filteredListings.length) {
      setSurpriseId(null);
      return;
    }
    const alternatives = filteredListings.filter((listing) => listing.id !== previousSurprise.current);
    const pool = alternatives.length ? alternatives : filteredListings;
    const next = pool[Math.floor(Math.random() * pool.length)];
    previousSurprise.current = next.id;
    setSurpriseId(next.id);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`website-${next.id}`)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  function updateField(field: keyof SuggestionValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormError("");
  }

  async function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInFlight.current || submitted) return;
    submissionInFlight.current = true;
    setSubmitting(true);
    setFormError("");
    let websiteUrl: string;
    try {
      websiteUrl = new URL(formValues.url).toString();
    } catch {
      setFormError("Enter a valid website URL beginning with http:// or https://.");
      submissionInFlight.current = false;
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/suggestions/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formValues,
          minutes: Number(formValues.minutes),
          url: websiteUrl,
          company: honeypot.current?.value ?? "",
          startedAt: formStartedAt.current,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "We could not submit your suggestion. Please try again.";
        throw new Error(message);
      }
      setSubmitted(true);
      setFormValues(emptySuggestion);
      formStartedAt.current = Date.now();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "We could not submit your suggestion. Please try again.");
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  }

  function suggestAnother() {
    setSubmitted(false);
    setFormError("");
    formStartedAt.current = Date.now();
  }

  return (
    <section className="web-explore wrap" id="websites" aria-labelledby="web-explore-title">
      <div className="web-explore-heading">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot purple-dot" /> A DIFFERENT KIND OF DETOUR</span>
          <h2 id="web-explore-title">Explore the <em>Internet.</em></h2>
          <p>Find odd websites, play a brain game, experiment with science, or learn something unexpected.</p>
        </div>
        <button className="button button-outline" type="button" onClick={surpriseMe} disabled={!filteredListings.length}>
          Surprise me <span className="button-arrow">↻</span>
        </button>
      </div>

      <div className="web-controls">
        <label className="web-search">
          <span className="sr-only">Search websites, descriptions, categories, and tags</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a curious corner of the web" />
        </label>
        <label className="web-sort-label">
          <span>Sort by</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Sort websites">
            <option value="recommended">Recommended</option>
            <option value="name">Name</option>
            <option value="time">Estimated time</option>
          </select>
        </label>
      </div>

      <div className="web-category-list" role="group" aria-label="Filter websites by category">
        <button type="button" className={`web-category-chip${category === "All" ? " selected" : ""}`} aria-pressed={category === "All"} onClick={() => setCategory("All")}>All categories <span>{listings.length}</span></button>
        {websiteCategories.map((item) => (
          <button key={item} type="button" className={`web-category-chip${category === item ? " selected" : ""}`} aria-pressed={category === item} onClick={() => setCategory(category === item ? "All" : item)}>{item}</button>
        ))}
      </div>

      {loadError && <div className="web-load-error" role="status"><p>{loadError}</p><button type="button" className="text-link" onClick={() => void loadListings()}>Retry loading <span>↻</span></button></div>}
      <div className="web-results-heading">
        <span>{loading ? "Refreshing collection…" : `${filteredListings.length} curated ${filteredListings.length === 1 ? "detour" : "detours"}`}</span>
        {category !== "All" || query ? <button type="button" className="text-link" onClick={() => { setCategory("All"); setQuery(""); setSurpriseId(null); }}>Clear filters <span>×</span></button> : null}
      </div>

      {loading && listings.length === 0 ? <div className="web-empty" role="status">Loading curated websites…</div>
        : filteredListings.length ? (
          <div className="web-grid">
            {filteredListings.map((listing) => (
              <article key={listing.id} id={`website-${listing.id}`} className={`web-card${surpriseId === listing.id ? " is-surprise" : ""}`}>
                <div className="web-card-top"><span className="web-category-label">{listing.category}</span><span className="web-verified">✓ Checked {listing.lastCheckedAt}</span></div>
                <h3>{listing.name}</h3>
                <p>{listing.description}</p>
                <div className="web-tags">{listing.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <div className="web-card-meta"><span>◷ {formatTime(listing.minutes)}</span><span>{listing.pricing === "unknown" ? "Pricing not confirmed" : listing.pricing}</span></div>
                <a className="button button-lime web-open-link" href={listing.url} target="_blank" rel="noopener noreferrer">Explore website <span className="button-arrow">↗</span></a>
              </article>
            ))}
          </div>
        ) : (
          <div className="web-empty">
            <span className="empty-icon" aria-hidden="true">⌕</span>
            <h3>No websites match those filters.</h3>
            <p>Try another search or category to find a new detour.</p>
            <button type="button" className="text-link" onClick={() => { setCategory("All"); setQuery(""); }}>Show all websites <span>↗</span></button>
          </div>
        )}

      <section className="website-suggestion" aria-labelledby="suggest-website-title">
        <div className="website-suggestion-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> KNOW A GOOD DETOUR?</span>
          <h3 id="suggest-website-title">Suggest a website.</h3>
          <p>Send it our way. Suggestions stay private until a moderator reviews the destination and details.</p>
        </div>
        {submitted ? (
          <div className="suggestion-success" role="status">
            <strong>Suggestion received for review.</strong>
            <span>It will not appear in the public collection unless it is approved.</span>
            <button className="text-link" type="button" onClick={suggestAnother}>Suggest another website <span>↗</span></button>
          </div>
        ) : (
          <form className="website-suggestion-form" onSubmit={submitSuggestion}>
            <div className="suggestion-fields">
              <label>Website name<input required maxLength={80} value={formValues.name} onChange={(event) => updateField("name", event.target.value)} /></label>
              <label>Website URL<input required type="url" maxLength={2048} placeholder="https://example.com" value={formValues.url} onChange={(event) => updateField("url", event.target.value)} /></label>
              <label>Category<select value={formValues.category} onChange={(event) => updateField("category", event.target.value)}>{websiteCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Estimated time<select value={formValues.minutes} onChange={(event) => updateField("minutes", event.target.value)}>{[2, 5, 10, 15, 30, 60].map((value) => <option key={value} value={value}>{value} minutes</option>)}</select></label>
              <label className="suggestion-wide">What makes it interesting?<textarea required maxLength={500} rows={3} value={formValues.description} onChange={(event) => updateField("description", event.target.value)} /></label>
              <label>Nickname (optional)<input maxLength={40} value={formValues.nickname} onChange={(event) => updateField("nickname", event.target.value)} /></label>
              <label className="suggestion-honeypot" aria-hidden="true">Company<input ref={honeypot} type="text" tabIndex={-1} autoComplete="off" name="company" /></label>
            </div>
            {formError && <p className="suggestion-error" role="alert">{formError}</p>}
            <div className="suggestion-form-footer"><span>No account needed · reviewed before publishing</span><button className="button button-lime" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send suggestion"} <span className="button-arrow">↗</span></button></div>
          </form>
        )}
      </section>
    </section>
  );
}
