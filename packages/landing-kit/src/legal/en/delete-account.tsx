import type { LegalDocumentProps } from "../registry";
import { LegalPage, List, P, Section } from "../LegalPage";

/**
 * NOT LEGAL ADVICE. This is a starting point that covers what the app stores check for; it has
 * not been reviewed for any particular jurisdiction, business model or data flow. Have a lawyer
 * read it before you publish.
 *
 * Required by the Play Store: every app that lets users create an account must have a
 * web account-deletion page reachable without downloading the app (spec §4).
 * That is why this page has to give the email route alongside the in-app steps.
 */
export function DeleteAccount({ config, updated, locale }: LegalDocumentProps) {
  const { legal, name } = config;

  return (
    <LegalPage
      locale={locale}
      documentLocale="en"
      title="Delete your account"
      updated={updated}
      intro={
        <>
          You can permanently delete your {name} account and the data attached to it. There are two
          ways to do it, and neither requires you to keep the app installed.
        </>
      }
    >
      <Section title="Option 1 — In the app">
        <List
          items={[
            <>Open {name} and go to <strong>Settings</strong>.</>,
            <>Tap <strong>Account</strong>.</>,
            <>Tap <strong>Delete account</strong> and confirm.</>,
          ]}
        />
        <P>Deletion starts immediately and cannot be undone.</P>
      </Section>

      <Section title="Option 2 — By email">
        <P>
          If you no longer have the app installed, send a request from the email address on your
          account to <a href={`mailto:${legal.supportEmail}?subject=Delete%20my%20account`}>{legal.supportEmail}</a>{" "}
          with the subject &ldquo;Delete my account&rdquo;. We verify the request and confirm within
          3 business days.
        </P>
      </Section>

      <Section title="What gets deleted">
        <List
          items={[
            "Your account identifier and profile settings",
            "Content you created or uploaded in the app",
            "Usage history linked to your account",
          ]}
        />
      </Section>

      <Section title="What we keep, and for how long">
        <P>
          Account data is deleted or irreversibly anonymised within 30 days. We retain a minimal
          record of transactions where tax and accounting law in {legal.governingLaw} requires it,
          and aggregated analytics that can no longer be linked back to you.
        </P>
      </Section>

      {config.legal.hasSubscriptions ? (
        <Section title="Subscriptions">
          <P>
            Deleting your account does <strong>not</strong> cancel an active subscription. Cancel it
            in your Apple or Google account settings first, otherwise billing continues. See our{" "}
            <a href="/refund-policy">Refund Policy</a>.
          </P>
        </Section>
      ) : null}

      <Section title="Questions">
        <P>
          {legal.companyName}, {legal.companyAddress} —{" "}
          <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>
        </P>
      </Section>
    </LegalPage>
  );
}
