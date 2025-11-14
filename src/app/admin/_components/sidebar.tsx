"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_LINKS } from "../_constants/nav-links";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const pathname = usePathname();

  return (
  <aside className="hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur lg:sticky lg:top-0 lg:block">
      <div className="flex h-16 items-center border-b border-slate-200 px-6 text-lg font-semibold uppercase tracking-[0.4em] text-slate-900">
        Hub
        <span className="text-red-600">F</span>
        <span className="ml-1 text-[0.6rem] font-medium tracking-[0.5em] text-slate-500">Admin</span>
      </div>
      <nav className="flex h-[calc(100%-4rem)] flex-col gap-1 overflow-y-auto p-4">
        {ADMIN_NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = pathname?.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
