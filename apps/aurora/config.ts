import { defineAppConfig } from "@landing/kit";

/**
 * PLACEHOLDER DATA. What has to be changed before going live:
 * store.ios.appId + url, store.android.packageName + url + sha256Fingerprints,
 * store.ios.teamId + bundleId (Universal Links), attribution.* and the public/apps/aurora/ images.
 *
 * DELIBERATE DUPLICATE: `apps/multi/config/aurora.ts` and `apps/aurora/config.ts` both exist so
 * the repo can demonstrate a shared tenant and a graduated one side by side. A real graduation
 * deletes the `apps/multi` copy (graduation.md, step 4). Until then the two must stay in step on
 * everything that identifies the app — domain, name, store, legal — and
 * `apps/aurora/e2e/parity.spec.ts` fails if they drift.
 */
export const config = defineAppConfig({
  slug: "aurora",
  domain: "aurora.example",
  name: "Aurora",
  tagline: "Your day, written in a minute",
  description:
    "A journal that fits in the gaps: one prompt a day, a photo if you want one, and a private archive that gets more useful the longer you keep it.",

  theme: { accent: "#f63a80", mode: "dark" },

  assets: {
    icon: "/apps/aurora/icon.svg",
    logo: "/apps/aurora/logo.svg",
    mockup: "/apps/aurora/mockup.svg",
  },

  store: {
    ios: {
      appId: "1111111111",
      url: "https://apps.apple.com/app/id1111111111",
      teamId: "ABCDE12345",
      bundleId: "com.example.aurora",
    },
    android: {
      packageName: "com.example.aurora",
      url: "https://play.google.com/store/apps/details?id=com.example.aurora",
      sha256Fingerprints: [
        "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99",
      ],
    },
    // Pinned so the demo is deterministic. Drop both and they are looked up instead.
    rating: 4.7,
    reviewCount: 12400,
    downloads: "2M+",
    autoFetch: false,
  },

  attribution: {
    oneLink: "https://aurora.onelink.me/abcd",
    metaPixelId: "000000000000000",
    tiktokPixelId: "CABCDE1234500",
  },

  content: {
    features: [
      {
        title: "One prompt a day",
        body: "A single question each morning, drawn from what you have written before. No blank page to stare at.",
        image: "/apps/aurora/feature-prompt.svg",
      },
      {
        title: "Private by default",
        body: "Entries are encrypted on your device. There is no feed, no followers and nothing to publish.",
        image: "/apps/aurora/feature-private.svg",
      },
      {
        title: "Search everything",
        body: "Find any entry by word, place or date — including the photos and locations attached to it.",
        image: "/apps/aurora/feature-search.svg",
      },
    ],
    steps: [
      { title: "Answer the prompt", body: "Two sentences is enough. It never asks for more than a minute." },
      { title: "Add what you have", body: "A photo, a place, a mood. All optional, all searchable later." },
      { title: "Look back", body: "On this day last month, last year — the archive resurfaces entries on its own." },
    ],
    faq: [
      {
        q: "Do I need to pay to use it?",
        a: "No. Daily entries are free forever. A subscription adds unlimited photos, backup and export.",
      },
      {
        q: "Are my entries private?",
        a: "Entries are encrypted on your device and never leave it unless you turn on backup, which is off by default.",
      },
      {
        q: "Can I get my journal out again?",
        a: "Yes, at any time, as plain text or PDF with your photos included. Your writing is not locked in.",
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes, any time from your Apple or Google account settings. You keep access until the end of the period you paid for.",
      },
    ],
  },

  // Turkish marketing copy. The legal documents are not translated, so `/tr/privacy` serves the
  // English text with a notice and no `hreflang="tr"` is claimed for it.
  i18n: {
    defaultLocale: "en",
    locales: {
      tr: {
        tagline: "Günün, bir dakikada yazılmış",
        description:
          "Aralara sığan bir günlük: günde tek soru, istersen bir fotoğraf ve tuttukça daha çok işe yarayan özel bir arşiv.",
        content: {
          features: [
            {
              title: "Günde tek soru",
              body: "Her sabah, daha önce yazdıklarından çıkan tek bir soru. Boş sayfaya bakmak yok.",
              image: "/apps/aurora/feature-prompt.svg",
            },
            {
              title: "Varsayılan olarak özel",
              body: "Kayıtlar cihazında şifrelenir. Akış yok, takipçi yok, yayınlanacak bir şey yok.",
              image: "/apps/aurora/feature-private.svg",
            },
            {
              title: "Her şeyi ara",
              body: "Kelimeye, yere ya da tarihe göre bul — eklediğin fotoğraflar ve konumlar dahil.",
              image: "/apps/aurora/feature-search.svg",
            },
          ],
          steps: [
            { title: "Soruyu yanıtla", body: "İki cümle yeter. Senden bir dakikadan fazlasını hiç istemez." },
            { title: "Elindekini ekle", body: "Fotoğraf, konum, ruh hali. Hepsi isteğe bağlı, hepsi sonradan aranabilir." },
            { title: "Geriye bak", body: "Geçen ay bugün, geçen yıl bugün — arşiv kayıtları kendiliğinden önüne getirir." },
          ],
          faq: [
            {
              q: "Kullanmak için ödeme yapmam gerekiyor mu?",
              a: "Hayır. Günlük kayıtlar her zaman ücretsiz. Abonelik sınırsız fotoğraf, yedekleme ve dışa aktarma ekler.",
            },
            {
              q: "Kayıtlarım gizli mi kalıyor?",
              a: "Kayıtlar cihazında şifrelenir ve varsayılan olarak kapalı olan yedeklemeyi açmadıkça cihazından çıkmaz.",
            },
            {
              q: "Günlüğümü geri alabilir miyim?",
              a: "Evet, istediğin an düz metin ya da PDF olarak, fotoğraflarınla birlikte. Yazdıkların kilitli kalmaz.",
            },
            {
              q: "Aboneliğimi iptal edebilir miyim?",
              a: "Evet, Apple veya Google hesap ayarlarından istediğin an. Ödediğin dönemin sonuna kadar erişimin sürer.",
            },
          ],
        },
      },
    },
  },

  legal: {
    companyName: "Example Labs Ltd",
    companyUrl: "https://example.com",
    companyAddress: "9 Example Street, London EC1A 1BB",
    supportEmail: "support@aurora.example",
    governingLaw: "England and Wales",
    hasAccounts: true,
    hasSubscriptions: true,
  },


  // Most promo links need no entry here at all: `/go/influencer/alice` already reports as its
  // own media source, so a new creator is a URL someone types rather than a deploy. Register a
  // link only to override what its path says — a renamed campaign, or a creative code that
  // would be noise in the URL.
  campaigns: {
    "podcast/inkfluencer": { campaign: "podcast_ep_42", ad: "midroll" },
  },

  // Fictional handles: the template ships examples, not anyone's real accounts.
  social: {
    instagram: "https://instagram.com/example",
    twitter: "https://x.com/example",
    tiktok: "https://tiktok.com/@example",
  },

  features: { blog: true, desktopQr: false },

  // Short, memorable aliases for the attribution route. `aurora.example/download` is easier to
  // say on a podcast or print on a flyer than `/go/download`, and it keeps every share going
  // through one place we can retarget without reissuing the link.
  redirects: [
    { from: "/download", to: "/go/download", permanent: false },
    { from: "/get", to: "/go/download", permanent: false },
  ],
});
