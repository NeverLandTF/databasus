import type { Metadata } from "next";
import DocsNavbarComponent from "../components/DocsNavbarComponent";
import DocsSidebarComponent from "../components/DocsSidebarComponent";
import DocTableOfContentComponent from "../components/DocTableOfContentComponent";

export const metadata: Metadata = {
  title: "Privacy Policy (Cloud) - Databasus",
  description:
    "Privacy policy for Databasus Cloud. Learn how we handle your data, what we collect, how we protect it and your rights under GDPR.",
  alternates: {
    canonical: "https://databasus.com/privacy-cloud",
  },
  robots: "noindex",
};

export default function PrivacyCloudPage() {
  return (
    <>
      <DocsNavbarComponent />

      <div className="flex min-h-screen bg-[#0F1115]">
        <DocsSidebarComponent />

        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <article className="prose prose-blue max-w-none">
              <h1 id="privacy-policy">Privacy Policy — Databasus Cloud</h1>

              <p className="text-lg text-gray-400">
                Last updated: March 9, 2026
              </p>

              <p>
                This privacy policy explains how Databasus Cloud
                (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses
                and protects your information when you use the Databasus Cloud
                service at{" "}
                <a
                  href="https://app.databasus.com"
                  className="text-blue-500 hover:text-blue-600"
                >
                  app.databasus.com
                </a>
                .
              </p>

              <p>
                Databasus Cloud is operated by Individual Entrepreneur Rostyslav
                Duhin (Identification Number: 347010209), registered in Georgia.
                For the privacy policy of the self-hosted version and the
                marketing website, see the{" "}
                <a
                  href="/privacy"
                  className="text-blue-500 hover:text-blue-600"
                >
                  website privacy policy
                </a>
                .
              </p>

              {/* ───── LEGAL BASIS ───── */}
              <h2 id="legal-basis">Legal basis for processing</h2>

              <p>
                We process your personal data on the following legal grounds
                under GDPR:
              </p>

              <ul>
                <li>
                  <strong>Contract performance</strong> (Article 6(1)(b)) — to
                  provide the Databasus Cloud service you signed up for,
                  including performing backups, managing your account and
                  sending transactional notifications
                </li>
                <li>
                  <strong>Legitimate interest</strong> (Article 6(1)(f)) — to
                  improve the service, ensure security and prevent abuse
                </li>
                <li>
                  <strong>Legal obligation</strong> (Article 6(1)(c)) — to
                  comply with applicable laws and regulations
                </li>
              </ul>

              {/* ───── DATA WE COLLECT ───── */}
              <h2 id="data-we-collect">Data we collect</h2>

              <h3 id="account-data">Account data</h3>

              <p>
                When you create an account we collect the following information:
              </p>

              <ul>
                <li>
                  <strong>Name</strong> — to identify you in the dashboard and
                  for communication
                </li>
                <li>
                  <strong>Email address</strong> — used for authentication,
                  transactional notifications (backup status, account-related
                  updates) and support
                </li>
                <li>
                  <strong>Password</strong> — if you register with
                  email/password, your password is securely hashed and never
                  stored in plain text
                </li>
              </ul>

              <p>
                You may also sign up or log in via third-party OAuth providers
                (GitHub, Google). In that case, we receive only your name and
                email from the provider. We do not access any other data from
                your GitHub or Google account.
              </p>

              <h3 id="database-credentials">Database credentials</h3>

              <p>
                To perform backups, you provide connection details for your
                databases (host, port, database name, username, password). All
                credentials are encrypted. We access your database only to
                perform backups via standard dump tools (pg_dump, mysqldump,
                mongodump) with the minimum permissions required by each tool.
                We do not manually inspect your database content — access is
                limited to automated backup operations.
              </p>

              <h3 id="backup-data">Backup data</h3>

              <p>
                Backup archives are stored in S3-compatible storage in the EU
                and USA.
                Each backup file is encrypted with a unique key derived from a
                master key, backup ID and random salt. We do not access the
                contents of your backups unless required by law or with your
                explicit consent for support purposes.
              </p>

              <h3 id="audit-logs">Audit logs</h3>

              <p>
                Databasus Cloud records audit logs of actions performed within
                your organization (backup downloads, schedule changes,
                configuration updates, user access, etc.). These logs are stored on
                our servers. Users within your organization can view them
                through the dashboard. We may access audit logs for support and
                debugging purposes.
              </p>

              <h3 id="analytics">Website analytics</h3>

              <p>
                We use{" "}
                <a
                  href="https://rybbit.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  Rybbit.io
                </a>{" "}
                for anonymous, privacy-compliant website analytics. Rybbit does
                not use cookies, does not collect IP addresses and does not
                track users across websites. Only aggregated, anonymous data is
                collected (page views, referral sources, browser type, country).
                No personal data is processed. For full details, see our{" "}
                <a
                  href="/privacy"
                  className="text-blue-500 hover:text-blue-600"
                >
                  website privacy policy
                </a>
                .
              </p>

              <h3 id="bot-protection">Bot protection</h3>

              <p>
                We use Cloudflare Turnstile to protect sign-up and login forms
                from automated abuse. Turnstile may process technical signals
                (such as IP address and browser metadata) to distinguish humans
                from bots. It does not use tracking cookies. For details, see{" "}
                <a
                  href="https://www.cloudflare.com/turnstile-privacy-policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  Cloudflare&apos;s Turnstile privacy policy
                </a>
                .
              </p>

              {/* ───── HOW WE USE YOUR DATA ───── */}
              <h2 id="how-we-use-data">How we use your data</h2>

              <p>We use the data we collect to:</p>

              <ul>
                <li>
                  Provide, operate and maintain the Databasus Cloud service
                </li>
                <li>
                  Authenticate your account and manage access within your
                  organization
                </li>
                <li>
                  Perform scheduled database backups and send transactional
                  notifications (backup success/failure, account updates)
                </li>
                <li>Provide customer support</li>
                <li>
                  Improve the service based on anonymous, aggregated usage data
                </li>
              </ul>

              <p>
                We do <strong>not</strong> send marketing emails. All
                communications are transactional and directly related to the
                service.
              </p>

              {/* ───── DATA STORAGE ───── */}
              <h2 id="data-storage">Data storage and security</h2>

              <p>
                All data is stored on servers located in the European Union and
                the United States. We employ industry-standard security measures
                including:
              </p>

              <ul>
                <li>
                  AES-256-GCM encryption for all sensitive data (credentials,
                  tokens, secrets)
                </li>
                <li>
                  Per-backup encryption with unique keys derived from a master
                  key, backup ID and random salt
                </li>
                <li>Hashed passwords (never stored in plain text)</li>
                <li>
                  Minimal database permissions — Databasus requests only the
                  permissions required by the underlying dump tools for each
                  database engine
                </li>
              </ul>

              {/* ───── INTERNATIONAL TRANSFERS ───── */}
              <h2 id="international-transfers">International data transfers</h2>

              <p>
                Our infrastructure is located in the European Union and the
                United States. If your data is transferred outside the European
                Economic Area, we ensure appropriate safeguards are in place in
                accordance with GDPR Chapter V, including the use of service
                providers that adhere to recognized data protection frameworks.
              </p>

              {/* ───── DATA SHARING ───── */}
              <h2 id="data-sharing">Data sharing</h2>

              <p>
                We do not sell, trade or rent your personal data to third
                parties. We share data only with service providers necessary to
                operate Databasus Cloud (infrastructure, payment processing,
                email delivery). These providers process data solely on our
                behalf and under our instructions.
              </p>

              <p>
                We may disclose your data if required to do so by law, court
                order, or governmental request, or if we believe in good faith
                that disclosure is necessary to protect our rights, your safety
                or the safety of others.
              </p>

              {/* ───── DATA RETENTION ───── */}
              <h2 id="data-retention">Data retention and deletion</h2>

              <p>
                We retain your data for as long as your account is active and as
                needed to provide the service.
              </p>

              <ul>
                <li>
                  You can delete your databases, backups and associated data at
                  any time through the dashboard
                </li>
                <li>
                  To delete your entire account, contact us at{" "}
                  <a
                    href="mailto:info@databasus.com"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    info@databasus.com
                  </a>
                </li>
                <li>
                  Upon account deletion, all your data — including account
                  information, database credentials, backups and audit logs — is
                  deleted as soon as reasonably practicable, typically within 30
                  days. Some data may be retained longer only if required by
                  applicable law
                </li>
              </ul>

              {/* ───── COOKIES ───── */}
              <h2 id="cookies">Cookies</h2>

              <p>
                Databasus Cloud uses only essential cookies required for
                authentication and session management. We do not use
                advertising, marketing or third-party tracking cookies.
                Rybbit.io analytics operates without cookies. Cloudflare
                Turnstile does not set tracking cookies.
              </p>

              {/* ───── YOUR RIGHTS ───── */}
              <h2 id="your-rights">Your rights</h2>

              <p>
                Under the GDPR and other applicable privacy regulations, you
                have the right to:
              </p>

              <ul>
                <li>
                  <strong>Access</strong> — request a copy of the personal data
                  we hold about you
                </li>
                <li>
                  <strong>Rectification</strong> — request correction of
                  inaccurate personal data
                </li>
                <li>
                  <strong>Erasure</strong> — request deletion of your personal
                  data
                </li>
                <li>
                  <strong>Data portability</strong> — request your data in a
                  portable format
                </li>
                <li>
                  <strong>Objection</strong> — object to processing of your
                  personal data
                </li>
                <li>
                  <strong>Restriction</strong> — request restriction of
                  processing
                </li>
              </ul>

              <p>
                You also have the right to lodge a complaint with a data
                protection supervisory authority in your country of residence.
              </p>

              <p>
                To exercise any of these rights, contact us at{" "}
                <a
                  href="mailto:info@databasus.com"
                  className="text-blue-500 hover:text-blue-600"
                >
                  info@databasus.com
                </a>
                . We will respond within 30 days.
              </p>

              {/* ───── DATA BREACH ───── */}
              <h2 id="data-breach">Data breach notification</h2>

              <p>
                In the event of a personal data breach that is likely to result
                in a risk to your rights, we will notify affected users via
                email without undue delay and no later than 72 hours after
                becoming aware of the breach, in accordance with GDPR Article
                33.
              </p>

              {/* ───── CHILDREN ───── */}
              <h2 id="children">Children&apos;s privacy</h2>

              <p>
                Databasus Cloud is not directed at children under the age of 16.
                We do not knowingly collect personal data from children. If we
                become aware that we have collected data from a child under 16,
                we will delete it promptly.
              </p>

              {/* ───── CHANGES ───── */}
              <h2 id="changes">Changes to this policy</h2>

              <p>
                We may update this privacy policy from time to time. The
                &quot;Last updated&quot; date at the top indicates when the
                policy was last revised. Material changes will be communicated
                via email to registered users.
              </p>

              {/* ───── CONTACT ───── */}
              <h2 id="contact">Contact</h2>

              <p>
                If you have questions about this privacy policy or your data,
                contact us:
              </p>

              <ul>
                <li>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:info@databasus.com"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    info@databasus.com
                  </a>
                </li>
                <li>
                  <strong>Website:</strong>{" "}
                  <a
                    href="https://databasus.com"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    databasus.com
                  </a>
                </li>
                <li>
                  <strong>Data controller:</strong> Individual Entrepreneur
                  Rostyslav Duhin, Georgia
                </li>
              </ul>
            </article>
          </div>
        </main>

        <DocTableOfContentComponent />
      </div>
    </>
  );
}
