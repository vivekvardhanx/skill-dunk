"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="detail-page error-page" role="alert">
      <section className="error-content">
        <span className="eyebrow"><span className="eyebrow-dot" /> A SMALL DETOUR</span>
        <h1>That didn’t quite land.</h1>
        <p>This page hit a snag. Your saved skills are still in your browser; try again or head back to explore.</p>
        <div className="error-actions">
          <button className="button button-lime" type="button" onClick={reset}>Try again <span className="button-arrow">↻</span></button>
          <a href="/">Back to exploring ↗</a>
        </div>
      </section>
    </main>
  );
}