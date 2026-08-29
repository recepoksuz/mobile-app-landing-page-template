import type { LegalDocumentProps } from "../registry";
import { LegalPage, List, P, Section } from "../LegalPage";

/**
 * NOT LEGAL ADVICE. This is a starting point that covers what the app stores check for; it has
 * not been reviewed for any particular jurisdiction, business model or data flow. Have a lawyer
 * read it before you publish.
 *
 * Apple requires a EULA when there are subscriptions (spec §4). The `hasSubscriptions`
 * flag turns on the subscription, auto-renewal, and cancellation sections.
 */
export function TermsOfService({ config, updated, locale }: LegalDocumentProps) {
  const { legal, name } = config;

  return (
    <LegalPage
      locale={locale}
      documentLocale="en"
      title="Terms of Service"
      updated={updated}
      intro={
        <>
          These terms are the agreement between you and {legal.companyName} for the use of {name}.
          By downloading or using the app you accept them.
        </>
      }
    >
      <Section title="Licence">
        <P>
          We grant you a personal, non-exclusive, non-transferable, revocable licence to use {name}{" "}
          on devices you own or control, for personal, non-commercial purposes, in accordance with
          the usage rules of the app store you downloaded it from.
        </P>
      </Section>

      <Section title="Acceptable use">
        <P>You agree not to:</P>
        <List
          items={[
            "Use the app for anything unlawful, or to produce content that is illegal, hateful, harassing, or infringing.",
            "Upload content you do not have the rights to use.",
            "Reverse engineer, decompile, or attempt to extract the source code of the app.",
            "Interfere with the service, circumvent limits, or access it through automated means.",
            "Resell, sublicense, or commercially exploit the app or its output without our written permission.",
          ]}
        />
      </Section>

      <Section title="Your content">
        <P>
          You keep ownership of everything you submit. You grant us the limited licence needed to
          process it and deliver the result back to you. We do not claim ownership of your output.
        </P>
      </Section>

      {legal.hasSubscriptions ? (
        <>
          <Section title="Subscriptions and billing">
            <List
              items={[
                "Payment is charged to your Apple ID or Google account at confirmation of purchase.",
                "Subscriptions renew automatically unless auto-renew is turned off at least 24 hours before the end of the current period.",
                "Your account is charged for renewal within 24 hours prior to the end of the current period, at the rate of your selected plan.",
                "You can manage and cancel subscriptions in your device's account settings after purchase. Deleting the app does not cancel a subscription.",
                "Any unused portion of a free trial is forfeited when you purchase a subscription.",
              ]}
            />
          </Section>

          <Section title="Refunds">
            <P>
              Purchases are processed by Apple and Google, and refunds are handled under their
              policies. See our <a href="/refund-policy">Refund Policy</a> for details and for how
              to reach us if something went wrong.
            </P>
          </Section>
        </>
      ) : null}

      {legal.hasAccounts ? (
        <Section title="Accounts">
          <P>
            You are responsible for keeping your credentials secure and for activity under your
            account. You may delete your account at any time — see{" "}
            <a href="/delete-account">Delete account</a>. We may suspend or terminate accounts that
            breach these terms.
          </P>
        </Section>
      ) : null}

      <Section title="Disclaimers">
        <P>
          The app is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties
          of any kind, to the fullest extent permitted by law. We do not warrant that the app will
          be uninterrupted, error-free, or that its output will meet your expectations.
        </P>
      </Section>

      <Section title="Limitation of liability">
        <P>
          To the maximum extent permitted by law, {legal.companyName} is not liable for indirect,
          incidental, special, or consequential damages. Our total liability for any claim relating
          to the app is limited to the amount you paid us in the twelve months before the claim.
        </P>
      </Section>

      <Section title="Third-party stores">
        <P>
          Apple and Google are not parties to these terms and have no obligation to provide support
          for the app. They are third-party beneficiaries of these terms and may enforce them
          against you.
        </P>
      </Section>

      <Section title="Governing law">
        <P>
          These terms are governed by the laws of {legal.governingLaw}, without regard to conflict
          of law rules. Mandatory consumer protections in your country of residence still apply.
        </P>
      </Section>

      <Section title="Changes">
        <P>
          We may update these terms; the date above reflects the latest version. Continued use after
          a change means you accept it.
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
