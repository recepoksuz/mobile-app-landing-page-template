import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata, getDictionary, hasRoute } from "@landing/kit";
import { listPosts } from "@landing/kit/blog";
import { getTenantLocale, type RouteParams } from "@/lib/tenant";

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { config, locale } = await getTenantLocale(params);
  return buildMetadata(config, {
    path: "/blog",
    locale,
    title: `${getDictionary(locale).blog.heading} — ${config.name}`,
    description: `Guides, updates, and tips from the ${config.name} team.`,
  });
}

/**
 * The blog is off by default (spec §11). `features.blog = true` opens these routes; the
 * sitemap is already generated per host and per locale, so there is no extra work (spec §10).
 */
export default async function Page({ params }: { params: Promise<RouteParams> }) {
  const { config, locale, basePath } = await getTenantLocale(params);
  if (!hasRoute(config, "/blog")) notFound();

  const dict = getDictionary(locale);
  const posts = await listPosts(config.slug, locale);

  return (
    <main className="site-container py-16 md:py-24">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{dict.blog.heading}</h1>

      {posts.length === 0 ? (
        <p className="mt-8 text-muted">{dict.blog.empty}</p>
      ) : (
        <ul className="mt-12 flex max-w-3xl flex-col divide-y divide-border border-y border-border">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`${basePath}/blog/${post.slug}`} className="flex flex-col gap-2 py-6">
                <time dateTime={post.date} className="text-sm text-muted">
                  {new Date(post.date).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </time>
                <h2 className="text-xl font-semibold tracking-tight">{post.title}</h2>
                <p className="text-[0.95rem] leading-relaxed text-muted">{post.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
