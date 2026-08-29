import type { LegalDocumentProps } from "../registry";
import { LegalPage, List, P, Section } from "../LegalPage";

/**
 * NOT LEGAL ADVICE. This is a starting point that covers what the app stores check for; it has
 * not been reviewed for any particular jurisdiction, business model or data flow. Have a lawyer
 * read it before you publish.
 */

/** The privacy policy that both Apple and Play require (spec §4). */
export function PrivacyPolicy({ config, updated, locale }: LegalDocumentProps) {
  const { legal, name } = config;

  return (
    <LegalPage
      locale={locale}
      documentLocale="en"
      title="Privacy Policy"
      updated={updated}
      intro={
        <>
          This policy explains what {name} collects, why, and the choices you have. It applies to
          the {name} mobile app and {config.domain}.
        </>
      }
    >
      <Section title="Who we are">
        <P>
          {name} is operated by {legal.companyName}, {legal.companyAddress}. For any privacy
          question, write to <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>.
        </P>
      </Section>

      <Section title="Information we collect">
        <List
          items={[
            <>
              <strong>Content you provide.</strong> Images, text, and other input you submit so the
              app can produce a result for you.
            </>,
            <>
              <strong>Device and usage data.</strong> Device model, operating system version, app
              version, language, crash reports, and in-app events used to diagnose failures and
              improve the product.
            </>,
            <>
              <strong>Advertising and attribution identifiers.</strong> Where you allow it, an
              advertising identifier and install-attribution data that tells us which campaign led
              to your install.
            </>,
            legal.hasAccounts ? (
              <>
                <strong>Account data.</strong> The email address or sign-in identifier you use to
                create an account, plus the settings attached to it.
              </>
            ) : null,
            legal.hasSubscriptions ? (
              <>
                <strong>Purchase data.</strong> Subscription status and transaction receipts.
                Payments are processed by Apple or Google — we never receive your card details.
              </>
            ) : null,
          ].filter(Boolean)}
        />
      </Section>

      <Section title="How we use it">
        <List
          items={[
            "To provide the app's core functionality and deliver the results you request.",
            "To diagnose crashes, fix defects, and measure feature performance.",
            "To measure advertising effectiveness and attribute installs to campaigns.",
            legal.hasSubscriptions ? "To manage subscriptions, renewals, and entitlements." : null,
            "To respond to your support requests.",
          ].filter(Boolean)}
        />
      </Section>

      <Section title="Advertising and analytics">
        <P>
          We work with advertising and analytics providers — which may include AppsFlyer, Meta,
          TikTok, and Google — to understand how people find {name}. On the web, none of these load
          until you accept cookies; if you decline, no third-party script is loaded at all. In the
          app, you control tracking through your device&rsquo;s privacy settings (App Tracking
          Transparency on iOS, Ads settings on Android).
        </P>
      </Section>

      <Section title="Sharing">
        <P>
          We do not sell your personal data. We share it only with service providers that process it
          on our behalf under contract (hosting, analytics, attribution, customer support), and when
          required by law or to protect our rights.
        </P>
      </Section>

      <Section title="Retention">
        <P>
          We keep data only as long as needed for the purposes above.
          {legal.hasAccounts
            ? " If you delete your account, we delete or anonymise the data associated with it within 30 days, except where law requires us to keep records longer."
            : " Diagnostic and analytics data is retained in aggregated form."}
        </P>
      </Section>

      <Section title="Your rights">
        <P>
          Depending on where you live, you may have the right to access, correct, export, or delete
          your personal data, to object to or restrict processing, and to withdraw consent. Contact{" "}
          <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a> and we will respond
          within the period required by applicable law.
          {legal.hasAccounts ? (
            <>
              {" "}
              You can also delete your account and its data at any time — see{" "}
              <a href="/delete-account">Delete account</a>.
            </>
          ) : null}
        </P>
      </Section>

      <Section title="Children">
        <P>
          {name} is not directed to children under 13 (or the minimum age in your country). We do
          not knowingly collect their data. If you believe a child has provided us data, contact us
          and we will delete it.
        </P>
      </Section>

      <Section title="International transfers">
        <P>
          Your data may be processed in countries other than your own. Where required, we rely on
          appropriate safeguards such as standard contractual clauses.
        </P>
      </Section>

      <Section title="Changes">
        <P>
          We will post any change on this page and update the date above. Material changes will be
          announced in the app.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          {legal.companyName}, {legal.companyAddress} —{" "}
          <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>
        </P>
      </Section>
    </LegalPage>
  );
}
