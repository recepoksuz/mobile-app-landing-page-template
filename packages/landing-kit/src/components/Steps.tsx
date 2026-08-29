import type { AppConfig } from "../config/schema";
import { getDictionary } from "../i18n/resolve";
import type { Locale } from "../i18n/types";

/** "How it works" — if `content.steps` is empty the block is never rendered. */
export function Steps({
  locale,
  steps,
}: {
  locale: Locale;
  steps: AppConfig["content"]["steps"];
}) {
  const dict = getDictionary(locale);
  if (steps.length === 0) return null;

  return (
    <section aria-labelledby="steps-heading" className="border-y border-border bg-surface">
      <div className="site-container section-y">
        <h2
          id="steps-heading"
          className="display-gradient max-w-2xl font-semibold tracking-tight text-balance"
        style={{ fontSize: "clamp(1.75rem, 1.4rem + 1.4vw, 2.25rem)" }}
        >
          {dict.sections.steps}
        </h2>

        {/*
          The connector is drawn on the marker row rather than between the columns, so it lines up
          with the numbers at every width and disappears cleanly when the grid stacks.
        */}
        <ol className="section-lead grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span className="relative flex items-center">
                <span
                  className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-fg)" }}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="ml-3 hidden h-px flex-1 bg-gradient-to-r from-border to-transparent sm:block"
                  />
                ) : null}
              </span>
              <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="text-[0.95rem] leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
