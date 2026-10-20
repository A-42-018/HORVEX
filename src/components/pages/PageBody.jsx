// Renders a `pages.content` value (plain text) as paragraphs. Blank lines split
// paragraphs; React escapes the text, so nothing from the DB is injected as HTML.
function PageBody({ content, className = "" }) {
  const paragraphs = String(content ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;

  return (
    <div className={`space-y-5 text-body text-muted ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

export default PageBody;
