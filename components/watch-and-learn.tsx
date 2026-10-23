"use client";

import { useState } from "react";
import SkillArtwork from "@/components/skill-artwork";
import type { Skill } from "@/data/skills";

function youtubeSearchUrl(title: string) {
  const alternateNames = title === "Learn the Charlier Cut" ? "Charlie Cut" : "";
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${alternateNames} beginner tutorial`)}`;
}

function TutorialSearchFallback({ skill }: { skill: Skill }) {
  return (
    <div className="watch-coming-soon">
      <div className="watch-fallback-art"><SkillArtwork skill={skill} featured /></div>
      <div>
        <span className="watch-eyebrow">NO VERIFIED RESOURCE YET</span>
        <h3>Tutorial coming soon</h3>
        <p>We haven’t independently verified a beginner tutorial for this skill. Search results may vary and are not verified recommendations.</p>
        <a className="tutorial-search-link" href={youtubeSearchUrl(skill.title)} target="_blank" rel="noreferrer">Search YouTube results <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  );
}

function VerifiedTutorial({ skill }: { skill: Skill }) {
  const tutorial = skill.tutorial;
  if (!tutorial) return <TutorialSearchFallback skill={skill} />;

  const originalUrl = new URL("https://www.youtube.com/watch");
  originalUrl.searchParams.set("v", tutorial.youtubeId);
  if (tutorial.startSeconds > 0) originalUrl.searchParams.set("t", `${tutorial.startSeconds}s`);
  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(tutorial.youtubeId)}`);
  embedUrl.searchParams.set("start", String(tutorial.startSeconds));
  embedUrl.searchParams.set("playsinline", "1");
  embedUrl.searchParams.set("rel", "0");

  return (
    <article className="watch-resource">
      <div className="watch-player-frame">
        <iframe
          src={embedUrl.toString()}
          title={`YouTube tutorial: ${tutorial.title}`}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <div className="watch-resource-content">
        <span className="watch-eyebrow">VERIFIED TUTORIAL · {tutorial.verifiedOn}</span>
        <h3>{tutorial.title}</h3>
        <a className="tutorial-link" href={originalUrl.toString()} target="_blank" rel="noreferrer">Video by {tutorial.creator} <span aria-hidden="true">↗</span></a>
      </div>
    </article>
  );
}

function LearningMission({ skill }: { skill: Skill }) {
  const [completed, setCompleted] = useState(false);
  const nextStep = skill.milestones[1] ?? skill.milestones[0];

  return (
    <section className={`learning-mission${completed ? " mission-complete" : ""}`} id="mission" aria-labelledby="mission-title">
      <div className="mission-heading">
        <div>
          <span className="watch-eyebrow">YOUR FIRST PRACTICE · {skill.minutes} MINUTES</span>
          <h3 id="mission-title">{skill.title}: first practice</h3>
        </div>
        <span className="mission-check" aria-hidden="true">✓</span>
      </div>
      <ol className="mission-steps">{skill.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      <p className="mission-target"><strong>First win:</strong> {skill.firstMilestone}</p>
      <div className="mission-footer">
        {completed && nextStep && <p><strong>Next step:</strong> {nextStep}</p>}
        <button className="mission-complete-button" type="button" aria-pressed={completed} onClick={() => setCompleted((value) => !value)}>{completed ? "Mission complete" : "Mark mission complete"}<span aria-hidden="true">{completed ? "✓" : "○"}</span></button>
      </div>
    </section>
  );
}

export default function WatchAndLearn({ skill }: { skill: Skill }) {
  return (
    <section className="watch-learn" aria-labelledby="watch-learn-title">
      <div className="watch-section-heading">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> FIELD GUIDE / MEDIA</span>
          <h2 id="watch-learn-title">Watch &amp; Learn</h2>
          <p>Real tutorials stay separate from our decorative skill illustrations.</p>
        </div>
      </div>
      <VerifiedTutorial skill={skill} />
      <LearningMission skill={skill} />
    </section>
  );
}