import Image from "next/image";
import { LogoWordmark, ledgerTypeCadence } from "@/components/blocks/logo-wordmarks";
import {
  type CompanyEntry,
  type LogoCloudProps,
  logoCloudSchema,
  parseBlock,
} from "@/lib/blocks/schemas";
import { LedgerCorners } from "./ledger";

// The comp's logo ledger: a label row, then the client logos laid out in a
// bordered 6x2 grid with a crosshair on each corner. It replaced a scrolling
// marquee of logo images, and `lede` went with it. The marquee is back as
// `variant="marquee"`: the same logos in one sliding row, with the ledger
// still the default.
//
// `logos` stayed, and it is the whole point of the Block: an entry is an
// image, a name with one of five marks beside it, or a name alone, and the
// three mix freely in one array. The comp's twelve placeholders are the
// shipped content in home.mdx, not artwork baked in here — client logos are
// the most client-specific content on a marketing page, so an agent editing
// MDX has to be able to replace them without touching a component. What the
// components still own is the drawing: the five glyphs and the per-cell type
// cadence, both in logo-wordmarks.tsx.
//
// `--animate-marquee` and `@keyframes marquee` in globals.css drive the
// marquee variant, as they do the announcement bar.
//
// SectionHeader is not used here. It gained `eyebrow` and `meta` in ROB-3209,
// but its `title` is required and this section has no title — passing a fake
// one, or making the title optional to fit one caller, would both be worse
// than the eight lines of header markup below.
//
// Measured off the Paper comp (artboard "home", frame "logo-soup / A —
// Ledger"), not approximated: 64px block padding, a 28px gap under the header,
// 116px cells, a 10px gap beside the accent tick, and crosshairs sitting 4px
// outside each corner of the grid so their stroke lands on the rule itself.
// The four colours the comp uses here are `--ledger-*` tokens in globals.css,
// added because the nearest existing tokens were near but not equal.
// One logo, as either variant draws it. `index` is the entry's position, which
// sets the wordmark's type cadence.
function LogoMark({ logo, index }: { logo: CompanyEntry; index: number }) {
  return "src" in logo ? (
    // Unoptimized because these are usually SVG logotypes, which
    // next/image will not optimize without dangerouslyAllowSVG.
    // 28px tall, as the marquee drew them, so an image cell sits
    // at the weight of the wordmarks beside it.
    <Image
      alt={logo.alt}
      className="h-7 w-auto"
      height={28}
      src={logo.src}
      unoptimized
      width={120}
    />
  ) : (
    // The cadence is per POSITION, not per name (see
    // logo-wordmarks.tsx), and cycles so a ledger longer than
    // twelve carries it round again instead of running out.
    <LogoWordmark
      className={ledgerTypeCadence[index % ledgerTypeCadence.length]}
      mark={logo.mark}
      name={logo.name}
    />
  );
}

// One pass of the marquee's logos. The track renders this twice, the second
// copy `aria-hidden` and gone under reduced motion, so the -50% slide
// (globals.css `@keyframes marquee`) loops with no seam. The spacing is
// padding inside each item rather than a gap, so both copies are exactly the
// same width.
function MarqueeCopy({ logos, hidden }: { logos: CompanyEntry[]; hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden}
      className={
        hidden
          ? "flex shrink-0 items-center motion-reduce:hidden"
          : "flex shrink-0 items-center motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center"
      }
    >
      {logos.map((logo, index) => (
        <li
          className="flex h-29 shrink-0 items-center justify-center px-10"
          // biome-ignore lint/suspicious/noArrayIndexKey: entries may repeat and position is their identity
          key={`${index}-${"src" in logo ? logo.src : logo.name}`}
        >
          <LogoMark index={index} logo={logo} />
        </li>
      ))}
    </ul>
  );
}

export function LogoCloud(raw: LogoCloudProps) {
  const { variant, eyebrow, logos, meta } = parseBlock("LogoCloud", logoCloudSchema, raw);

  return (
    <section className="font-sans">
      <div className="page-inset py-16">
        {/* The comp bottom-aligns the label and the meta note, which is what
            settles the 12px eyebrow and the 14px note onto one line. */}
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
          <p className="flex items-center gap-2.5">
            {/* The 4x10 accent tick, same mark SectionHeader draws. Decorative:
                the label beside it carries the meaning. */}
            <span aria-hidden="true" className="h-2.5 w-1 shrink-0 rounded-full bg-primary" />
            <span className="font-mono text-eyebrow text-muted-foreground uppercase">
              {eyebrow}
            </span>
          </p>
          {meta && <span className="text-ledger-meta text-sm">{meta}</span>}
        </div>

        {variant === "marquee" ? (
          <div className="mt-7 overflow-hidden border-y border-ledger-rule text-ledger-wordmark">
            <div className="flex w-max motion-safe:animate-marquee motion-reduce:w-full">
              <MarqueeCopy logos={logos} />
              <MarqueeCopy hidden logos={logos} />
            </div>
          </div>
        ) : (
          <>
            {/* `relative` so the crosshairs can hang off the grid's corners. The
            grid closes itself the way the comp draws it: the rule on the top
            and left edges belongs to the container, every other rule is a
            cell's own bottom and right, so no two rules ever stack — which
            would double a 9% white line into an 18% one.

            Twelve divides evenly by 2, 3 and 6, so every breakpoint fills
            whole rows and the border arrangement holds at each of them. */}
            <div className="relative mt-7 text-ledger-wordmark">
              <ul className="grid grid-cols-2 border-t border-l border-ledger-rule sm:grid-cols-3 lg:grid-cols-6">
                {logos.map((logo, index) => (
                  <li
                    className="flex h-29 items-center justify-center border-r border-b border-ledger-rule"
                    // The index is in the key deliberately: the schema allows two
                    // entries with the same name or the same src (two clients can
                    // share a wordmark), so content alone is not unique — see the
                    // duplicate-entry test in schemas.test.ts. Position is the
                    // identity here, same as the cadence below.
                    // biome-ignore lint/suspicious/noArrayIndexKey: the ledger is a fixed positional grid and its entries may repeat
                    key={`${index}-${"src" in logo ? logo.src : logo.name}`}
                  >
                    <LogoMark index={index} logo={logo} />
                  </li>
                ))}
              </ul>
              <LedgerCorners />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
