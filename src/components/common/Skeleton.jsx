// Loading placeholder: surface block with a slow shimmer (roadmap §3.4). Size it
// like the real content so nothing shifts when data lands. It's hidden from
// assistive tech; mark the loading region with aria-busy and give it a label.
// Under reduced motion the shimmer runs once instantly and the block stays still.
function Skeleton({ className = "", rounded = "rounded-card" }) {
  return (
    <div aria-hidden="true" className={`relative overflow-hidden bg-surface ${rounded} ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fg/5 to-transparent" />
    </div>
  );
}

export default Skeleton;
