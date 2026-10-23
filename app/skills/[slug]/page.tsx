import Link from "next/link";
import { notFound } from "next/navigation";
import LessonDetail from "@/components/lesson-detail";
import { getSkill, skills } from "@/data/skills";

export const dynamicParams = false;

export function generateStaticParams() {
  return skills.map((skill) => ({ slug: skill.slug }));
}

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = getSkill(slug);
  if (!skill) notFound();

  return <main className="detail-page">
    <header className="detail-header"><Link className="brand" href="/"><span className="brand-mark">s<span>.</span></span><span>skill dunk</span></Link><Link className="back-link" href="/">← <span>Back to exploring</span></Link></header>
    <LessonDetail skill={skill} />
    <footer className="detail-footer"><span>SKILL DUNK / FIELD NOTES</span><Link href="/">FIND ANOTHER TINY OBSESSION ↗</Link></footer>
  </main>;
}