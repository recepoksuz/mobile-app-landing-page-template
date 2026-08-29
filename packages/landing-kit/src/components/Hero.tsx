import Image from "next/image";
import type { AppConfig } from "../config/schema";
import type { Locale } from "../i18n/types";
import { StoreBadges } from "./StoreBadges";

/**
 * Hero.
 *
 * Two layouts rather than one that stretches: below `lg` the mockup sits under the copy as a
 * real element, and from `lg` up it moves into a second column. The in-between approach — an
 * absolutely positioned image behind the text — looked acceptable at one width and illegible at
 * the rest, which is the failure mode this splits apart.
 *
 * Type is fluid (`clamp`) instead of stepping at a breakpoint: a heading that jumps 40px → 64px
 * at exactly 768 is oversized at 770 and cramped at 760. Fluid sizing has no such cliff, and it
 * means the design holds at widths nobody thought to test.
 *
 * Geometry at the top end matches the reference (spec §8), measured rather than eyeballed:
 * 106px icon, 64px/1.1 heading on a 600px measure, 22px lead.
 *
 * The section fills the viewport below the header. `min-h` rather than `h`, so a long
 * tagline or a landscape phone grows the section instead of clipping it; `svh` rather than
 * `vh`, because `vh` measures the viewport with the mobile URL bar retracted and overflows
 * by that bar's height on first paint.
 */
export function Hero({
  compact = false,
  proofBelow = false,
  config,
  locale,
  basePath = "",
  tagline,
  description,
  mockupSize,
}: {
  /** True when nothing follows the hero, so it should sit in the screen rather than scroll. */
  compact?: boolean;
  /** Whether the stats strip renders below, whose height a hero-only page must leave room for. */
  proofBelow?: boolean;
  config: AppConfig;
  locale: Locale;
  basePath?: string;
  tagline: string;
  description: string;
  /** Intrinsic size of the mockup, probed from the file so real screenshots keep their ratio. */
  mockupSize: { width: number; height: number };
}) {
  return (
    <section
      className={`site-container relative flex flex-col justify-center py-12 lg:py-16 ${
        compact && proofBelow
          ? "min-h-[calc(100svh-var(--header-h)-var(--proof-h))]"
          : "min-h-[calc(100svh-var(--header-h))]"
      }`}
    >
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)] xl:gap-16">
        <div className="max-w-[600px] text-center lg:text-left">
          <Image
            src={config.assets.icon}
            alt={`${config.name} app icon`}
            width={106}
            height={106}
            className="reveal reveal-1 mx-auto rounded-[22px] lg:mx-0 lg:rounded-[26px]"
            style={{ width: "clamp(4rem, 3rem + 3.4vw, 6.625rem)", height: "auto" }}
            priority
          />

          <h1
            className="display-gradient reveal reveal-2 mt-6 leading-[1.08] tracking-[-0.025em] text-balance lg:mt-8"
            style={{ fontSize: "clamp(2.125rem, 1.15rem + 4.1vw, 4rem)" }}
          >
            {tagline}
          </h1>

          <p
            className="reveal reveal-3 mx-auto mt-5 max-w-[34rem] leading-[1.55] text-muted text-pretty lg:mx-0 lg:mt-6"
            style={{ fontSize: "clamp(1.0625rem, 0.95rem + 0.45vw, 1.375rem)" }}
          >
            {description}
          </p>

          <div className="reveal reveal-4 mt-7 flex justify-center lg:mt-9 lg:justify-start">
            <StoreBadges config={config} locale={locale} basePath={basePath} campaign="hero" />
          </div>
        </div>

        {/*
          The glow is sized against this column rather than the viewport, so it cannot widen the
          page — an absolutely positioned circle in viewport units was the source of the
          horizontal scrollbar above 1024. It is deliberately not clipped: `overflow-hidden`
          here cuts the blur into a visible rectangle.
        */}
        <div className="reveal reveal-5 relative isolate mx-auto w-full max-w-[420px] lg:mx-0 lg:max-w-none">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-full -translate-x-1/2 lg:w-[118%] -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 55%, transparent) 0%, color-mix(in srgb, var(--color-accent) 16%, transparent) 40%, transparent 68%)",
              filter: "blur(72px)",
            }}
          />
          <Image
            src={config.assets.mockup}
            alt={`${config.name} app screenshot`}
            width={mockupSize.width}
            height={mockupSize.height}
            className="mx-auto h-auto w-full max-w-[420px] lg:max-w-none"
            sizes="(min-width: 1024px) 460px, 92vw"
            priority
          />
        </div>
      </div>
    </section>
  );
}
