import Image from "next/image";
import type { AppConfig } from "../config/schema";
import { getDictionary } from "../i18n/resolve";
import type { Locale } from "../i18n/types";

/** Image-led feature cards. If `content.features` is empty the block is never rendered. */
export function Features({
  config,
  locale,
  features,
}: {
  config: AppConfig;
  locale: Locale;
  features: AppConfig["content"]["features"];
}) {
  const dict = getDictionary(locale);
  if (features.length === 0) return null;

  return (
    <section aria-labelledby="features-heading" className="site-container section-y">
      <h2
        id="features-heading"
        className="display-gradient max-w-2xl font-semibold tracking-tight text-balance"
        style={{ fontSize: "clamp(1.75rem, 1.4rem + 1.4vw, 2.25rem)" }}
      >
        {dict.sections.features}
      </h2>

      <ul className="section-lead grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <li
            key={feature.title}
            className="flex flex-col overflow-hidden rounded-card border border-border bg-surface"
          >
            {feature.image ? (
              <Image
                src={feature.image}
                alt=""
                width={640}
                height={420}
                className="aspect-[640/420] w-full object-cover"
                sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
              />
            ) : null}
            <div className="flex flex-col gap-2 p-6">
              <h3 className="text-lg font-semibold tracking-tight">{feature.title}</h3>
              <p className="text-[0.95rem] leading-relaxed text-muted">{feature.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
