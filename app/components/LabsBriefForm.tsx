"use client";

import { useRef, useState } from "react";

const CHECKBOXES = [
  "backups",
  "restore",
  "Databasus",
  "monitoring",
  "performance",
  "emergency",
  "not sure yet",
];

export default function LabsBriefForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState("");

  const buildBrief = () => {
    const form = formRef.current;
    if (!form) return "";

    const boxes = Array.prototype.slice.call(
      form.querySelectorAll('input[type="checkbox"]')
    ) as HTMLInputElement[];
    const q1 = boxes.map(
      (c) => "   [" + (c.checked ? "x" : " ") + "] " + c.value
    );

    const v = (id: string) => {
      const el = form.querySelector<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("#" + id);
      return el ? el.value.trim() : "";
    };

    let lines = [
      "# ====================================================",
      "# PostgreSQL Review Brief — for info@databasus.com",
      "# ====================================================",
      "",
      "Subject: PostgreSQL Review Brief",
      "",
      "1. What do you need help with?",
    ];
    lines = lines.concat(q1);

    lines.push("");
    lines.push("2. Your role: " + v("b-role"));

    lines.push("");
    lines.push("3. PostgreSQL setup");
    lines.push("   Hosting: " + v("b-hosting"));
    lines.push("   Database size: " + v("b-dbsize"));
    lines.push("   Number of databases: " + v("b-dbcount"));

    lines.push("");
    lines.push("4. Backups today");
    lines.push("   How and where do you back up now? " + v("b-bkmethod"));
    lines.push("   When did you last test a restore? " + v("b-lastrestore"));

    lines.push("");
    lines.push("5. Databasus");
    lines.push("   Are you using Databasus? " + v("b-usingdbs"));
    lines.push("   If yes — what's unclear? " + v("b-dbsissue"));

    lines.push("");
    lines.push("6. What do you want to achieve?");
    lines.push("   " + v("b-goal"));

    lines.push("");
    lines.push("7. Constraints");
    lines.push("   NDA / DPA required? " + v("b-nda"));
    lines.push("   Must run inside your infrastructure? " + v("b-ininfra"));

    lines.push("");
    lines.push("# Send to: info@databasus.com");
    lines.push(
      "# I'll review the context and suggest the right next step."
    );
    return lines.join("\n");
  };

  const showCopied = () => {
    setStatus("Copied — now paste it to me");
    setTimeout(() => setStatus(""), 4000);
  };

  const copyBrief = () => {
    const text = buildBrief();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(showCopied)
        .catch(() => {
          window.prompt("Copy this brief:", text);
        });
    } else {
      window.prompt("Copy this brief:", text);
    }
  };

  return (
    <form ref={formRef} id="brief-form" className="mt-6 space-y-4" autoComplete="off">
      <fieldset>
        <legend className="text-base font-medium text-gray-300">
          1. What do you need help with?
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {CHECKBOXES.map((value) => (
            <label
              key={value}
              className="flex items-center gap-2.5 text-base text-gray-300"
            >
              <input
                type="checkbox"
                value={value}
                className="h-4 w-4 shrink-0 accent-[#155DFC]"
              />
              {value}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 2. Your role */}
      <div className="border-t border-[#ffffff15] pt-4">
        <label htmlFor="b-role" className="text-base font-bold text-white">
          2. Your role
        </label>
        <input
          id="b-role"
          type="text"
          placeholder="e.g. CEO, CTO, DBA, backend dev"
          className="mt-2 w-full rounded-lg border border-[#ffffff20] bg-[#0F1115] px-3 py-2 text-base text-white placeholder-gray-600 focus:outline focus:outline-2 focus:outline-[#0d6efd]"
        />
      </div>

      {/* 3. PostgreSQL setup */}
      <div className="border-t border-[#ffffff15] pt-4">
        <p className="text-base font-bold text-white">3. PostgreSQL setup</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="b-hosting" className="block text-base text-gray-400">
              Hosting
            </label>
            <select
              id="b-hosting"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-[#ffffff20] bg-[#0F1115] px-3 py-2 text-base text-white focus:outline focus:outline-2 focus:outline-[#0d6efd]"
            >
              <option value="">—</option>
              <option>VPS</option>
              <option>Docker</option>
              <option>Kubernetes</option>
              <option>RDS</option>
              <option>Cloud SQL</option>
              <option>Supabase</option>
              <option>other</option>
            </select>
          </div>
          <div>
            <label htmlFor="b-dbsize" className="block text-base text-gray-400">
              Database size
            </label>
            <input
              id="b-dbsize"
              type="text"
              placeholder="e.g. 500 GB"
              className="mt-1 w-full rounded-lg border border-[#ffffff20] bg-[#0F1115] px-3 py-2 text-base text-white placeholder-gray-600 focus:outline focus:outline-2 focus:outline-[#0d6efd]"
            />
          </div>
          <div>
            <label htmlFor="b-dbcount" className="block text-base text-gray-400">
              Number of databases
            </label>
            <input
              id="b-dbcount"
              type="text"
              placeholder="e.g. 3"
              className="mt-1 w-full rounded-lg border border-[#ffffff20] bg-[#0F1115] px-3 py-2 text-base text-white placeholder-gray-600 focus:outline focus:outline-2 focus:outline-[#0d6efd]"
            />
          </div>
        </div>
      </div>

      {/* 4. Backups today */}
      <div className="border-t border-[#ffffff15] pt-4">
        <p className="text-base font-bold text-white">4. Backups today</p>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="b-bkmethod" className="block text-base text-gray-400">
              How and where do you back up now?
            </label>
            <input
              id="b-bkmethod"
              type="text"
              placeholder="e.g. pg_dump cron → S3, or 'not sure'"
              className="mt-1 w-full rounded-lg border border-[#ffffff20] bg-[#0F1115] px-3 py-2 text-base text-white placeholder-gray-600 focus:outline focus:outline-2 focus:outline-[#0d6efd]"
            />
          </div>
          <div>
            <label
              htmlFor="b-lastrestore"
              className="block text-base text-gray-400"
            >
              When did you last test a restore?
            </label>
            <input
              id="b-lastrestore"
              type="text"
              placeholder="e.g. never, last year, unknown"
              className="mt-1 w-full rounded-lg border border-[#ffffff20] bg-[#0F1115] px-3 py-2 text-base text-white placeholder-gray-600 focus:outline focus:outline-2 focus:outline-[#0d6efd]"
            />
          </div>
        </div>
      </div>

      {/* 5. Databasus */}
      <div className="border-t border-[#ffffff15] pt-4">
        <p className="text-base font-bold text-white">5. Databasus</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="b-usingdbs" className="block text-base text-gray-400">
              Are you using Databasus?
            </label>
            <select
              id="b-usingdbs"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-[#ffffff20] bg-[#0F1115] px-3 py-2 text-base text-white focus:outline focus:outline-2 focus:outline-[#0d6efd]"
            >
              <option value="">—</option>
              <option>yes</option>
              <option>no</option>
            </select>
          </div>
          <div>
            <label htmlFor="b-dbsissue" className="block text-base text-gray-400">
              If yes — what&apos;s unclear?
            </label>
            <input
              id="b-dbsissue"
              type="text"
              placeholder="short note"
              className="mt-1 w-full rounded-lg border border-[#ffffff20] bg-[#0F1115] px-3 py-2 text-base text-white placeholder-gray-600 focus:outline focus:outline-2 focus:outline-[#0d6efd]"
            />
          </div>
        </div>
      </div>

      {/* 6. What do you want to achieve */}
      <div className="border-t border-[#ffffff15] pt-4">
        <label htmlFor="b-goal" className="text-base font-bold text-white">
          6. What do you want to achieve?
        </label>
        <textarea
          id="b-goal"
          rows={3}
          placeholder="What you want to fix, verify or be sure about"
          className="mt-2 w-full resize-y rounded-lg border border-[#ffffff20] bg-[#0F1115] px-3 py-2 text-base text-white placeholder-gray-600 focus:outline focus:outline-2 focus:outline-[#0d6efd]"
        ></textarea>
      </div>

      {/* 7. Constraints */}
      <div className="border-t border-[#ffffff15] pt-4">
        <p className="text-base font-bold text-white">7. Constraints</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="b-nda" className="block text-base text-gray-400">
              NDA / DPA required?
            </label>
            <select
              id="b-nda"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-[#ffffff20] bg-[#0F1115] px-3 py-2 text-base text-white focus:outline focus:outline-2 focus:outline-[#0d6efd]"
            >
              <option value="">—</option>
              <option>yes</option>
              <option>no</option>
            </select>
          </div>
          <div>
            <label htmlFor="b-ininfra" className="block text-base text-gray-400">
              Must run inside your infra?
            </label>
            <select
              id="b-ininfra"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-[#ffffff20] bg-[#0F1115] px-3 py-2 text-base text-white focus:outline focus:outline-2 focus:outline-[#0d6efd]"
            >
              <option value="">—</option>
              <option>yes</option>
              <option>no</option>
              <option>not sure</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="button"
        id="brief-copy"
        onClick={copyBrief}
        className="w-full cursor-pointer rounded-lg bg-white px-5 py-3 text-center text-base font-semibold text-[#0F1115] transition-colors hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6efd]"
      >
        Copy brief
      </button>
      <p
        id="brief-status"
        className="text-center text-base text-emerald-400"
        role="status"
        aria-live="polite"
      >
        {status}
      </p>
    </form>
  );
}
