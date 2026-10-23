import type { Skill } from "@/data/skills";
import type { SkillStatus } from "@/components/use-skill-progress";

export const timeBudgets = [2, 5, 10, 30] as const;
export type TimeBudget = (typeof timeBudgets)[number];
export const equipmentChoices = ["No equipment", "I have cards", "I have a coin", "Anything"] as const;
export type EquipmentChoice = (typeof equipmentChoices)[number];

function asMinutes(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== "string") return null;

  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(minutes?|mins?|m|seconds?|secs?|s)?$/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return /^(seconds?|secs?|s)$/i.test(match[2] ?? "") ? amount / 60 : amount;
}

function asSeconds(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== "string") return null;

  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(minutes?|mins?|m|seconds?|secs?|s)?$/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return /^(minutes?|mins?|m)$/i.test(match[2] ?? "") ? amount * 60 : amount;
}

export function getSkillDurationMinutes(skill: unknown): number | null {
  if (!skill || typeof skill !== "object") return null;
  const record = skill as Record<string, unknown>;

  for (const field of ["minutes", "durationMinutes", "estimatedMinutes", "estimatedDurationMinutes", "timeMinutes"]) {
    const value = asMinutes(record[field]);
    if (value !== null) return value;
  }

  for (const field of ["durationSeconds", "estimatedSeconds", "timeSeconds"]) {
    const seconds = asSeconds(record[field]);
    if (seconds !== null) return seconds / 60;
  }

  for (const field of ["duration", "estimatedDuration", "time"]) {
    const duration = record[field];
    if (duration && typeof duration === "object" && !Array.isArray(duration)) {
      const nested = duration as Record<string, unknown>;
      if (nested.value !== undefined && /^(seconds?|secs?|s)$/i.test(String(nested.unit ?? ""))) {
        const valueSeconds = asSeconds(nested.value);
        if (valueSeconds !== null) return valueSeconds / 60;
      }
      const minutes = asMinutes(nested.minutes ?? nested.value);
      if (minutes !== null) return minutes;
      const seconds = asSeconds(nested.seconds);
      if (seconds !== null) return seconds / 60;
    }
    const parsed = asMinutes(duration);
    if (parsed !== null) return parsed;
  }

  return null;
}

export function getEligibleSkills(skills: readonly Skill[], maxMinutes: number): Skill[] {
  if (!Number.isFinite(maxMinutes) || maxMinutes <= 0) return [];
  return skills.filter((skill) => {
    const minutes = getSkillDurationMinutes(skill);
    return minutes !== null && minutes <= maxMinutes;
  });
}

const sessionShownKey = "skill-dunk-suggested-skills";
const pageShownSlugs = new Set<string>();

function getShownSlugs(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(sessionShownKey) ?? "[]");
    const shown = new Set(pageShownSlugs);
    if (Array.isArray(parsed)) {
      for (const slug of parsed) if (typeof slug === "string") shown.add(slug);
    }
    return shown;
  } catch {
    return new Set(pageShownSlugs);
  }
}

function rememberShown(slugs: Set<string>, slug: string) {
  slugs.add(slug);
  pageShownSlugs.add(slug);
  try {
    window.sessionStorage.setItem(sessionShownKey, JSON.stringify([...slugs]));
  } catch {
    // The in-memory selection still avoids repeats during this page lifetime.
  }
}

function matchesEquipment(skill: Skill, choice: EquipmentChoice) {
  if (choice === "Anything") return true;
  if (choice === "No equipment") return skill.equipment.toLowerCase() === "no equipment";
  if (choice === "I have cards") return /\bcard(s)?\b/i.test(skill.equipment);
  return /\bcoin(s)?\b/i.test(skill.equipment);
}

function recommendFromPool(
  pool: readonly Skill[],
  progress: Readonly<Record<string, SkillStatus>>,
  shown: ReadonlySet<string>,
  random: () => number,
): Skill | null {
  const unseen = pool.filter((skill) => !shown.has(skill.slug));
  if (!unseen.length) return null;
  const notLearned = unseen.filter((skill) => progress[skill.slug] !== "Learned");
  const preferred = notLearned.length ? notLearned : unseen;
  const randomValue = random();
  const index = Number.isFinite(randomValue)
    ? Math.min(Math.max(Math.floor(randomValue * preferred.length), 0), preferred.length - 1)
    : 0;
  return preferred[index];
}

export function chooseSkill(
  skills: readonly Skill[],
  progress: Readonly<Record<string, SkillStatus>>,
  filters: { time?: TimeBudget; equipment?: EquipmentChoice } = {},
  random: () => number = Math.random,
): { skill: Skill | null; relaxed: "none" | "time" | "equipment" | "time-and-equipment" } {
  const shown = getShownSlugs();
  const unseen = skills.filter((skill) => !shown.has(skill.slug));
  if (!unseen.length) return { skill: null, relaxed: "none" };

  const equipmentMatches = unseen.filter((skill) => matchesEquipment(skill, filters.equipment ?? "Anything"));
  const timeMatches = (items: readonly Skill[], maxMinutes?: number) => maxMinutes === undefined
    ? [...items]
    : items.filter((skill) => {
      const minutes = getSkillDurationMinutes(skill);
      return minutes !== null && minutes <= maxMinutes;
    });

  let eligible = timeMatches(equipmentMatches, filters.time);
  let relaxed: "none" | "time" | "equipment" | "time-and-equipment" = "none";
  if (!eligible.length && filters.time !== undefined) {
    eligible = equipmentMatches;
    relaxed = "time";
  }
  if (!eligible.length && filters.equipment && filters.equipment !== "Anything") {
    eligible = timeMatches(unseen, filters.time);
    relaxed = relaxed === "time" ? "time-and-equipment" : "equipment";
  }
  if (!eligible.length) {
    eligible = unseen;
    relaxed = filters.time !== undefined && filters.equipment && filters.equipment !== "Anything"
      ? "time-and-equipment"
      : filters.time !== undefined ? "time" : filters.equipment && filters.equipment !== "Anything" ? "equipment" : "none";
  }

  if (relaxed === "time" || relaxed === "time-and-equipment") {
    const requestedMinutes = filters.time ?? 0;
    eligible = [...eligible].sort((left, right) =>
      Math.abs((getSkillDurationMinutes(left) ?? requestedMinutes) - requestedMinutes)
      - Math.abs((getSkillDurationMinutes(right) ?? requestedMinutes) - requestedMinutes));
    const closestDistance = Math.abs((getSkillDurationMinutes(eligible[0]) ?? requestedMinutes) - requestedMinutes);
    eligible = eligible.filter((skill) => Math.abs((getSkillDurationMinutes(skill) ?? requestedMinutes) - requestedMinutes) === closestDistance);
  }

  let skill = recommendFromPool(eligible, progress, shown, random);
  if (!skill) {
    skill = recommendFromPool(unseen, progress, shown, random);
    if (skill && relaxed === "none" && (filters.time !== undefined || (filters.equipment && filters.equipment !== "Anything"))) {
      relaxed = filters.time !== undefined && filters.equipment && filters.equipment !== "Anything"
        ? "time-and-equipment"
        : filters.time !== undefined ? "time" : "equipment";
    }
  }
  if (skill) rememberShown(shown, skill.slug);
  return { skill, relaxed };
}
