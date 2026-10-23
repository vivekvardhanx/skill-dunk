import Link from "next/link";

export default function NotFound() {
  return (
    <main className="detail-page error-page">
      <section className="error-content">
        <span className="eyebrow"><span className="eyebrow-dot" /> FIELD GUIDE / 404</span>
        <h1>We can’t find that skill.</h1>
        <p>It may have wandered off. Pick another small skill from the shelf.</p>
        <div className="error-actions"><Link className="button button-lime" href="/">Back to exploring <span className="button-arrow">↗</span></Link></div>
      </section>
    </main>
  );
}