import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { strings } from "../../lib/strings";
import Button from "./Button";

// Eyebrow (gold) → serif H2 → optional subcopy, plus an optional "View all →"
// link (roadmap §3.4): beside the heading on desktop, below it on mobile.
function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  action, // { to, label? }
  as: Heading = "h2",
  id,
  className = "",
}) {
  const centered = align === "center" && !action;

  const actionLink = action && (
    <Button as={Link} to={action.to} variant="link" size="sm" className="group shrink-0 self-start md:self-auto">
      {action.label ?? strings.common.viewAll}
      <ArrowRight
        aria-hidden="true"
        size={16}
        strokeWidth={1.5}
        className="transition-transform duration-base group-hover:translate-x-1"
      />
    </Button>
  );

  return (
    <div
      className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${centered ? "md:justify-center" : ""} ${className}`}
    >
      <div className={`flex flex-col gap-4 ${centered ? "items-center text-center" : "items-start text-left"}`}>
        {eyebrow && <p className="text-eyebrow">{eyebrow}</p>}
        <Heading id={id} className="text-h2 text-fg">{title}</Heading>
        {subtitle && <p className="max-w-2xl text-body text-muted">{subtitle}</p>}
      </div>
      {actionLink}
    </div>
  );
}

export default SectionHeading;
