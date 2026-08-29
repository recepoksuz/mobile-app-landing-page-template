import type { Dictionary } from "../types";

export const en: Dictionary = {
  locale: "en",
  ogLocale: "en_US",
  label: "English",
  direction: "ltr",

  nav: {
    skipToContent: "Skip to content",
    menu: "Menu",
    main: "Main",
    mobile: "Mobile",
    home: "Home",
    privacy: "Privacy",
    terms: "Terms",
    support: "Support",
    refunds: "Refunds",
    deleteAccount: "Delete account",
    blog: "Blog",
  },

  cta: {
    iosTop: "Download on the",
    ios: "App Store",
    androidTop: "Get it on",
    android: "Google Play",
    generic: "Get the app",
    closingHeading: "Get {name}",
    closingBody: "Free to start, on iPhone and Android.",
    scanToDownload: "Scan to download",
  },

  socialProof: {
    regionLabel: "Ratings and downloads",
    storeRating: "App Store rating",
    reviews: "reviews",
    downloads: "downloads",
  },

  sections: {
    features: "Everything you need",
    steps: "How it works",
    faq: "Frequently asked questions",
  },

  footer: {
    legal: "Legal",
    follow: "Follow",
    contact: "Contact",
    social: "Social",
    copyright: "© {year} {company}. All rights reserved.",
  },

  consent: {
    title: "Analytics & advertising cookies",
    body: "Used to measure ad performance. Decline and nothing third-party loads.",
    privacyLink: "Privacy Policy",
    accept: "Accept",
    decline: "Decline",
  },

  go: {
    heading: "Scan to get {name}",
    body: "Point your phone’s camera at the code below and the App Store or Google Play will open with the app ready to install.",
    openOnPhone: "Or open {url} on your phone.",
    qrAlt: "Scan to download",
  },

  unavailable: {
    heading: "{name} isn’t on {platform} yet",
    body: "It’s available on {platforms}. Open this link there and it will take you straight to the store.",
    bodyNone: "It isn’t available for download right now.",
    tellUs: "Let us know you want it on {platform}",
    ios: "iPhone",
    android: "Android",
    desktop: "this device",
    iosFamily: "iPhone and iPad",
    androidFamily: "Android",
  },

  legal: {
    lastUpdated: "Last updated {date}",
    englishOnlyNotice: "This document is currently available in English only.",
  },

  blog: {
    heading: "Blog",
    empty: "No posts yet.",
  },

  notFound: {
    code: "404",
    heading: "Page not found",
    body: "The page you are looking for does not exist or is not available for this app.",
    goHome: "Go home",
  },
};
