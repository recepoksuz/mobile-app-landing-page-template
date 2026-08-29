import type { AppConfig } from "../config/schema";
import { getDictionary } from "../i18n/resolve";
import type { Locale } from "../i18n/types";

/**
 * An accordion built on `<details>` — it works without JavaScript and screen-reader
 * support comes from the browser. The same data also produces the `FAQPage` JSON-LD
 * (spec §9).
 */
export function Faq({
  locale,
  faq,
}: {
  locale: Locale;
  faq: AppConfig["content"]["faq"];
}) {
  const dict = getDictionary(locale);
  if (faq.length === 0) return null;

  return (
    <section aria-labelledby="faq-heading" className="site-container section-y">
      <h2
        id="faq-heading"
        className="display-gradient mx-auto max-w-3xl text-center font-semibold tracking-tight text-balance"
        style={{ fontSize: "clamp(1.75rem, 1.4rem + 1.4vw, 2.25rem)" }}
      >
        {dict.sections.faq}
      </h2>

      <div className="section-lead mx-auto max-w-3xl divide-y divide-border border-y border-border">
        {faq.map((item) => (
          <details key={item.q} className="faq-item group [&[open]_.chevron]:rotate-45">
            <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-6 py-5 text-left text-base font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <svg
                className="chevron size-5 shrink-0 text-muted transition-transform duration-200"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <path d="M10 4v12M4 10h12" strokeLinecap="round" />
              </svg>
            </summary>
            <p className="max-w-2xl pb-5 text-[0.95rem] leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
