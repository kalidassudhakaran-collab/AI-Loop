"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inbox", label: "Inbox" },
  { href: "/ask", label: "Ask LOOP" },
  { href: "/themes", label: "Themes" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

type AppSidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export function AppSidebar({ open = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-slate-950 text-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
              LOOP
            </div>
            <p className="mt-1 text-sm text-slate-300">
              Customer feedback intelligence
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
