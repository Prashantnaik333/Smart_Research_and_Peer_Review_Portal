
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Manuscripts", href: "/manuscripts" },
  { label: "Reviewers", href: "/reviewers" },
  { label: "Assignments", href: "/assignments" },
  { label: "Peer Reviews", href: "/reviews" },
  { label: "Discussions", href: "/discussions" },
  { label: "Reports & Analytics", href: "/reports" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-[#172638] p-6 text-white lg:block">
      <div className="mb-12">
        <div className="text-xl font-bold tracking-tight">
          Research<span className="text-emerald-400">Hub.</span>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Academic Research Portal
        </p>
      </div>

      <p className="mb-4 text-xs uppercase tracking-widest text-slate-400">
        Workspace
      </p>

      <nav className="space-y-2 text-sm">
        {navigation.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-3 font-medium transition ${
                active
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-7 left-6 text-xs text-slate-400">
        Smart Research Portal · 2026
      </div>
    </aside>
  );
}
