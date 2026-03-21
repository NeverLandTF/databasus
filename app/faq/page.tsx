import type { Metadata } from "next";
import DocsNavbarComponent from "../components/DocsNavbarComponent";
import DocsSidebarComponent from "../components/DocsSidebarComponent";
import DocTableOfContentComponent from "../components/DocTableOfContentComponent";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions | Databasus",
  description:
    "Frequently asked questions about Databasus PostgreSQL backup tool with MySQL, MariaDB and MongoDB support. Learn how to backup localhost databases, understand backup formats, compression methods and more.",
  keywords: [
    "Databasus FAQ",
    "PostgreSQL backup questions",
    "localhost database backup",
    "backup formats",
    "pg_dump compression",
    "zstd compression",
    "PostgreSQL backup help",
    "database backup guide",
  ],
  openGraph: {
    title: "FAQ - Frequently Asked Questions | Databasus",
    description:
      "Frequently asked questions about Databasus PostgreSQL backup tool with MySQL, MariaDB and MongoDB support. Learn how to backup localhost databases, understand backup formats, compression methods and more.",
    type: "article",
    url: "https://databasus.com/faq",
  },
  twitter: {
    card: "summary",
    title: "FAQ - Frequently Asked Questions | Databasus",
    description:
      "Frequently asked questions about Databasus PostgreSQL backup tool with MySQL, MariaDB and MongoDB support. Learn how to backup localhost databases, understand backup formats, compression methods and more.",
  },
  alternates: {
    canonical: "https://databasus.com/faq",
  },
  robots: "index, follow",
};

