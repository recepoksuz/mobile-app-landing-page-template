import type { ReactNode } from "react";
import { getDictionary, t } from "../i18n/resolve";
import type { Locale } from "../i18n/types";

type LegalPageProps = {
  title: string;
  /** ISO date — drives the "Last updated" line. */
  updated: string;
  /** The locale of the surrounding page. */
  locale: Locale;
  /** The locale this document's prose is actually written in. */
  documentLocale: Locale;
  intro?: ReactNode;
  children: ReactNode;
};

/**
 * Shared shell for the legal documents. The measure is held at 68ch for readability and the
 * heading hierarchy stays flat (h1 -> h2, no skipped levels) for accessibility.
 */
export function LegalPage({
  title,
  updated,
  locale,
  documentLocale,
  intro,
  children,
}: LegalPageProps) {
  const dict = getDictionary(locale);
  const translated = documentLocale === locale;

  const formatted = new Date(updated).toLocaleDateString(documentLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <main className="site-container py-16 md:py-24">
      {/*
        `lang` is set on the article rather than the page: when a locale has no translation of
        this document the visitor gets the default-locale prose, and a screen reader has to
        switch voice for it.
      */}
      <article className="mx-auto w-full max-w-[68ch]" lang={documentLocale}>
        {!translated ? (
          <p
            lang={locale}
            className="mb-8 rounded-card border border-border bg-surface px-4 py-3 text-sm text-muted"
          >
            {dict.legal.englishOnlyNotice}
          </p>
        ) : null}

        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">{title}</h1>
        <p className="mt-4 text-sm text-muted">
          {t(getDictionary(documentLocale).legal.lastUpdated, { date: "" }).trim()}{" "}
          <time dateTime={updated}>{formatted}</time>
        </p>
        {intro ? <div className="mt-8 text-lg leading-relaxed text-muted">{intro}</div> : null}
        <div className="legal-prose mt-10">{children}</div>
      </article>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[0.975rem] leading-relaxed text-muted">{children}</p>;
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.975rem] leading-relaxed text-muted">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
