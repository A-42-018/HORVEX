import { useState } from "react";
import { Heart, Search, ShoppingBag } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Container,
  Drawer,
  IconButton,
  Input,
  Modal,
  Price,
  Rating,
  SectionHeading,
  Select,
  Skeleton,
} from "../components/common";
import { formatDate, formatDeliveryBy, formatPhone, formatTaka, normalizePhone } from "../lib/format";

// Dev-only reference for the A2 primitives (route exists only when import.meta.env.DEV).
// Every specimen renders twice: on the dark base and inside .section-ivory.

const SURFACES = [
  { tone: "dark", label: "Dark", className: "section-dark" },
  { tone: "ivory", label: "Ivory", className: "section-ivory" },
];

function Specimen({ id, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 border-t border-steel py-12">
      <Container className="flex flex-col gap-6">
        <h2 id={`${id}-title`} className="text-h3">
          {title}
        </h2>
        <div className="grid gap-px overflow-hidden rounded-card border border-steel lg:grid-cols-2">
          {SURFACES.map((surface) => (
            <div key={surface.tone} className={`${surface.className} flex flex-col gap-6 p-6 sm:p-8`}>
              <p className="text-eyebrow">{surface.label}</p>
              {children(surface.tone)}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

const SWATCHES = [
  ["obsidian", "bg-obsidian"],
  ["carbon", "bg-carbon"],
  ["graphite", "bg-graphite"],
  ["steel", "bg-steel"],
  ["pewter", "bg-pewter"],
  ["smoke", "bg-smoke"],
  ["ivory", "bg-ivory"],
  ["parchment", "bg-parchment"],
  ["stone", "bg-stone"],
  ["taupe", "bg-taupe"],
  ["ink", "bg-ink"],
  ["gold", "bg-gold"],
  ["gold-light", "bg-gold-light"],
  ["gold-deep", "bg-gold-deep"],
  ["oxblood", "bg-oxblood"],
  ["oxblood-light", "bg-oxblood-light"],
  ["emerald", "bg-emerald"],
  ["emerald-light", "bg-emerald-light"],
  ["amber", "bg-amber"],
  ["amber-deep", "bg-amber-deep"],
];

const TYPE = [
  ["text-display", "Time, Refined."],
  ["text-h1", "Crafted to be kept"],
  ["text-h2", "The Signature Collection"],
  ["text-h3", "Sapphire crystal, 100m water resistance"],
  ["text-eyebrow", "New season"],
  ["text-body", "Cash on delivery across Bangladesh, with a 7-day replacement guarantee."],
  ["text-small", "Free delivery inside Dhaka on orders over ৳5,000."],
  ["text-button", "Add to bag"],
  ["text-price", formatTaka(125000)],
];

// Fixed when the module loads, so renders stay pure.
const IN_THREE_DAYS = new Date(Date.now() + 3 * 86_400_000);

const AREAS = [
  { value: "dhaka", label: "Inside Dhaka" },
  { value: "outside", label: "Outside Dhaka" },
];

function DialogDemo({ tone }) {
  const [drawer, setDrawer] = useState(null);
  const [modal, setModal] = useState(false);

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" size="sm" onClick={() => setDrawer("right")}>
        Open drawer
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setDrawer("left")}>
        Left drawer
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setModal(true)}>
        Open modal
      </Button>

      <Drawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        side={drawer ?? "right"}
        tone={tone}
        title="Your bag"
        description="Right panel on desktop, bottom sheet on mobile."
        footer={
          <Button className="w-full" onClick={() => setDrawer(null)}>
            Close drawer
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Coupon code" data-autofocus />
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} className="flex items-center justify-between gap-4 p-4">
              <span className="text-small">Specimen item {i + 1}</span>
              <Price amount={18500 + i * 1000} size="sm" />
            </Card>
          ))}
        </div>
      </Drawer>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        tone={tone}
        title="Remove from bag?"
        description="Modal: ESC, the backdrop and the close button all dismiss it."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setModal(false)}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">Focus is trapped inside; Tab and Shift+Tab wrap around.</p>
      </Modal>
    </div>
  );
}

