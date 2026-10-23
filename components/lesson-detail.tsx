"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SkillArtwork from "@/components/skill-artwork";
import WatchAndLearn from "@/components/watch-and-learn";
import { skills, type Skill } from "@/data/skills";
import { skillStatuses, useSkillProgress, type SkillStatus } from "@/components/use-skill-progress";

export default function LessonDetail({ skill }: { skill: Skill }) {
  const [detailState, setDetailState] = useState({ saved: false, started: false, milestones: [] as number[] });
  const [loadedStorageKey, setLoadedStorageKey] = useState("");
  const [detailStorageError, setDetailStorageError] = useState(false);
  const [challengeVisible, setChallengeVisible] = useState(false);
  const [challengeMessage, setChallengeMessage] = useState("");
  const { progress, ready, storageError, setSkillStatus } = useSkillProgress();
  const status = progress[skill.slug];
  const relatedSkills = skills
    .filter((item) => item.category === skill.category && item.slug !== skill.slug)
    .sort((left, right) => Number(right.subcategory === skill.subcategory) - Number(left.subcategory === skill.subcategory))
    .slice(0, 4);
  const nextSkills = (skill.nextSkills ?? []).flatMap((slug) => {
    const nextSkill = skills.find((item) => item.slug === slug);
    return nextSkill ? [nextSkill] : [];
  });
  const completed = detailState.milestones;
  const completionPercent = Math.round((completed.length / skill.milestones.length) * 100);
  const detailStorageKey = `skill-dunk-detail-v1:${skill.slug}`;

  useEffect(() => {
    setChallengeVisible(new URLSearchParams(window.location.search).get("challenge") === "1");
  }, []);

  useEffect(() => {
    if (!ready || loadedStorageKey === detailStorageKey) return;
    try {
      const stored = window.localStorage.getItem(detailStorageKey);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const value = parsed as { saved?: unknown; started?: unknown; milestones?: unknown };
          const milestones = Array.isArray(value.milestones)
            ? value.milestones.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < skill.milestones.length)
            : [];
          setDetailState({
            saved: typeof value.saved === "boolean" ? value.saved : Boolean(status),
            started: value.started === true || status === "Learning" || status === "Learned",
            milestones,
          });
        } else {
          setDetailState({ saved: Boolean(status), started: status === "Learning" || status === "Learned", milestones: [] });
        }
      } else {
        setDetailState({ saved: Boolean(status), started: status === "Learning" || status === "Learned", milestones: [] });
      }
    } catch {
      setDetailStorageError(true);
      setDetailState({ saved: Boolean(status), started: status === "Learning" || status === "Learned", milestones: [] });
    } finally {
      setLoadedStorageKey(detailStorageKey);
    }
  }, [detailStorageKey, loadedStorageKey, ready, skill.milestones.length, status]);

  useEffect(() => {
    if (loadedStorageKey !== detailStorageKey) return;
    try {
      window.localStorage.setItem(detailStorageKey, JSON.stringify(detailState));
    } catch {
      setDetailStorageError(true);
    }
  }, [detailState, detailStorageKey, loadedStorageKey]);

  function toggleMilestone(index: number) {
    setDetailState((current) => ({
      ...current,
      milestones: current.milestones.includes(index)
        ? current.milestones.filter((item) => item !== index)
        : [...current.milestones, index],
    }));
  }

  function updateStatus(nextStatus: SkillStatus) {
    setSkillStatus(skill.slug, nextStatus);
    setDetailState((current) => ({
      ...current,
      started: nextStatus === "Learning" || nextStatus === "Learned",
    }));
  }

  function toggleSaved() {
    const nextSaved = !detailState.saved;
    setDetailState((current) => ({ ...current, saved: nextSaved }));
    if (nextSaved && !status) setSkillStatus(skill.slug, "Not Started");
    if (!nextSaved && status === "Not Started") setSkillStatus(skill.slug, null);
  }

  function startLearning() {
    if (status !== "Learned") updateStatus("Learning");
    setDetailState((current) => ({ ...current, started: true }));
    document.getElementById("mission")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function challengeFriend() {
    const challengeUrl = `${window.location.origin}/skills/${skill.slug}?challenge=1`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Try ${skill.title}`, url: challengeUrl });
        setChallengeMessage("Challenge shared.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setChallengeMessage("Sharing cancelled.");
          return;
        }
      }
    }
    try {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(challengeUrl);
          copied = true;
        } catch {
          copied = false;
        }
      }
      if (!copied) copied = copyWithSelection(challengeUrl);
      if (!copied) throw new Error("Clipboard unavailable");
      setChallengeMessage("Challenge link copied.");
    } catch {
      setChallengeMessage("Couldn’t copy the link. You can share this page’s address manually.");
    }
  }

  function copyWithSelection(value: string) {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    return copied;
  }

  return <div className="detail-wrap">
    {challengeVisible && <aside className="challenge-banner" aria-label="Friend challenge"><p>A friend thinks you can do this. First win: {skill.firstMilestone}</p><button type="button" onClick={() => setChallengeVisible(false)} aria-label="Dismiss friend challenge">×</button></aside>}
    <div className="detail-intro">
      <div className="detail-title-block">
        <span className="eyebrow"><span className="eyebrow-dot" /> {(skill.subcategory ?? skill.category).toUpperCase()} / FIELD GUIDE</span>
        <h1>{skill.title}<span className="title-period">.</span></h1>
        <p>{skill.description}</p>
        <div className="detail-tags"><span>{skill.difficulty === "Advanced" ? "✳ " : "◌ "}{skill.difficulty}</span><span>◷ {skill.minutes} MIN</span><span>{skill.equipment}</span></div>
        <div className="detail-actions">
          <button className="button button-lime start-button" type="button" disabled={!ready || loadedStorageKey !== detailStorageKey} onClick={startLearning}>{detailState.started ? "Continue learning" : "Start learning"}<span className="button-arrow">↓</span></button>
          <button className={`detail-bookmark${detailState.saved ? " is-saved" : ""}`} type="button" disabled={!ready || loadedStorageKey !== detailStorageKey} onClick={toggleSaved} aria-pressed={detailState.saved} aria-label={detailState.saved ? `Remove ${skill.title} from saved skills` : `Save ${skill.title}`}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 3.5h9v13l-4.5-3-4.5 3v-13Z" /></svg>{detailState.saved ? "Skill saved" : "Save skill"}
          </button>
        </div>
        <button className="challenge-button" type="button" onClick={challengeFriend}>Challenge a friend <span aria-hidden="true">↗</span></button>
        {challengeMessage && <p className="challenge-feedback" role="status" aria-live="polite">{challengeMessage}</p>}
        <p className="detail-action-hint">Start learning unlocks milestone check-offs. Save skill keeps it in My Skills; mark the mission complete after practice.</p>
        <label className="detail-status-label">MY PROGRESS<select className="detail-status-select" value={status ?? ""} disabled={!ready} onChange={(event) => event.target.value && updateStatus(event.target.value as SkillStatus)} aria-label={`${skill.title} progress status`}><option value="" disabled>Choose a status</option>{skillStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        {(storageError || detailStorageError) && <p className="storage-notice" role="status">Browser storage is unavailable. Progress may not persist after leaving this page.</p>}
      </div>
      <div className="detail-art"><SkillArtwork skill={skill} featured /></div>
    </div>

    <div className="lesson-grid">
      <section className="lesson-main">
        <WatchAndLearn skill={skill} />
        <section className="mistakes-section detail-mistakes"><div className="subhead"><span>KEEP IT EASY</span><h2>Common mistakes</h2></div><ul>{skill.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></section>
      </section>
      <aside className="lesson-aside">
        <section className="materials-panel"><span className="subhead-label">A FEW THINGS</span><h2>What you’ll need</h2>{skill.materials.length > 0 ? <ul>{skill.materials.map((material) => <li key={material}><span>＋</span>{material}</li>)}</ul> : <p className="equipment-note">No specific materials needed.</p>}{skill.equipmentFreePractice && <p className="equipment-note">This first practice can be done without equipment.</p>}</section>
        {skill.prerequisites && skill.prerequisites.length > 0 && <section className="materials-panel"><span className="subhead-label">BEFORE YOU BEGIN</span><h2>Helpful first moves</h2><ul>{skill.prerequisites.map((slug) => { const prerequisite = skills.find((item) => item.slug === slug); return prerequisite ? <li key={slug}><span>↗</span><Link href={`/skills/${prerequisite.slug}`}>{prerequisite.title}</Link></li> : null; })}</ul></section>}
        {skill.safetyNotes.length > 0 && <section className="materials-panel safety-panel"><span className="subhead-label">A QUICK SAFETY NOTE</span><h2>Keep it comfortable</h2><ul>{skill.safetyNotes.map((note) => <li key={note}><span>!</span>{note}</li>)}</ul></section>}
        <section className="milestones-panel"><span className="subhead-label">YOUR TINY WINS</span><div className="milestone-heading"><h2>Milestones</h2><div className="milestone-ring" role="img" aria-label={`${completed.length} of ${skill.milestones.length} milestones completed`}><svg viewBox="0 0 36 36" aria-hidden="true"><circle className="milestone-ring-track" cx="18" cy="18" r="15" /><circle className="milestone-ring-fill" cx="18" cy="18" r="15" style={{ strokeDashoffset: `${94.25 * (1 - completed.length / skill.milestones.length)}` }} /></svg><span>{completionPercent}%</span></div></div><div className="milestone-progress"><span style={{ width: `${completionPercent}%` }} /></div><div className="milestone-count">{completed.length} OF {skill.milestones.length} DONE</div><ul>{skill.milestones.map((milestone, index) => <li key={milestone}><label className={completed.includes(index) ? "milestone-done" : ""}><input type="checkbox" checked={completed.includes(index)} onChange={() => toggleMilestone(index)} disabled={!detailState.started || loadedStorageKey !== detailStorageKey} /><span className="custom-check" aria-hidden="true">{completed.includes(index) ? "✓" : ""}</span>{milestone}</label></li>)}</ul>{!detailState.started && <p className="milestone-hint">Start learning to check off your progress.</p>}</section>
        {relatedSkills.length > 0 && <section className="related-moves"><span className="subhead-label">MORE IN {skill.category.toUpperCase()}</span><ul>{relatedSkills.map((item) => <li key={item.slug}><Link href={`/skills/${item.slug}`}>{item.title}<span aria-hidden="true">↗</span></Link></li>)}</ul></section>}
        {nextSkills.length > 0 && <section className="next-move-panel"><span className="subhead-label">KEEP THE MOMENTUM</span><h2>Try next</h2><ul>{nextSkills.map((item) => <li key={item.slug}><Link href={`/skills/${item.slug}`}>{item.title}<span aria-hidden="true">↗</span></Link></li>)}</ul></section>}
        <Link href="/" className="next-skill-link">Feeling curious? <span>Find another skill ↗</span></Link>
      </aside>
    </div>
  </div>;
}