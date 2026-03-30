export function CloudDashboardButton({
  variant,
}: {
  variant: "navbar" | "hero";
}) {
  return variant === "navbar" ? (
    <a
      href="https://app.databasus.com"
      className="flex items-center gap-2 hover:opacity-70 rounded-lg px-2 md:px-3 py-2 text-[14px] border border-[#0d6efd] bg-[#0d6efd] transition-colors cursor-pointer"
    >
      Dashboard
    </a>
  ) : (
    <a
      href="https://app.databasus.com"
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-12 sm:py-2.5 bg-[#0d6efd] rounded-lg text-white font-medium hover:opacity-70 transition-opacity order-1 cursor-pointer"
    >
      <span>Dashboard</span>
      <svg
        aria-hidden={true}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </a>
  );
}
