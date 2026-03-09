import type { Metadata } from "next";
import DocsNavbarComponent from "../components/DocsNavbarComponent";
import DocsSidebarComponent from "../components/DocsSidebarComponent";
import DocTableOfContentComponent from "../components/DocTableOfContentComponent";

export const metadata: Metadata = {
  title: "Terms of Use (Cloud) - Databasus",
  description:
    "Terms of use for Databasus Cloud. Read about service usage, billing, liability, data ownership and your responsibilities.",
  alternates: {
    canonical: "https://databasus.com/terms-of-use-cloud",
  },
  robots: "noindex",
};

export default function TermsOfUseCloudPage() {
  return (
    <>
      <DocsNavbarComponent />

      <div className="flex min-h-screen bg-[#0F1115]">
        <DocsSidebarComponent />

        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <article className="prose prose-blue max-w-none">
              <h1 id="terms-of-use">Terms of Use — Databasus Cloud</h1>

              <p className="text-lg text-gray-400">
                Last updated: March 9, 2026
              </p>

              <p>
                These Terms of Use (&quot;Terms&quot;) govern your access to and
                use of the Databasus Cloud service (&quot;Service&quot;)
                operated at{" "}
                <a
                  href="https://app.databasus.com"
                  className="text-blue-500 hover:text-blue-600"
                >
                  app.databasus.com
                </a>
                . Databasus Cloud is operated by Individual Entrepreneur
                Rostyslav Duhin (Identification Number: 347010209), registered
                in Georgia (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
              </p>

              <p>
                For the privacy policy of the self-hosted version and the
                marketing website, see the{" "}
                <a
                  href="/privacy"
                  className="text-blue-500 hover:text-blue-600"
                >
                  website privacy policy
                </a>
                . For the cloud privacy policy, see the{" "}
                <a
                  href="/privacy-cloud"
                  className="text-blue-500 hover:text-blue-600"
                >
                  cloud privacy policy
                </a>
                .
              </p>

              <h2 id="acceptance">1. Acceptance of terms</h2>

              <p>
                By creating an account, accessing or using the Service, you
                agree to be bound by these Terms. If you do not agree, do not
                use the Service. If you are using the Service on behalf of an
                organization, you represent that you have the authority to bind
                that organization to these Terms.
              </p>

              <h2 id="description">2. Description of service</h2>

              <p>
                Databasus Cloud is a managed cloud service for automated
                database backups. The Service supports PostgreSQL, MySQL,
                MariaDB and MongoDB. It provides scheduled backups, encrypted
                storage, backup management, team access controls and audit
                logging. The Service uses standard database dump tools
                (pg_dump, mysqldump, mongodump) to create backups and stores
                them in encrypted form in S3-compatible storage.
              </p>

              <h2 id="eligibility">3. Eligibility</h2>

              <p>
                You must be at least 18 years old and have the legal capacity to
                enter into a binding agreement to use the Service. By using the
                Service, you represent and warrant that you meet these
                requirements.
              </p>

              <h2 id="account">4. Account registration and security</h2>

              <p>
                To use the Service, you must create an account by providing
                accurate and complete information. You are responsible for:
              </p>

              <ul>
                <li>
                  Maintaining the accuracy of your account information
                </li>
                <li>
                  Keeping your login credentials secure and confidential
                </li>
                <li>
                  All activity that occurs under your account, whether or not
                  authorized by you
                </li>
                <li>
                  The actions of any team members you invite to your
                  organization — the account owner is responsible for managing
                  access and permissions
                </li>
              </ul>

              <p>
                You must notify us immediately at{" "}
                <a
                  href="mailto:info@databasus.com"
                  className="text-blue-500 hover:text-blue-600"
                >
                  info@databasus.com
                </a>{" "}
                if you suspect unauthorized access to your account.
              </p>

              <h2 id="plans">5. Free and paid plans</h2>

              <p>
                The Service offers a free tier with limitations on database size
                and backup retention period, as well as paid plans with
                increased limits. Details of available plans and their
                limitations are displayed on the Service website.
              </p>

              <p>
                We reserve the right to modify, limit or discontinue the free
                tier at any time without prior notice. Free tier users have no
                entitlement to continued free access.
              </p>

              <h2 id="payment">6. Payment and billing</h2>

              <ul>
                <li>
                  Paid plans are billed on a <strong>monthly</strong> cycle and
                  renew automatically unless cancelled before the next billing
                  date
                </li>
                <li>
                  All fees are non-refundable except as required by applicable
                  law. In exceptional circumstances, we may at our sole
                  discretion issue refunds or credits on a case-by-case basis
                </li>
                <li>
                  If a payment fails, your account may be{" "}
                  <strong>immediately suspended</strong> until the outstanding
                  balance is resolved. We are not liable for any data loss or
                  service interruption resulting from payment failure
                </li>
                <li>
                  You are responsible for any applicable taxes in your
                  jurisdiction
                </li>
              </ul>

              <h2 id="user-responsibilities">7. User responsibilities</h2>

              <p>
                You are solely responsible for:
              </p>

              <ul>
                <li>
                  Providing correct and working database connection credentials
                </li>
                <li>
                  Ensuring your databases are accessible from the Databasus
                  Cloud network
                </li>
                <li>
                  Monitoring backup status notifications and acting promptly on
                  any failures
                </li>
                <li>
                  <strong>
                    Periodically testing backup restores independently
                  </strong>{" "}
                  to verify backup integrity
                </li>
                <li>
                  Maintaining a valid payment method for paid plans
                </li>
                <li>
                  Complying with your own database provider&apos;s terms of
                  service when using the Service
                </li>
                <li>
                  Ensuring you have the legal right and authorization to back up
                  the databases you connect to the Service
                </li>
              </ul>

              <h2 id="backup-disclaimer">
                8. Backup service disclaimer
              </h2>

              <p>
                <strong>
                  This is a critical section. Please read it carefully.
                </strong>
              </p>

              <p>
                The Service performs database backups on a{" "}
                <strong>best-effort basis</strong>. While we strive to provide
                reliable backup operations, we{" "}
                <strong>
                  do not guarantee that backups will be complete, accurate,
                  uncorrupted or recoverable
                </strong>
                . Backups may fail, be incomplete or become unrecoverable due to
                reasons including but not limited to:
              </p>

              <ul>
                <li>Network connectivity issues between the Service and your database</li>
                <li>Expired, incorrect or insufficient database credentials</li>
                <li>Database configuration issues or version incompatibilities</li>
                <li>Storage provider outages or errors</li>
                <li>
                  Bugs or limitations in upstream database dump tools (pg_dump,
                  mysqldump, mongodump)
                </li>
                <li>Service bugs or infrastructure failures</li>
                <li>Encryption key loss</li>
              </ul>

              <p>
                <strong>
                  The Service is not intended to be your sole backup strategy.
                </strong>{" "}
                You are solely responsible for maintaining independent backup
                mechanisms and for verifying backup integrity through regular
                test restores. We do not guarantee any specific Recovery Point
                Objective (RPO) or Recovery Time Objective (RTO).
              </p>

              <p>
                We provide backup status notifications and logs to help you
                monitor backup operations, but you are responsible for reviewing
                them and taking appropriate action when issues arise.
              </p>

              <h2 id="acceptable-use">9. Acceptable use</h2>

              <p>You agree not to:</p>

              <ul>
                <li>
                  Use the Service for any illegal purpose or in violation of any
                  applicable law
                </li>
                <li>
                  Store, back up or transmit any content that is illegal,
                  harmful, threatening, abusive, defamatory or otherwise
                  objectionable
                </li>
                <li>
                  Attempt to overload, disrupt or interfere with the Service or
                  its infrastructure
                </li>
                <li>
                  Circumvent any usage limits, access controls or security
                  measures of the Service
                </li>
                <li>
                  Resell, sublicense or provide the Service to third parties
                  without our prior written consent
                </li>
                <li>
                  Connect databases that you do not own or do not have
                  authorization to back up
                </li>
                <li>
                  Create multiple accounts to circumvent free tier limitations
                </li>
                <li>
                  Use the Service in a way that could damage our reputation or
                  the reputation of other users
                </li>
              </ul>

              <p>
                We do not proactively monitor the content of your databases or
                backups. However, violation of this section may result in
                immediate suspension or termination of your account.
              </p>

              <h2 id="your-data">10. Your data</h2>

              <p>
                You retain all ownership rights to your data, including database
                content and backup archives. By using the Service, you grant us
                a limited, non-exclusive license to access, store and process
                your data solely for the purpose of providing the Service.
              </p>

              <p>
                We may collect and use aggregated, anonymous usage data (such as
                backup sizes, frequency and success rates) to improve the
                Service. Such data cannot be used to identify you or your
                databases.
              </p>

              <p>
                For details on how we handle your personal data, see our{" "}
                <a
                  href="/privacy-cloud"
                  className="text-blue-500 hover:text-blue-600"
                >
                  cloud privacy policy
                </a>
                .
              </p>

              <h2 id="data-retention">11. Data retention and deletion</h2>

              <p>
                You can delete your databases, backups and associated data at
                any time through the dashboard. Upon account closure or
                termination, all your data — including account information,
                database credentials, backups and audit logs — will be deleted
                within 30 days.
              </p>

              <p>
                It is your responsibility to download or export any data you
                wish to retain before closing your account or before your
                account is terminated. We are not obligated to retain or provide
                your data after the 30-day deletion period.
              </p>

              <h2 id="third-party-services">12. Third-party services</h2>

              <p>
                The Service relies on third-party infrastructure and services,
                including but not limited to S3-compatible storage providers,
                payment processors, upstream database dump tools and content
                delivery networks. We are not responsible for outages, errors,
                data loss or service degradation caused by third-party services.
              </p>

              <h2 id="intellectual-property">13. Intellectual property</h2>

              <p>
                The Service, including its design, code, features, branding and
                documentation, is the intellectual property of the operator. You
                may not copy, modify, distribute, reverse engineer or create
                derivative works of the Service without our prior written
                consent.
              </p>

              <p>
                The open source self-hosted version of Databasus is licensed
                separately under the Apache 2.0 license and is not governed by
                these Terms.
              </p>

              <h2 id="service-availability">14. Service availability</h2>

              <p>
                We do not guarantee any specific level of uptime, availability
                or performance. The Service is provided without a Service Level
                Agreement (SLA). The Service may experience planned or
                unplanned downtime for maintenance, updates, infrastructure
                changes or other reasons.
              </p>

              <p>
                We may modify, update or discontinue any features of the
                Service at any time.
              </p>

              <h2 id="disclaimer-of-warranties">
                15. Disclaimer of warranties
              </h2>

              <p>
                <strong>
                  The Service is provided &quot;AS IS&quot; and &quot;AS
                  AVAILABLE&quot; without warranties of any kind, whether
                  express, implied or statutory.
                </strong>{" "}
                We expressly disclaim all warranties, including but not limited
                to implied warranties of merchantability, fitness for a
                particular purpose, non-infringement, accuracy, reliability and
                availability.
              </p>

              <p>
                Without limiting the foregoing, we do not warrant that the
                Service will be uninterrupted, error-free, secure or free of
                harmful components, or that backups will be complete, accurate
                or recoverable.
              </p>

              <h2 id="limitation-of-liability">
                16. Limitation of liability
              </h2>

              <p>
                <strong>
                  To the maximum extent permitted by applicable law, we shall
                  not be liable for any indirect, incidental, special,
                  consequential or punitive damages, including but not limited
                  to loss of data, loss of profits, loss of business, loss of
                  revenue or any damages arising from backup failures, data
                  corruption, data loss or inability to restore backups,
                  regardless of the cause or theory of liability.
                </strong>
              </p>

              <p>
                Our total aggregate liability for any and all claims arising out
                of or related to the Service shall not exceed the total fees
                paid by you to us in the three (3) months immediately preceding
                the event giving rise to the claim. If you have not paid any
                fees, our total liability shall not exceed zero, to the maximum
                extent permitted by applicable law.
              </p>

              <p>
                This limitation of liability applies to the fullest extent
                permitted by law, even if we have been advised of the
                possibility of such damages.
              </p>

              <h2 id="indemnification">17. Indemnification</h2>

              <p>
                To the extent permitted by applicable law, you agree to
                indemnify, defend and hold harmless the operator from and
                against any third-party claims, damages, losses, costs and
                expenses (including reasonable legal fees) arising from:
              </p>

              <ul>
                <li>Your violation of these Terms</li>
                <li>Your misuse of the Service</li>
                <li>
                  Your violation of any applicable law or the rights of any
                  third party
                </li>
                <li>
                  The content of the databases you connect to the Service
                </li>
              </ul>

              <h2 id="suspension-and-termination">
                18. Suspension and termination
              </h2>

              <p>
                To the extent permitted by applicable law, we reserve the right
                to suspend or terminate your account and access to the Service
                at our sole discretion, with or without cause and with or
                without notice. Reasons for suspension or
                termination may include but are not limited to: violation of
                these Terms, non-payment, suspected fraud, abuse or if
                continued provision of the Service is no longer commercially
                viable.
              </p>

              <p>
                You may stop using the Service at any time. To close your
                account, contact us at{" "}
                <a
                  href="mailto:info@databasus.com"
                  className="text-blue-500 hover:text-blue-600"
                >
                  info@databasus.com
                </a>
                .
              </p>

              <p>
                Upon termination, your right to use the Service ceases
                immediately. Sections that by their nature should survive
                termination (including disclaimer of warranties, limitation of
                liability, indemnification and governing law) shall survive.
              </p>

              <h2 id="modifications">19. Modifications to terms and pricing</h2>

              <p>
                We may modify these Terms from time to time. For material
                changes to the Terms, we will provide at least 30 days&apos;
                advance notice via email to the address associated with your
                account. The updated Terms will indicate the new &quot;Last
                updated&quot; date. Your continued use of the Service after the
                effective date constitutes your acceptance of the modified
                Terms. If you do not agree with the changes, you must stop
                using the Service and close your account before the effective
                date.
              </p>

              <p>
                We may change the pricing of the Service at any time. Pricing
                changes take effect at the start of your next billing cycle.
                You may cancel your plan before the next billing cycle if you
                do not agree with the new pricing.
              </p>

              <p>
                Minor, non-material changes to the Terms (such as corrections
                or clarifications) and changes required for security or legal
                compliance may take effect immediately.
              </p>

              <h2 id="governing-law">20. Governing law and disputes</h2>

              <p>
                These Terms shall be governed by and construed in accordance
                with the laws of Georgia. Any disputes arising out of or
                relating to these Terms or the Service shall be submitted to the
                exclusive jurisdiction of the courts of Georgia.
              </p>

              <p>
                If you are a consumer in the European Union, nothing in these
                Terms affects your rights under the mandatory consumer
                protection laws of your country of residence.
              </p>

              <p>
                Before initiating any legal proceedings, you agree to first
                contact us at{" "}
                <a
                  href="mailto:info@databasus.com"
                  className="text-blue-500 hover:text-blue-600"
                >
                  info@databasus.com
                </a>{" "}
                and attempt to resolve the dispute informally for at least 30
                days.
              </p>

              <h2 id="force-majeure">21. Force majeure</h2>

              <p>
                We shall not be liable for any failure or delay in performing
                our obligations under these Terms caused by events beyond our
                reasonable control, including but not limited to natural
                disasters, wars, terrorism, pandemics, government actions,
                power outages, internet or telecommunications failures,
                cyberattacks, or failures of third-party infrastructure
                providers.
              </p>

              <h2 id="general-provisions">22. General provisions</h2>

              <ul>
                <li>
                  <strong>Severability</strong> — if any provision of these
                  Terms is found to be invalid or unenforceable, the remaining
                  provisions shall remain in full force and effect
                </li>
                <li>
                  <strong>Entire agreement</strong> — these Terms, together with
                  the{" "}
                  <a
                    href="/privacy-cloud"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    cloud privacy policy
                  </a>
                  , constitute the entire agreement between you and us regarding
                  the Service
                </li>
                <li>
                  <strong>No waiver</strong> — our failure to enforce any
                  provision of these Terms shall not constitute a waiver of that
                  provision or any other provision
                </li>
                <li>
                  <strong>Assignment</strong> — we may assign or transfer these
                  Terms and our rights and obligations without your consent. You
                  may not assign your rights or obligations under these Terms
                  without our prior written consent
                </li>
              </ul>

              <h2 id="contact">Contact</h2>

              <p>
                If you have questions about these Terms, contact us:
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
                  <strong>Operator:</strong> Individual Entrepreneur Rostyslav
                  Duhin, Georgia
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