export default function FAQPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Why does Databasus not use raw SQL dump format for logical PostgreSQL backups?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "For logical backups, Databasus uses pg_dump's custom format with zstd compression because it provides the most efficient backup and restore speed after extensive testing. The custom format with zstd compression level 5 offers the optimal balance between backup creation speed, restore speed and file size.",
                },
              },
              {
                "@type": "Question",
                name: "Where is Databasus installed?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Databasus is installed in /opt/databasus/",
                },
              },
              {
                "@type": "Question",
                name: "How does Databasus support PITR (Point-in-Time Recovery)?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Databasus supports PITR through the Databasus agent — a lightweight Go binary that runs alongside your PostgreSQL database. The agent continuously streams compressed WAL segments to Databasus and performs periodic physical backups via pg_basebackup. To restore, run the agent's restore command with a target timestamp — it downloads the full backup and WAL segments from Databasus, configures PostgreSQL recovery mode, and replays WAL to the exact target time. Suitable for disaster recovery with near-zero data loss, databases in closed networks and large databases where physical backups are faster than logical dumps.",
                },
              },
              {
                "@type": "Question",
                name: "How is AI used in Databasus development?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "AI is used as a helper for verification of code quality and searching for vulnerabilities, cleaning up and improving documentation, assistance during development and double-checking PRs after human review. AI is NOT used for writing entire code, vibe code approach, code without line-by-line verification or code without tests. The project has solid test coverage, CI/CD pipeline automation and verification by experienced developers. AI is just an assistant - the work is done by developers.",
                },
              },
              {
                "@type": "Question",
                name: "How to backup Databasus itself?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "To backup Databasus, go to /opt/databasus (or the folder where you installed it), then navigate to the databasus-data directory. You need to backup the secret.key file (encryption key for credentials) and the /pgdata folder (internal database containing configurations and backup metadata). There are two recovery scenarios: 1) You can recover database backups using only secret.key without Databasus UI (see manual recovery guide), 2) To restore Databasus UI with all configurations and history, you need both secret.key and /pgdata folder. To restore, recreate this folder structure on another server.",
                },
              },
              {
                "@type": "Question",
                name: "How is Databasus supported by Anthropic and OpenAI open-source programs?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "In March 2026, Databasus was accepted into both Claude for Open Source by Anthropic and Codex for Open Source by OpenAI. Being backed by these programs is a reliability signal — the project has been independently evaluated and recognized by industry leaders as critical open-source infrastructure worth supporting. Despite having access to the best AI tooling available, Databasus maintains strict AI usage rules: no vibe coding, line-by-line human verification and full test coverage are required for all contributions.",
                },
              },
            ],
          }),
        }}
      />

      <DocsNavbarComponent />

      <div className="flex min-h-screen bg-[#0F1115]">
        {/* Sidebar */}
        <DocsSidebarComponent />

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <article className="prose prose-blue max-w-none">
              <h1 id="faq">Frequently Asked Questions</h1>

              <p className="text-lg text-gray-400">
                Find answers to the most common questions about Databasus,
                including installation, configuration and backup strategies.
              </p>

              <h2 id="why-no-raw-sql-dump">
                Why does Databasus not use raw SQL dump format for logical
                PostgreSQL backups?
              </h2>

              <p>
                For logical backups, Databasus uses{" "}
                <code>pg_dump</code>&apos;s{" "}
                <strong>custom format</strong> with{" "}
                <strong>zstd compression at level 5</strong> instead of the
                plain SQL format because it provides the most efficient balance
                between:
              </p>

              <ul>
                <li>Backup creation speed</li>
                <li>Restore speed</li>
                <li>
                  File size compression (up to 20x times smaller than plain SQL
                  format)
                </li>
              </ul>

              <p>
                This decision was made after extensive testing and benchmarking
                of different PostgreSQL backup formats and compression methods.
                You can read more about testing here{" "}
                <a
                  href="https://dev.to/rostislav_dugin/postgresql-backups-comparing-pgdump-speed-in-different-formats-and-with-different-compression-4pmd"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PostgreSQL backups: comparing pg_dump speed in different
                  formats and with different compression
                </a>
                .
              </p>

              <p>Databasus will not include raw SQL dump format, because:</p>

              <ul>
                <li>extra variety is bad for UX;</li>
                <li>makes it harder to support the code;</li>
                <li>current dump format is suitable for 99% of the cases</li>
              </ul>

              <h2 id="installation-directory">
                Where is Databasus installed if installed via .sh script?
              </h2>

              <p>
                Databasus is installed in <code>/opt/databasus/</code>{" "}
                directory.
              </p>

              <h2 id="pitr">
                How does Databasus support PITR (Point-in-Time Recovery)?
              </h2>

              <p>
                Databasus supports PITR through the{" "}
                <strong>Databasus agent</strong> — a lightweight Go binary that
                runs alongside your PostgreSQL database. The agent connects
                outbound to your Databasus instance, so the database never
                needs to be exposed publicly.
              </p>

              <p>
                <strong>How backups work:</strong>
              </p>

              <ul>
                <li>
                  The agent runs two concurrent processes:{" "}
                  <strong>WAL streaming</strong> and{" "}
                  <strong>periodic physical backups</strong>
                </li>
                <li>
                  WAL segments are compressed with zstd and continuously
                  uploaded to Databasus with gap detection to ensure chain
                  integrity
                </li>
                <li>
                  Physical backups are created via{" "}
                  <code>pg_basebackup</code>, streamed as compressed TAR
                  directly to Databasus — no intermediate files on disk
                </li>
                <li>
                  Full backups are triggered on schedule or automatically when
                  the WAL chain is broken
                </li>
              </ul>

              <p>
                <strong>How restoration works:</strong>
              </p>

              <ul>
                <li>
                  Run{" "}
                  <code>
                    databasus-agent restore --target-dir &lt;pgdata&gt;
                    --target-time &lt;timestamp&gt;
                  </code>
                </li>
                <li>
                  The agent downloads the full backup and all required WAL
                  segments from Databasus
                </li>
                <li>
                  It extracts the basebackup, configures PostgreSQL recovery
                  mode (<code>recovery.signal</code>,{" "}
                  <code>restore_command</code>,{" "}
                  <code>recovery_target_time</code>)
                </li>
                <li>
                  Start PostgreSQL — it replays WAL to the target time,
                  promotes to primary and resumes normal operations
                </li>
              </ul>

              <p>
                <strong>Suitable for:</strong>
              </p>

              <ul>
                <li>
                  Disaster recovery with near-zero data loss — restore to any
                  second between backups
                </li>
                <li>
                  Self-hosted and on-premise databases where hourly or daily
                  logical backups are not granular enough
                </li>
                <li>
                  Databases in closed networks — the agent connects outbound
                  to Databasus, so no inbound access is needed
                </li>
                <li>
                  Large databases where physical backups are faster than
                  logical dumps
                </li>
              </ul>

              <h2 id="ai-usage">How is AI used in Databasus development?</h2>

              <p>
                There have been questions about AI usage in project development
                in issues and discussions. As the project focuses on security,
                reliability and production usage, it&apos;s important to explain
                how AI is used in the development process.
              </p>

              <p>
                <strong>AI is used as a helper for:</strong>
              </p>

              <ul>
                <li>
                  Verification of code quality and searching for vulnerabilities
                </li>
                <li>
                  Cleaning up and improving documentation, comments and code
                </li>
                <li>Assistance during development</li>
                <li>Double-checking PRs and commits after human review</li>
              </ul>

              <p>
                <strong>AI is NOT used for:</strong>
              </p>

              <ul>
                <li>Writing entire code</li>
                <li>&quot;Vibe code&quot; approach</li>
                <li>Code without line-by-line verification by a human</li>
                <li>Code without tests</li>
              </ul>

              <p>
                <strong>The project has:</strong>
              </p>

              <ul>
                <li>Solid test coverage (both unit and integration tests)</li>
                <li>
                  CI/CD pipeline automation with tests and linting to ensure
                  code quality
                </li>
                <li>
                  Verification by experienced developers with experience in
                  large and secure projects
                </li>
              </ul>

              <p>
                So AI is just an assistant and a tool for developers to increase
                productivity and ensure code quality. The work is done by
                developers.
              </p>

              <p>
                Moreover, it&apos;s important to note that we do not
                differentiate between bad human code and AI vibe code. There are
                strict requirements for any code to be merged to keep the
                codebase maintainable.
              </p>

              <p>
                Even if code is written manually by a human, it&apos;s not
                guaranteed to be merged. Vibe code is not allowed at all and all
                such PRs are rejected by default (see{" "}
                <a href="/contribute">contributing guide</a>).
              </p>

              <p>
                We also draw attention to fast issue resolution and security{" "}
                <a
                  href="https://github.com/databasus/databasus?tab=security-ov-file#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  vulnerability reporting
                </a>
                .
              </p>

              <h2 id="backup-databasus">How to backup Databasus itself?</h2>

              <p>
                If you want to backup your Databasus instance (including all
                configurations, databases and credentials), follow these steps:
              </p>

              <ol>
                <li>
                  Go to <code>/opt/databasus</code> (or the folder where you
                  installed Databasus)
                </li>
                <li>
                  Navigate to the <code>databasus-data</code> directory
                </li>
              </ol>

              <p>
                <strong>You need to backup:</strong>
              </p>

              <ul>
                <li>
                  <code>secret.key</code> — encryption key for your credentials
                </li>
                <li>
                  <code>/pgdata</code> — internal PostgreSQL database of
                  Databasus that contains all your configurations and backup
                  metadata
                </li>
              </ul>

              <p>
                If you use local storage for backups, you can also backup the{" "}
                <code>backups</code> folder.
              </p>

              <p>
                <strong>Important:</strong> There are two different scenarios
                for recovery:
              </p>

              <ul>
                <li>
                  <strong>Recover backups without Databasus UI:</strong> You can
                  recover your database backups using only the{" "}
                  <code>secret.key</code> file, without needing Databasus or its
                  internal data. See the{" "}
                  <a href="/how-to-recover-without-databasus">
                    manual recovery guide
                  </a>{" "}
                  for detailed instructions.
                </li>
                <li>
                  <strong>Restore Databasus UI and all configurations:</strong>{" "}
                  If you want to restore the Databasus interface with all your
                  configurations, scheduled backups and backup history, you need
                  to backup both <code>secret.key</code> and the{" "}
                  <code>/pgdata</code> folder (which contains the encryption
                  metadata and all Databasus configurations).
                </li>
              </ul>

              <p>
                <strong>To restore Databasus on another server:</strong> simply
                recreate the <code>databasus-data</code> folder structure with
                the backed up files and start Databasus.
              </p>

              <h2 id="oss-programs">
                How is Databasus supported by Anthropic and OpenAI open-source
                programs?
              </h2>

              <p>
                In March 2026, Databasus was accepted into both{" "}
                <strong>
                  <a
                    href="https://claude.com/contact-sales/claude-for-oss"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Claude for Open Source
                  </a>
                </strong>{" "}
                by Anthropic and{" "}
                <strong>
                  <a
                    href="https://developers.openai.com/codex/community/codex-for-oss/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Codex for Open Source
                  </a>
                </strong>{" "}
                by OpenAI. It is really valuable for us that the project has
                been recognized as important open-source software for the
                industry by two of the world&apos;s leading AI companies —
                especially given the high eligibility requirements of both
                programs.
              </p>

              <p>
                What does it mean for users? It just one more reliability
                confirmation that the project has been independently evaluated
                and recognized by industry leaders as critical infrastructure
                worth supporting. So we have even higher code quality, faster
                security reviews and continued active development due to access
                to the latest unlimited AIs.
              </p>

              <img
                src="/images/faq/anthropic-email.png"
                alt="Databasus accepted into Claude for Open Source program by Anthropic"
                className="my-6 rounded-lg border border-gray-700 max-w-full sm:max-w-[1000px]"
                loading="lazy"
              />

              <img
                src="/images/faq/openai-email.png"
                alt="Databasus accepted into Codex for Open Source program by OpenAI"
                className="my-6 rounded-lg border border-gray-700 max-w-full sm:max-w-[1000px]"
                loading="lazy"
              />

              <p>
                Despite having access to these programs, Databasus maintains
                strict AI usage rules as described in the{" "}
                <a href="#ai-usage">AI usage section</a>. All code requires
                line-by-line human verification, full test coverage and
                experienced developer review. Vibe coding is not allowed. AI
                remains a tool for developers — not a replacement for human
                judgment.
              </p>

              <h2 id="why-internal-postgres-valkey">
                Why are PostgreSQL and Valkey packaged inside the container?
              </h2>

              <p>
                Databasus uses PostgreSQL as its internal storage (backup
                metadata, database configurations, audit logs, etc.) and Valkey
                for caching. Both are bundled inside the image. Here is why:
              </p>

              <p>
                <strong>For users:</strong>
              </p>

              <ul>
                <li>
                  <strong>You only pull one image</strong> — no extra configs,
                  no managing other images, no tracking internal service
                  versions, no environment variables to set. Just run{" "}
                  <code>docker run</code>, even if you manage hundreds of
                  databases.
                </li>
                <li>
                  <strong>Auto-update covers everything</strong> — enable
                  auto-update for the Databasus image and forget about it. There
                  are no separate upgrade guides for internal services and no
                  multiple image versions to keep in sync.
                </li>
                <li>
                  <strong>
                    The <a href="/faq#backup-databasus">backup guide</a> just
                    works
                  </strong>{" "}
                  — it is written around the internal PostgreSQL. With an
                  external database you would have to figure out its backup
                  separately.
                </li>
              </ul>

              <p>
                <strong>For Databasus maintainers:</strong>
              </p>

              <ul>
                <li>
                  <strong>We know exactly what is inside the image</strong> — we
                  control migrations, extensions and service configuration. That
                  means we can safely bump internal service versions without
                  breaking compatibility and stay focused on development.
                </li>
                <li>
                  <strong>
                    Users never have to touch their compose files for upgrades
                  </strong>{" "}
                  — PostgreSQL and Valkey versions are updated inside the image.
                  With external services, many users would skip or delay upgrade
                  steps and run into compatibility issues across versions.
                </li>
              </ul>

              <p>
                So, summing up, it is reasonable approach for projects which
                focus on simple UX and do not face hunders of RPS. For example,
                GitLab CE follows same approach.
              </p>

              <p>
                <strong>What about performance overhead?</strong> — there is
                none worth noting. Databasus is network-intensive (uploading and
                downloading backup files to remote storage), not
                database-intensive. The internal PostgreSQL typically use
                100–150 MB of RAM for hundreds of backup jobs across hundreds of
                databases with millions of backups records. If you increase your
                server resources, it will increase accordingly so there is no
                chance to reach vertical scaling limits.
                <br />
                <br />
                Both services are only accessible inside the container
                (PostgreSQL runs on port <code>5437</code>, Valkey binds to{" "}
                <code>127.0.0.1</code> only) and are never exposed externally.
              </p>

              <h3 id="external-postgres-valkey">
                I don&apos;t care and still want to use my external PostgreSQL
                or Valkey
              </h3>

              <div className="my-4 rounded-r border-l-4 border-red-500 bg-red-500/10 p-4 pb-1">
                <p className="m-0">
                  <strong>
                    This is not a tested or supported configuration.
                  </strong>{" "}
                  We do not run migration tests against external services, so
                  your instance may break on the next upgrade with no migration
                  path provided. If you understand the risks — the variables are
                  below.
                </p>
              </div>

              <p>
                The only reason we use external services ourselves is the
                Databasus playground — it runs on a cluster of distributed
                servers that together handle up to 100 Gbit/s of throughput, so
                all nodes need to share the same database.
                <br />
                <br />
                Why do we use a multi-node cluster for the playground, but not
                recommend it to you even you have hundreds of DBs? Our
                playground is a public service used by thousands of users
                (because Databasus is the most popular PostgreSQL backup tool
                now). Because it is public, we also face DDoS attacks and need
                far higher throughput than any typical company would. It&apos;s
                not just production use, it&apos;s permanent defence 🛡️. You are
                almost certainly not running anything like this.
                <br />
                <br />
                Actually, we don&apos;t know which company needs to backup
                thousands of DBs like our playground. Usual production use of
                Databasus is from a couple of databases to hundreds of databases
                (in DBA outsourcing companies)
                <br />
                <br />
                Anyway, if you genuinely face the same situation as we — use
                variables below (we do not lock this ability despite it&apos;s
                hard to maintain it), but lock Databasus version before. By the
                way, for a regular single-server installation this adds
                complexity with no benefit. For internal backuping of our DBs we
                also use regular Databasus installation with internal PostgreSQL
                and Valkey.
              </p>

              <p>
                If you still want to proceed, here are the environment variables
                that control this:
              </p>

              <p>
                <strong>External PostgreSQL:</strong>
              </p>

              <ul>
                <li>
                  <code>DATABASE_DSN</code> — full PostgreSQL connection string.
                  Example:{" "}
                  <code>postgresql://user:password@host:5432/databasus</code>
                </li>
              </ul>

              <p>
                <strong>External Valkey:</strong>
              </p>

              <ul>
                <li>
                  <code>VALKEY_HOST</code> — hostname of your Valkey instance
                </li>
                <li>
                  <code>VALKEY_PORT</code> — port (default <code>6379</code>)
                </li>
                <li>
                  <code>VALKEY_USERNAME</code> — username, leave empty if not
                  set
                </li>
                <li>
                  <code>VALKEY_PASSWORD</code> — password
                </li>
                <li>
                  <code>VALKEY_IS_SSL</code> — <code>true</code> or{" "}
                  <code>false</code>
                </li>
              </ul>

              <h3 id="distributed-ha">
                What if I need distributed stateless HA?
              </h3>

              <p>
                If your goal is a fully distributed, stateless HA setup where
                multiple application nodes share the same PostgreSQL and Valkey
                instances — neither Databasus, WAL-G, nor pgBackRest are the
                right tools for that. Those are backup tools, not cluster
                orchestrators.
              </p>

              <p>
                For distributed PostgreSQL HA you should look at purpose-built
                Kubernetes operators:
              </p>

              <ul>
                <li>
                  <strong>
                    <a
                      href="https://cloudnative-pg.io"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      CloudNativePG (CNPG)
                    </a>{" "}
                    + Barman Cloud
                  </strong>{" "}
                  — the CNCF-backed operator with built-in WAL archiving and
                  backup to object storage via Barman Cloud
                </li>
                <li>
                  <strong>
                    <a
                      href="https://access.crunchydata.com/documentation/postgres-operator/latest/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      PGO (Crunchy Postgres Operator)
                    </a>{" "}
                    + object storage
                  </strong>{" "}
                  — another mature operator with pgBackRest integration and
                  S3-compatible storage support
                </li>
              </ul>
            </article>
          </div>
        </main>

        {/* Table of Contents */}
        <DocTableOfContentComponent />
      </div>
    </>
  );
}
