import type { Dictionary } from "../types";

export const tr: Dictionary = {
  locale: "tr",
  ogLocale: "tr_TR",
  label: "Türkçe",
  direction: "ltr",

  nav: {
    skipToContent: "İçeriğe geç",
    menu: "Menü",
    main: "Ana menü",
    mobile: "Mobil menü",
    home: "Ana sayfa",
    privacy: "Gizlilik",
    terms: "Koşullar",
    support: "Destek",
    refunds: "İadeler",
    deleteAccount: "Hesap silme",
    blog: "Blog",
  },

  cta: {
    iosTop: "İndir:",
    ios: "App Store",
    androidTop: "İndir:",
    android: "Google Play",
    generic: "Uygulamayı indir",
    closingHeading: "{name} uygulamasını edinin",
    closingBody: "Başlaması ücretsiz, iPhone ve Android'de.",
    scanToDownload: "İndirmek için okutun",
  },

  socialProof: {
    regionLabel: "Puan ve indirme sayıları",
    storeRating: "App Store puanı",
    reviews: "değerlendirme",
    downloads: "indirme",
  },

  sections: {
    features: "İhtiyacınız olan her şey",
    steps: "Nasıl çalışır",
    faq: "Sık sorulan sorular",
  },

  footer: {
    legal: "Yasal",
    follow: "Takip edin",
    contact: "İletişim",
    social: "Sosyal medya",
    copyright: "© {year} {company}. Tüm hakları saklıdır.",
  },

  consent: {
    title: "Analitik ve reklam çerezleri",
    body: "Reklam performansını ölçmek için. Reddederseniz hiçbir üçüncü taraf betiği yüklenmez.",
    privacyLink: "Gizlilik Politikası",
    accept: "Kabul et",
    decline: "Reddet",
  },

  go: {
    heading: "{name} için kodu okutun",
    body: "Telefonunuzun kamerasını aşağıdaki koda tutun; App Store veya Google Play uygulama kurulmaya hazır şekilde açılacak.",
    openOnPhone: "Ya da {url} adresini telefonunuzda açın.",
    qrAlt: "İndirmek için okutun",
  },

  unavailable: {
    heading: "{name} henüz {platform} için yok",
    body: "Şu an {platforms} üzerinde mevcut. Bu bağlantıyı orada açtığınızda doğrudan mağazaya gider.",
    bodyNone: "Şu anda indirilemiyor.",
    tellUs: "{platform} için de istediğinizi bize bildirin",
    ios: "iPhone",
    android: "Android",
    desktop: "bu cihaz",
    iosFamily: "iPhone ve iPad",
    androidFamily: "Android",
  },

  legal: {
    lastUpdated: "Son güncelleme: {date}",
    englishOnlyNotice: "Bu belge şu anda yalnızca İngilizce olarak sunulmaktadır.",
  },

  blog: {
    heading: "Blog",
    empty: "Henüz yazı yok.",
  },

  notFound: {
    code: "404",
    heading: "Sayfa bulunamadı",
    body: "Aradığınız sayfa mevcut değil ya da bu uygulama için sunulmuyor.",
    goHome: "Ana sayfaya dön",
  },
};
