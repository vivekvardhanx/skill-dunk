"use client";

import Link from "next/link";
import { forwardRef, useImperativeHandle, useState } from "react";
import SkillArtwork from "@/components/skill-artwork";
import {
  chooseSkill,
  equipmentChoices,
  getSkillDurationMinutes,
  timeBudgets,
  type EquipmentChoice,
  type TimeBudget,
} from "@/components/boredom-recommendations";
import type { Skill } from "@/data/skills";
import type { SkillStatus } from "@/components/use-skill-progress";

export type BoredomPickerHandle = {
  surprise: () => void;
};

type BoredomPickerProps = {
  skills: readonly Skill[];
  progress: Readonly<Record<string, SkillStatus>>;
};

function formatMinutes(minutes: number) {
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)} min`;
}

const BoredomPicker = forwardRef<BoredomPickerHandle, BoredomPickerProps>(function BoredomPicker({ skills, progress }, ref) {
  const [timeBudget, setTimeBudget] = useState<TimeBudget>(5);
  const [equipment, setEquipment] = useState<EquipmentChoice>("Anything");
  const [recommendation, setRecommendation] = useState<Skill | null>(null);
  const [message, setMessage] = useState("");

  function chooseOne(filters: { time?: TimeBudget; equipment?: EquipmentChoice }) {
    const result = chooseSkill(skills, progress, filters);
    setRecommendation(result.skill);
    if (!result.skill) {
      setMessage("You’ve seen every skill this session. Come back for a fresh set next time.");
      return;
    }

    const notices = {
      none: "",
      time: "No exact fit, so we relaxed the time limit and picked the closest match.",
      equipment: "No equipment match was available, so we relaxed that filter.",
      "time-and-equipment": "No exact fit was available, so we relaxed the filters and picked the closest match.",
    };
    setMessage(notices[result.relaxed]);
  }

  useImperativeHandle(ref, () => ({
    surprise: () => chooseOne({}),
  }));

  const minutes = recommendation ? getSkillDurationMinutes(recommendation) : null;

  return (
    <section className="boredom-panel wrap" id="boredom-panel" aria-labelledby="boredom-panel-title">
      <div className="boredom-panel-heading">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> THE BOREDOM BUTTON</span>
          <h2 id="boredom-panel-title">A little something to try?</h2>
          <p>Choose your time and what you have nearby. We’ll pick one skill.</p>
        </div>
      </div>
      <div className="boredom-panel-filters">
        <fieldset>
          <legend>Time</legend>
          {timeBudgets.map((budget) => (
            <button
              className={`time-chip${timeBudget === budget ? " selected" : ""}`}
              type="button"
              key={budget}
              aria-pressed={timeBudget === budget}
              onClick={() => setTimeBudget(budget)}
            >
              {budget} min
            </button>
          ))}
        </fieldset>
        <label>
          <span>Equipment</span>
          <select value={equipment} onChange={(event) => setEquipment(event.target.value as EquipmentChoice)}>
            {equipmentChoices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
          </select>
        </label>
      </div>
      <button className="button button-lime boredom-panel-submit" type="button" onClick={() => chooseOne({ time: timeBudget, equipment })}>
        Show me one <span className="button-arrow">↗</span>
      </button>
      {recommendation && minutes !== null ? (
        <article className="boredom-recommendation" key={recommendation.slug} aria-live="polite" aria-atomic="true">
          <div className="boredom-art"><SkillArtwork skill={recommendation} featured /></div>
          <div className="boredom-recommendation-content">
            <span className="boredom-kicker">A TINY DETOUR FOR YOU</span>
            <h3>{recommendation.title}</h3>
            <div className="boredom-meta"><span>{recommendation.subcategory ?? recommendation.category}</span><span>◷ {formatMinutes(minutes)}</span><span>{recommendation.equipment}</span></div>
            <div className="boredom-actions">
              <Link className="button button-lime" href={`/skills/${recommendation.slug}`}>Start learning <span className="button-arrow">↗</span></Link>
              <button className="button button-outline" type="button" onClick={() => chooseOne({ time: timeBudget, equipment })}>Not this one <span className="button-arrow">↻</span></button>
            </div>
          </div>
        </article>
      ) : (
        <p className="boredom-panel-status" role="status" aria-live="polite">{message || "Pick your filters, then we’ll find one skill to try."}</p>
      )}
      {recommendation && <p className="boredom-panel-status" role="status" aria-live="polite">{message}</p>}
    </section>
  );
});

export default BoredomPicker;
