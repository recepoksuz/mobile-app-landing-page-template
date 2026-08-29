import Image from "next/image";
import Link from "next/link";
import type { AppConfig } from "../config/schema";
import { getDictionary } from "../i18n/resolve";
import type { Locale } from "../i18n/types";
import { headerNavLinks } from "../routes/routes";
import { MobileMenu } from "./MobileMenu";

/**
 * Wordmark on the left, nav pushed to the right, and the whole bar sticky.
 *
 * The reference site left-aligns its nav beside the logo; putting it opposite is a deliberate
 * difference. It also earns the sticky behaviour: a right-hand nav does not collide with the
 * hero mockup as the page scrolls under it.
 *
 * The bar is translucent with a blur so the accent glow behind the hero still reads through it,
 * and it only grows a bottom hairline once there is content beneath — handled in CSS, so no
 * scroll listener runs on the main thread.
 *
 * The mobile menu is a `<details>` element: no JavaScript, and keyboard and screen-reader
 * behaviour come from the browser.
 */
export function Header({
  config,
  locale,
  basePath = "",
}: {
  config: AppConfig;
  locale: Locale;
  basePath?: string;
}) {
  const dict = getDictionary(locale);
  const links = headerNavLinks(locale, basePath);
  const home = basePath || "/";

  return (
    <header className="sticky top-0 z-40">
      {/*
        The blur lives on its own layer rather than on the header itself. `backdrop-filter`
        establishes a containing block for `position: fixed` descendants, which would pin the
        full-screen mobile panel to this bar instead of the viewport.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/60"
      />

      <div className="site-container relative flex h-[var(--header-h)] items-center gap-6 md:gap-8">
        <Link
          href={home}
          aria-label={`${config.name} ${dict.nav.home}`}
          className="relative z-[70] shrink-0"
        >
          <Image
            src={config.assets.logo}
            alt={config.name}
            width={234}
            height={36}
            className="h-7 w-auto md:h-9"
            priority
          />
        </Link>

        <nav aria-label={dict.nav.main} className="ml-auto hidden items-center gap-7 md:flex">
          <Link href={home} className="text-base text-fg transition-opacity hover:opacity-70">
            {dict.nav.home}
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base text-fg transition-opacity hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/*
          Mobile menu: a full-screen panel, as on the reference site, rather than a dropdown —
          at this width a small floating list is fiddly to hit and easy to dismiss by accident.

          It is still a `<details>` element, so it opens with no JavaScript and the browser
          supplies the toggle semantics, focus handling and Escape behaviour for free. The
          summary sits above the panel so the wordmark and the close control stay on the bar.
        */}
        {/*
          Mobile menu, matching the reference: a panel over the whole viewport with the wordmark
          and the close control still on top of it, not a dropdown hanging off the bar.

          It stays a `<details>` element, so it opens without JavaScript and the browser supplies
          the toggle semantics, focus order and Escape handling. The panel sits at z-50 while the
          wordmark and summary sit at z-70, which is what keeps them legible over it.
        */}
        <MobileMenu className="ml-auto md:hidden [&[open]_.icon-open]:hidden [&[open]_.icon-close]:block">
          <summary
            className="relative z-[70] -mr-2 flex size-11 cursor-pointer select-none list-none items-center justify-center rounded-lg text-fg [&::-webkit-details-marker]:hidden"
            aria-label={dict.nav.menu}
          >
            <svg className="icon-open size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M3 8h18M3 16h18" strokeLinecap="round" />
            </svg>
            <svg className="icon-close hidden size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
            </svg>
          </summary>

          <nav
            aria-label={dict.nav.mobile}
            className="menu-panel fixed inset-0 z-50 flex flex-col items-center justify-center gap-[3.25rem] overflow-y-auto bg-bg px-6 py-24"
          >
            <Link href={home} className="text-2xl font-semibold text-fg">
              {dict.nav.home}
            </Link>
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-base text-fg/90 hover:text-fg">
                {link.label}
              </Link>
            ))}
          </nav>
        </MobileMenu>
      </div>
    </header>
  );
}