function StyleGuide() {
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  const sections = [
    ["tokens", "Tokens"],
    ["buttons", "Buttons"],
    ["badges", "Badges"],
    ["cards", "Cards, price & rating"],
    ["forms", "Inputs & select"],
    ["skeleton", "Skeleton"],
    ["heading", "Section heading"],
    ["dialogs", "Drawer & modal"],
    ["format", "Formatters"],
  ];

  const phoneSample = "+880 1712 345678";

  return (
    <div className="section-dark min-h-screen">
      <title>Style guide | HORVEX</title>
      <header className="py-12">
        <Container className="flex flex-col gap-4">
          <p className="text-eyebrow">Dev only · Phase A2</p>
          <h1 className="text-h1">Style guide</h1>
          <p className="max-w-2xl text-body text-smoke">
            Core primitives from <code>src/components/common</code>, each shown on the dark base and on an ivory
            section. Tab through to check focus rings.
          </p>
          <nav aria-label="Style guide sections">
            <ul className="flex flex-wrap gap-x-5">
              {sections.map(([id, label]) => (
                <li key={id}>
                  <Button as="a" href={`#${id}`} variant="link" size="sm">
                    {label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </header>

      <section id="tokens" aria-labelledby="tokens-title" className="scroll-mt-6 border-t border-steel py-12">
        <Container className="flex flex-col gap-8">
          <h2 id="tokens-title" className="text-h3">
            Tokens
          </h2>
          <ul className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10">
            {SWATCHES.map(([name, bg]) => (
              <li key={name} className="flex flex-col gap-2">
                <span className={`h-14 rounded-card border border-steel ${bg}`} />
                <span className="text-small text-smoke">{name}</span>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col divide-y divide-steel">
            {TYPE.map(([cls, sample]) => (
              <div key={cls} className="flex flex-col gap-2 py-4 md:flex-row md:items-baseline md:gap-8">
                <dt className="w-32 shrink-0 text-small text-smoke">{cls}</dt>
                <dd className={`${cls} min-w-0 break-words`}>{sample}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Specimen id="buttons" title="Buttons & icon buttons">
        {() => (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg">Order now</Button>
              <Button variant="secondary" size="lg">
                Explore
              </Button>
              <Button variant="link">View all</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button variant="ghost" size="sm">
                Ghost
              </Button>
              <Button disabled size="sm">
                Disabled
              </Button>
              <Button
                size="sm"
                loading={loading}
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 1500);
                }}
              >
                {loading ? "Placing order" : "Loading state"}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <IconButton label="Search">
                <Search aria-hidden="true" size={20} strokeWidth={1.5} />
              </IconButton>
              <IconButton label="Add to wishlist" pressed={wishlisted} onClick={() => setWishlisted((w) => !w)}>
                <Heart aria-hidden="true" size={20} strokeWidth={1.5} fill={wishlisted ? "currentColor" : "none"} />
              </IconButton>
              <IconButton label="Bag" variant="ghost">
                <ShoppingBag aria-hidden="true" size={20} strokeWidth={1.5} />
              </IconButton>
            </div>
          </>
        )}
      </Specimen>

      <Specimen id="badges" title="Badges">
        {() => (
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="new">New</Badge>
            <Badge variant="sale">−20%</Badge>
            <Badge variant="limited">Limited</Badge>
            <Badge variant="soldOut">Sold out</Badge>
            <Badge variant="success">In stock</Badge>
            <Badge variant="neutral">Best seller</Badge>
          </div>
        )}
      </Specimen>

      <Specimen id="cards" title="Cards, price & rating">
        {() => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card hoverable className="flex flex-col gap-3 p-5">
              <Badge variant="sale" className="self-start">
                −20%
              </Badge>
              <h3 className="text-h3">Meridian Automatic</h3>
              <Rating value={4.6} count={128} />
              <Price amount={24000} compareAt={30000} size="lg" />
            </Card>
            <Card className="flex flex-col gap-3 p-5">
              <Badge variant="new" className="self-start">
                New
              </Badge>
              <h3 className="text-h3">Aurelia Classic</h3>
              <Rating value={3.5} count={1} />
              <Price amount={125000} />
              <Price amount={9500} compareAt={10000} size="sm" />
            </Card>
          </div>
        )}
      </Specimen>

      <Specimen id="forms" title="Inputs & select">
        {() => (
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()} noValidate>
            <Input label="Full name" autoComplete="name" />
            <Input label="Mobile number" type="tel" inputMode="tel" defaultValue="0171234" error="Enter a valid Bangladeshi mobile number (01XXX-XXXXXX)" />
            <Input label="Email" type="email" optional hint="For your order receipt only." />
            <Select label="Delivery area" options={AREAS} />
            <Input label="Full address" multiline className="sm:col-span-2" />
            <Input label="Disabled" disabled defaultValue="Read only value" />
            <Select label="With error" options={AREAS} error="Choose a delivery area" />
          </form>
        )}
      </Specimen>

      <Specimen id="skeleton" title="Skeleton">
        {() => (
          <div aria-busy="true" aria-label="Loading product" className="grid grid-cols-2 gap-3 sm:gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[4/5]" />
                <Skeleton className="h-4 w-3/4" rounded="rounded-control" />
                <Skeleton className="h-4 w-1/3" rounded="rounded-control" />
              </div>
            ))}
          </div>
        )}
      </Specimen>

      <Specimen id="heading" title="Section heading">
        {() => (
          <>
            <SectionHeading
              eyebrow="Featured"
              title={
                <>
                  Time, <em>Refined.</em>
                </>
              }
              subtitle="Left-aligned with a View all link (beside it on desktop, below on mobile)."
              align="left"
              action={{ to: "/shop" }}
            />
            <SectionHeading eyebrow="Testimonials" title="Loved across Bangladesh" subtitle="Centred, no link." />
          </>
        )}
      </Specimen>

      <Specimen id="dialogs" title="Drawer & modal">
        {(tone) => <DialogDemo tone={tone} />}
      </Specimen>

      <section id="format" aria-labelledby="format-title" className="scroll-mt-6 border-t border-steel py-12">
        <Container className="flex flex-col gap-6">
          <h2 id="format-title" className="text-h3">
            Formatters <span className="text-small text-smoke">(src/lib/format.js)</span>
          </h2>
          <dl className="grid gap-x-8 gap-y-3 text-small sm:grid-cols-[auto_1fr]">
            {[
              ["formatTaka(1299)", formatTaka(1299)],
              ["formatTaka(125000)", formatTaka(125000)],
              ["formatTaka(-200)", formatTaka(-200)],
              [`normalizePhone("${phoneSample}")`, normalizePhone(phoneSample)],
              [`formatPhone("${phoneSample}")`, formatPhone(phoneSample)],
              ['formatDate("2026-10-19")', formatDate("2026-10-19")],
              ["formatDeliveryBy(+3 days)", formatDeliveryBy(IN_THREE_DAYS)],
            ].map(([call, result]) => (
              <div key={call} className="contents">
                <dt className="font-mono text-smoke">{call}</dt>
                <dd className="mb-3 tabular-nums sm:mb-0">{result}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>
    </div>
  );
}

export default StyleGuide;
