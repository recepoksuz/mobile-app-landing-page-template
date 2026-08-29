import type { LegalDocumentProps } from "../registry";
import { LegalPage, List, P, Section } from "../LegalPage";

/**
 * NOT LEGAL ADVICE. This is a starting point that covers what the app stores check for; it has
 * not been reviewed for any particular jurisdiction, business model or data flow. Have a lawyer
 * read it before you publish.
 */

/** Generated for tenants with `hasSubscriptions: true` (spec §4). */
export function RefundPolicy({ config, updated, locale }: LegalDocumentProps) {
  const { legal, name } = config;
  const hasIos = Boolean(config.store.ios);
  const hasAndroid = Boolean(config.store.android);

  return (
    <LegalPage
      locale={locale}
      documentLocale="en"
      title="Refund Policy"
      updated={updated}
      intro={
        <>
          All {name} purchases are processed by the app store you bought from, so refunds are issued
          by them — not by us directly. Here is how to request one.
        </>
      }
    >
      {hasIos ? (
        <Section title="Purchases made on iOS (Apple)">
          <P>
            Apple handles all App Store refunds. Go to{" "}
            <a href="https://reportaproblem.apple.com" rel="noopener noreferrer" target="_blank">
              reportaproblem.apple.com
            </a>
            , sign in with your Apple ID, choose the {name} purchase, and select a reason. Apple
            typically responds within 48 hours.
          </P>
        </Section>
      ) : null}

      {hasAndroid ? (
        <Section title="Purchases made on Android (Google Play)">
          <P>
            Google handles all Play Store refunds. Open{" "}
            <a href="https://play.google.com/store/account" rel="noopener noreferrer" target="_blank">
              your Google Play account
            </a>
            , find the {name} order, and choose &ldquo;Request a refund&rdquo;. Purchases made in the
            last 48 hours are usually refunded automatically.
          </P>
        </Section>
      ) : null}

      <Section title="Cancelling a subscription">
        <P>
          Cancelling stops future charges but does not refund the current period — you keep access
          until the end of the period you paid for. Manage subscriptions in your device settings.
          Deleting the app does not cancel a subscription.
        </P>
      </Section>

      <Section title="When we will help">
        <P>
          If the store declines your request and you believe something went wrong on our side, write
          to <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a> with:
        </P>
        <List
          items={[
            "The email address or account you purchased with",
            "The store receipt or order number",
            "The date of purchase and what went wrong",
          ]}
        />
        <P>
          We reply within 3 business days and will advocate with the store on your behalf where the
          fault is ours.
        </P>
      </Section>

      <Section title="Statutory rights">
        <P>
          Nothing here limits the refund or withdrawal rights you have under the consumer law of{" "}
          {legal.governingLaw} or of your country of residence.
        </P>
      </Section>
    </LegalPage>
  );
}
