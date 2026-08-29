import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata, hasRoute, localesOf } from "@landing/kit";
import { getPost, listPosts, localesWithPost } from "@landing/kit/blog";
import { getTenant, getTenantLocale, type RouteParams } from "@/lib/tenant";

type PageProps = { params: Promise<RouteParams & { slug: string }> };

/**
 * Posts are Markdown files in the repo, so there is nothing request-time about them. Rendering
 * them statically also puts their metadata in the initial HTML instead of a streamed chunk,
 * which is what a crawler that does not execute JavaScript reads.
 */
export async function generateStaticParams({ params }: { params: RouteParams }) {
  const config = getTenant();
  if (!config.features.blog) return [];

  const posts = await listPosts(config.slug, params.locale);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { config, locale } = await getTenantLocale(params);
  const { slug } = await params;
  const post = await getPost(config.slug, locale, slug);

  if (!post) return buildMetadata(config, { path: "/blog", locale, noIndex: true });

  return buildMetadata(config, {
    path: `/blog/${post.slug}`,
    locale,
    // Only claim the languages this post is actually written in.
    availableLocales: await localesWithPost(config.slug, localesOf(config), slug),
    title: `${post.title} — ${config.name}`,
    description: post.excerpt,
  });
}

export default async function Page({ params }: PageProps) {
  const { config, locale } = await getTenantLocale(params);
  if (!hasRoute(config, "/blog")) notFound();

  const { slug } = await params;
  const post = await getPost(config.slug, locale, slug);
  if (!post) notFound();

  return (
    <main className="site-container py-16 md:py-24">
      <article className="mx-auto w-full max-w-[68ch]">
        <time dateTime={post.date} className="text-sm text-muted">
          {new Date(post.date).toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
          })}
        </time>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          {post.title}
        </h1>
        {/* The body is Markdown authored in this repo, not user input. */}
        <div
          className="legal-prose mt-10 flex flex-col gap-4"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>
    </main>
  );
}
