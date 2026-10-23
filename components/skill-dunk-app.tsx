"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import BoredomPicker, { type BoredomPickerHandle } from "@/components/boredom-picker";
import SkillArtwork from "@/components/skill-artwork";
import { cardCoinSubcategories, categories, skills, type SkillCategory, type SkillSubcategory } from "@/data/skills";
import { skillStatuses, useSkillProgress, type SkillStatus } from "@/components/use-skill-progress";
import WebsiteLibrary from "@/components/website-library";

function Brand() {
  return <Link className="brand" href="/" aria-label="Skill Dunk home"><span className="brand-mark">s<span>.</span></span><span>skill dunk</span></Link>;
}

function BookmarkButton({ saved, disabled, onClick, label }: { saved: boolean; disabled: boolean; onClick: (event: React.MouseEvent<HTMLButtonElement>) => void; label: string }) {
  return (
    <button className={`bookmark${saved ? " is-saved" : ""}`} type="button" disabled={disabled} onClick={onClick} aria-label={`${saved ? "Remove from" : "Add to"} My Skills: ${label}`} aria-pressed={saved}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 3.5h9v13l-4.5-3-4.5 3v-13Z" /></svg>
    </button>
  );
}

export default function SkillDunkApp() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SkillCategory | "All">("All");
  const [activeSubcategory, setActiveSubcategory] = useState<SkillSubcategory | "All">("All");
  const [activeMinutes, setActiveMinutes] = useState<number | "All">("All");
  const [savedOnly, setSavedOnly] = useState(false);
  const [previewSkillSlug, setPreviewSkillSlug] = useState<string | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const boredomPicker = useRef<BoredomPickerHandle>(null);
  const { progress, ready, storageError, setSkillStatus } = useSkillProgress();

  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      const target = event.target;
      const isTyping = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchInput.current?.focus();
      }
      if (event.key === "Escape" && target === searchInput.current) searchInput.current?.blur();
    }

    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  const boredomSkills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return skills.filter((skill) => {
      const matchesCategory = activeCategory === "All" || skill.category === activeCategory;
      const matchesSubcategory = activeCategory !== "Cards & Coins" || activeSubcategory === "All" || skill.subcategory === activeSubcategory;
      const matchesSaved = !savedOnly || Boolean(progress[skill.slug]);
      const searchable = `${skill.title} ${skill.category} ${skill.subcategory ?? ""} ${skill.description} ${skill.tags?.join(" ") ?? ""}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      return matchesCategory && matchesSubcategory && matchesSaved && matchesQuery;
    });
  }, [activeCategory, activeSubcategory, progress, query, savedOnly]);

  const filteredSkills = useMemo(() => activeMinutes === "All"
    ? boredomSkills
    : boredomSkills.filter((skill) => skill.minutes === activeMinutes), [activeMinutes, boredomSkills]);

  function toggleSaved(slug: string) {
    setSkillStatus(slug, progress[slug] ? null : "Not Started");
  }

  return (
    <main aria-busy={!ready}>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="main-nav" aria-label="Main navigation">
            <a className="nav-active" href="#explore">Explore</a>
            <a href="#categories">Categories</a>
            <a href="#websites">Explore the Internet</a>
            <button type="button" className={savedOnly ? "nav-active" : ""} disabled={!ready} onClick={() => setSavedOnly((value) => !value)} aria-pressed={savedOnly}>My Skills{ready && Object.keys(progress).length > 0 ? <span className="saved-count">{Object.keys(progress).length}</span> : null}</button>
          </nav>
          <label className="search-box">
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.7" cy="8.7" r="5.8" /><path d="m13 13 4 4" /></svg>
            <span className="sr-only">Search skills</span>
            <input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a tiny obsession" />
            <kbd>/</kbd>
          </label>
        </div>
      </header>

      <section className="hero wrap" id="explore">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT FIVE MINUTES, WELL SPENT</span>
          <h1>Bored? Learn<br />something <em>weird.</em></h1>
          <p>Small skills. Big “wait, I can do that?” energy.<br className="desktop-break" /> Trade the endless scroll for a tiny new talent.</p>
          <div className="hero-actions">
            <button className="button button-lime boredom-trigger" onClick={() => { boredomPicker.current?.surprise(); document.getElementById("boredom-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }); }} type="button" disabled={!ready} aria-label="Surprise me with one skill"><span>Surprise me</span><span className="button-arrow">↗</span></button>
            <a href="#skills" className="text-link">Find your next thing <span>↓</span></a>
          </div>
          <a href="#websites" className="text-link hero-web-link">Or explore interesting websites <span>↗</span></a>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-stamp">SMALL<br />SKILL.<br /><i>BIG</i><br />MOOD.</div>
          <div className="hero-ball ball-one" /><div className="hero-ball ball-two" /><div className="hero-ball ball-three" />
          <span className="hero-doodle">✳</span><span className="hero-scribble">TAKE A TINY<br />DETOUR ↗</span>
          <span className="hero-side-label">FIG. 01 — A BETTER KIND OF BREAK</span>
        </div>
      </section>

      <BoredomPicker ref={boredomPicker} skills={skills} progress={progress} />

      <section className="discovery wrap" id="categories">
        <div className="section-heading">
          <div><span className="eyebrow"><span className="eyebrow-dot purple-dot" /> PICK A DIRECTION</span><h2>What kind of<br /><em>curious</em> today?</h2></div>
          <p>No streaks to protect.<br />No pressure to be good.<br />Just follow the fun.</p>
        </div>
        <div className="category-list" role="group" aria-label="Filter skills by category">
          <button className={`category-chip${activeCategory === "All" ? " selected" : ""}`} type="button" onClick={() => { setActiveCategory("All"); setActiveSubcategory("All"); }} aria-pressed={activeCategory === "All"}>Everything <span>{skills.length}</span></button>
          {categories.map((category, index) => <button className={`category-chip${activeCategory === category ? " selected" : ""}`} key={category} type="button" onClick={() => { setActiveCategory(activeCategory === category ? "All" : category); setActiveSubcategory("All"); }} aria-pressed={activeCategory === category}><span className="category-index">{String(index + 1).padStart(2, "0")}</span>{category === "Cards & Coins" && <svg className="category-combo-icon" viewBox="0 0 20 16" aria-hidden="true"><rect x="1" y="2" width="9" height="12" rx="1" /><path d="M4 2V1h9a2 2 0 0 1 2 2v8h-2" /><circle cx="15" cy="11" r="3.5" /></svg>}{category}{category === "Cards & Coins" && <span className="category-count">{skills.filter((skill) => skill.category === category).length}</span>}</button>)}
        </div>
        {activeCategory === "Cards & Coins" && <div className="category-list card-subcategory-list" role="group" aria-label="Filter cards and coins skills by type">
          <button className={`category-chip${activeSubcategory === "All" ? " selected" : ""}`} type="button" onClick={() => setActiveSubcategory("All")} aria-pressed={activeSubcategory === "All"}>All <span>{skills.filter((skill) => skill.category === "Cards & Coins").length}</span></button>
          {cardCoinSubcategories.map((subcategory) => {
            const count = skills.filter((skill) => skill.category === "Cards & Coins" && skill.subcategory === subcategory).length;
            return <button className={`category-chip${activeSubcategory === subcategory ? " selected" : ""}`} key={subcategory} type="button" onClick={() => setActiveSubcategory(activeSubcategory === subcategory ? "All" : subcategory)} aria-pressed={activeSubcategory === subcategory}>{subcategory}<span>{count}</span></button>;
          })}
        </div>}
        <div className="time-filter" role="group" aria-label="Filter by practice time">
          <span className="time-filter-label">GOT A MINUTE?</span>
          <button className={`time-chip${activeMinutes === "All" ? " selected" : ""}`} type="button" onClick={() => setActiveMinutes("All")} aria-pressed={activeMinutes === "All"}>Any time</button>
          {[2, 5, 10, 30].map((minutes) => <button className={`time-chip${activeMinutes === minutes ? " selected" : ""}`} type="button" key={minutes} onClick={() => setActiveMinutes(activeMinutes === minutes ? "All" : minutes)} aria-pressed={activeMinutes === minutes}>{minutes} min</button>)}
        </div>
      </section>

      <section className="skill-section wrap" id="skills" aria-labelledby="skill-grid-title">
        <div className="grid-heading">
          <div><span className="eyebrow">THE SKILL SHELF</span><h2 id="skill-grid-title">{savedOnly ? "Your little collection" : query ? "Found for you" : "Pick up a new trick"}<span className="result-count">{filteredSkills.length.toString().padStart(2, "0")}</span></h2></div>
          <span className="grid-sort">A GOOD PLACE TO START <span>↘</span></span>
        </div>
        {storageError && <p className="storage-notice" role="status">Browser storage is unavailable. Changes will last only until you leave this page.</p>}
        {filteredSkills.length > 0 ? (
          <div className="skill-grid">
            {filteredSkills.map((skill, index) => (
              <article className={`skill-card${previewSkillSlug === skill.slug ? " is-previewing" : ""}`} key={skill.slug} style={{ "--card-delay": `${index * 45}ms` } as React.CSSProperties}>
                <Link className="card-art-link" href={`/skills/${skill.slug}`} aria-label={`Learn about ${skill.title}`}><SkillArtwork skill={skill} /></Link>
                <button className="preview-toggle" type="button" aria-pressed={previewSkillSlug === skill.slug} aria-label={`${previewSkillSlug === skill.slug ? "Stop" : "Play"} illustrative preview for ${skill.title}`} title="Toggle decorative motion" onClick={() => setPreviewSkillSlug((current) => current === skill.slug ? null : skill.slug)}><span aria-hidden="true">{previewSkillSlug === skill.slug ? "Ⅱ" : "▶"}</span></button>
                <BookmarkButton saved={Boolean(progress[skill.slug])} disabled={!ready} label={skill.title} onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleSaved(skill.slug); }} />
                <div className="card-content">
                  <div className="card-category"><span style={{ "--category-color": skill.accent } as React.CSSProperties} />{skill.subcategory ?? skill.category}</div>
                  <Link className="card-title" href={`/skills/${skill.slug}`}>{skill.title}<span>↗</span></Link>
                  <div className="card-meta"><span>{skill.difficulty === "Advanced" ? "✳ " : "◌ "}{skill.difficulty}</span><span>◷ {skill.minutes} min</span><span>{skill.equipment}</span></div>
                  {progress[skill.slug] && <label className="card-status-label">MY STATUS<select className="card-status-select" value={progress[skill.slug]} disabled={!ready} onChange={(event) => setSkillStatus(skill.slug, event.target.value as SkillStatus)} aria-label={`${skill.title} learning status`}>{skillStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><span className="empty-icon">⌕</span><h3>{savedOnly && !Object.keys(progress).length ? "Nothing in your collection yet." : "No tiny obsessions found."}</h3><p>{savedOnly && !Object.keys(progress).length ? "Tap the bookmark on anything that catches your eye." : "Try another search, time, or category."}</p><button className="text-link" type="button" onClick={() => { setQuery(""); setActiveCategory("All"); setActiveMinutes("All"); setSavedOnly(false); }}>Show me everything <span>↗</span></button></div>
        )}
      </section>

      <WebsiteLibrary />
      <footer className="site-footer wrap"><Brand /><p>Make a little room for wonder.</p><span>© SKILL DUNK · GO ON, TRY SOMETHING</span></footer>
    </main>
  );
}