export default function LoadingSkill() {
  return <main className="detail-page loading-page" aria-busy="true" aria-label="Loading skill guide">
    <div className="detail-header"><span className="skeleton skeleton-logo" /><span className="skeleton skeleton-back" /></div>
    <div className="detail-wrap"><div className="detail-intro"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-art" /></div><div className="lesson-grid"><div className="skeleton skeleton-video" /><div className="skeleton skeleton-aside" /></div></div>
  </main>;
}