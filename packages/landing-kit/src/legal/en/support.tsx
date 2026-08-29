import type { LegalDocumentProps } from "../registry";
import { LegalPage, List, P, Section } from "../LegalPage";

/**
 * NOT LEGAL ADVICE. This is a starting point that covers what the app stores check for; it has
 * not been reviewed for any particular jurisdiction, business model or data flow. Have a lawyer
 * read it before you publish.
 */

/** The target of the support URL that Apple requires (spec §4). */
export function SupportPage({ config, updated, locale }: LegalDocumentProps) {
  const { legal, name } = config;

  return (
    <LegalPage
      locale={locale}
      documentLocale="en"
      title="Support"
      updated={updated}
      intro={
        <>
          Something not working, or a question about {name}? Write to us and a person will answer.
        </>
      }
    >
      <Section title="Contact us">
        <P>
          Email <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>. We reply within 3
          business days.
        </P>
        <P>To get an answer on the first reply, please include:</P>
        <List
          items={[
            "Your device model and OS version (e.g. iPhone 15, iOS 18.2)",
            `The ${name} app version, shown in Settings`,
            "What you expected to happen and what happened instead",
            "A screenshot or screen recording, if you can",
          ]}
        />
      </Section>

      {config.content.faq.length > 0 ? (
        <Section title="Before you write">
          <P>
            Many questions are already answered in the FAQ on our <a href="/">home page</a>.
          </P>
        </Section>
      ) : null}

      {legal.hasSubscriptions ? (
        <Section title="Billing and subscriptions">
          <P>
            Subscriptions are managed by Apple and Google. To cancel or request a refund, see our{" "}
            <a href="/refund-policy">Refund Policy</a>.
          </P>
        </Section>
      ) : null}

      {legal.hasAccounts ? (
        <Section title="Account and privacy">
          <P>
            To delete your account and its data, see <a href="/delete-account">Delete account</a>.
            To understand what we collect, see our <a href="/privacy">Privacy Policy</a>.
          </P>
        </Section>
      ) : null}

      <Section title="Company">
        <P>
          {legal.companyName}
          <br />
          {legal.companyAddress}
        </P>
      </Section>
    </LegalPage>
  );
}
