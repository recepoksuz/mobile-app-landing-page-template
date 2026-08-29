import Image from "next/image";
import Link from "next/link";
import type { AppConfig } from "../config/schema";
import { getDictionary, t } from "../i18n/resolve";
import type { Locale } from "../i18n/types";
import { legalNavLinks } from "../routes/routes";
import { LocaleSwitcher } from "./LocaleSwitcher";

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  twitter: "X",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};

/**
 * Brand glyphs, using each platform's own official mark rather than an approximation — a
 * hand-drawn "close enough" icon reads as unfinished next to the real thing. They inherit
 * `currentColor` so the footer keeps them grey; brand colour is not required at this size and
 * would pull attention away from the page.
 *
 * Paths are the canonical single-path marks (24×24 viewBox, as published by Simple Icons).
 */
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 1 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm7.846-10.405a1.441 1.441 0 0 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" />
  ),
  twitter: (
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  ),
  facebook: (
    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
  ),
  tiktok: (
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  ),
  youtube: (
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  ),
  linkedin: (
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
  ),
};


/**
 * The copyright line, with the company name linked to the corporate site when the config gives
 * one. Split around the name rather than rendered as one link, so only the company is
 * clickable and the year and the rights sentence stay plain text.
 */
function Copyright({
  template,
  company,
  href,
  year,
}: {
  template: string;
  company: string;
  href?: string;
  year: number;
}) {
  const text = t(template, { year, company });

  if (!href) return <>{text}</>;

  const at = text.indexOf(company);
  if (at === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, at)}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-fg underline decoration-border underline-offset-2 transition-colors hover:decoration-current"
      >
        {company}
      </a>
      {text.slice(at + company.length)}
    </>
  );
}

export function Footer({
  config,
  locale,
  basePath = "",
  variant = "full",
}: {
  config: AppConfig;
  locale: Locale;
  basePath?: string;
  /**
   * "minimal" is the reference sites' footer: social icons and a copyright line, nothing else.
   * It is what a hero-only page gets — the legal links live in the header, so dropping the
   * columns costs nothing a store review needs.
   */
  variant?: "full" | "minimal";
}) {
  const dict = getDictionary(locale);
  const socials = Object.entries(config.social ?? {}).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );

  if (variant === "minimal") {
    return (
      <footer className="mt-auto">
        <div className="site-container flex flex-col items-center gap-5 py-6 text-center md:flex-row md:justify-between md:text-left">
          {socials.length > 0 ? (
            <ul className="flex items-center gap-2">
              {socials.map(([key, href]) => (
                <li key={key}>
                  <a
                    href={href}
                    rel="noopener noreferrer me"
                    target="_blank"
                    aria-label={SOCIAL_LABELS[key] ?? key}
                    className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border hover:text-fg"
                  >
                    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                      {SOCIAL_ICONS[key]}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <span />
          )}

          <div className="flex flex-col items-center gap-3 md:flex-row md:gap-5">
            <LocaleSwitcher config={config} locale={locale} />
            <p className="text-sm text-muted">
              <Copyright
                template={dict.footer.copyright}
                company={config.legal.companyName}
                href={config.legal.companyUrl}
                year={new Date().getFullYear()}
              />
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border">
      <div className="site-container flex flex-col gap-10 py-12 md:flex-row md:justify-between">
        <div className="flex flex-col gap-4">
          <Link href={basePath || "/"} className="flex items-center gap-2.5" aria-label={`${config.name} ${dict.nav.home}`}>
            <Image src={config.assets.icon} alt="" width={28} height={28} className="rounded-md" />
            <span className="text-sm font-semibold tracking-tight">{config.name}</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            {config.legal.companyName}
            <br />
            {config.legal.companyAddress}
          </p>
        </div>

        <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
          <nav aria-label={dict.footer.legal} className="flex flex-col gap-3">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">{dict.footer.legal}</h2>
            {legalNavLinks(config, locale, basePath).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-fg"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {socials.length > 0 ? (
            <nav aria-label={dict.footer.social} className="flex flex-col gap-3">
              <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">{dict.footer.follow}</h2>
              <ul className="flex items-center gap-3">
                {socials.map(([key, href]) => (
                  <li key={key}>
                    <a
                      href={href}
                      rel="noopener noreferrer me"
                      target="_blank"
                      aria-label={SOCIAL_LABELS[key] ?? key}
                      className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border hover:text-fg"
                    >
                      <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true">
                        {SOCIAL_ICONS[key]}
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <div className="flex flex-col gap-3">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">{dict.footer.contact}</h2>
            <a
              href={`mailto:${config.legal.supportEmail}`}
              className="text-sm text-muted transition-colors hover:text-fg"
            >
              {config.legal.supportEmail}
            </a>
          </div>
        </div>
      </div>

      <div className="site-container flex flex-col items-center gap-4 border-t border-border py-6 text-center md:flex-row md:items-center md:justify-between md:gap-6 md:text-left">
        <p className="text-sm text-muted">
          <Copyright
            template={dict.footer.copyright}
            company={config.legal.companyName}
            href={config.legal.companyUrl}
            year={new Date().getFullYear()}
          />
        </p>

        <LocaleSwitcher config={config} locale={locale} />
      </div>
    </footer>
  );
}
