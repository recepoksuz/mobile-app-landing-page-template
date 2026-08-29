/** A BCP-47 language tag, e.g. "en", "tr", "pt-BR". */
export type Locale = string;

/**
 * Every piece of chrome text the kit renders.
 *
 * Only short interface strings live here. Long-form legal prose does not: it belongs in
 * reviewable `.tsx` documents under `legal/{locale}/`, because a privacy policy assembled
 * from interpolated dictionary fragments is impossible for a lawyer to read and sign off.
 */
export type Dictionary = {
  /** BCP-47 tag this dictionary is written in. */
  locale: Locale;
  /** Value for `og:locale`, e.g. "en_US". */
  ogLocale: string;
  /** Human-readable name, used in the language switcher. */
  label: string;
  /** "rtl" flips the document direction. */
  direction: "ltr" | "rtl";

  nav: {
    skipToContent: string;
    menu: string;
    main: string;
    mobile: string;
    home: string;
    privacy: string;
    terms: string;
    support: string;
    refunds: string;
    deleteAccount: string;
    blog: string;
  };

  cta: {
    /** Small line above the store name on the badge, e.g. "Download on the". */
    iosTop: string;
    ios: string;
    androidTop: string;
    android: string;
    generic: string;
    /** `{name}` is replaced with the app name. */
    closingHeading: string;
    closingBody: string;
    scanToDownload: string;
  };

  socialProof: {
    /** Landmark label for the ratings strip. */
    regionLabel: string;
    storeRating: string;
    reviews: string;
    downloads: string;
  };

  sections: {
    features: string;
    steps: string;
    faq: string;
  };

  footer: {
    legal: string;
    follow: string;
    contact: string;
    social: string;
    /** `{year}` and `{company}` are replaced. */
    copyright: string;
  };

  consent: {
    title: string;
    body: string;
    privacyLink: string;
    accept: string;
    decline: string;
  };

  go: {
    /** `{name}` is replaced. */
    heading: string;
    body: string;
    /** `{url}` is replaced. */
    openOnPhone: string;
    qrAlt: string;
  };

  unavailable: {
    /** `{name}` and `{platform}` are replaced. */
    heading: string;
    /** `{platforms}` is replaced. */
    body: string;
    bodyNone: string;
    /** `{platform}` is replaced. */
    tellUs: string;
    ios: string;
    android: string;
    desktop: string;
    iosFamily: string;
    androidFamily: string;
  };

  legal: {
    /** `{date}` is replaced. */
    lastUpdated: string;
    /** Shown when this locale has no translation of the document. */
    englishOnlyNotice: string;
  };

  blog: {
    heading: string;
    empty: string;
  };

  notFound: {
    code: string;
    heading: string;
    body: string;
    goHome: string;
  };
};
