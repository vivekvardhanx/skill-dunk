import type { Skill } from "@/data/skills";

export default function SkillArtwork({ skill, featured = false }: { skill: Skill; featured?: boolean }) {
  return (
    <div
      className={`skill-art art-${skill.palette} art-skill-${skill.slug}${featured ? " art-featured" : ""}`}
      style={{ "--art-accent": skill.accent } as React.CSSProperties}
      aria-hidden="true"
    >
      <span className="art-orbit art-orbit-one" />
      <span className="art-orbit art-orbit-two" />
      <span className="art-symbol" aria-hidden="true">{skill.icon}</span>
      {skill.slug === "three-ball-juggling" && (
        <span className="juggle-balls" aria-hidden="true"><i /><i /><i /></span>
      )}
      {skill.slug.startsWith("morse-") && <span className="morse-pulse" aria-hidden="true"><i /><i /><i /><b /></span>}
      {skill.slug === "origami-crane" && <span className="fold-paper" aria-hidden="true" />}
      {skill.slug === "coin-roll" && <span className="coin-spark" aria-hidden="true">✦</span>}
    </div>
  );
}