"use client";

import { useEffect, useState } from "react";
import { skills } from "@/data/skills";

export const skillStatuses = ["Not Started", "Learning", "Learned"] as const;
export type SkillStatus = (typeof skillStatuses)[number];
type Progress = Record<string, SkillStatus>;

const storageKey = "skill-dunk-progress-v1";
const legacyStorageKey = "skill-dunk-saved";
const validSlugs = new Set(skills.map((skill) => skill.slug));

function isSkillStatus(value: unknown): value is SkillStatus {
  return typeof value === "string" && skillStatuses.includes(value as SkillStatus);
}

export function useSkillProgress() {
  const [progress, setProgress] = useState<Progress>({});
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      const loaded: Progress = {};
      const storedProgress = window.localStorage.getItem(storageKey);
      if (storedProgress) {
        const parsed: unknown = JSON.parse(storedProgress);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          for (const [slug, status] of Object.entries(parsed)) {
            if (validSlugs.has(slug) && isSkillStatus(status)) loaded[slug] = status;
          }
        }
      }

      const legacyBookmarks = window.localStorage.getItem(legacyStorageKey);
      if (legacyBookmarks) {
        const parsed: unknown = JSON.parse(legacyBookmarks);
        if (Array.isArray(parsed)) {
          for (const slug of parsed) {
            if (typeof slug === "string" && validSlugs.has(slug) && !loaded[slug]) loaded[slug] = "Not Started";
          }
        }
      }
      setProgress(loaded);
    } catch {
      setStorageError(true);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
      window.localStorage.removeItem(legacyStorageKey);
    } catch {
      setStorageError(true);
    }
  }, [progress, ready]);

  function setSkillStatus(slug: string, status: SkillStatus | null) {
    setProgress((current) => {
      if (status === null) {
        const next = { ...current };
        delete next[slug];
        return next;
      }
      return { ...current, [slug]: status };
    });
  }

  return { progress, ready, storageError, setSkillStatus };
}