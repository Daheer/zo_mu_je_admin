"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { logoutAction } from "@/app/login/actions";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/riders", label: "Riders" },
  { href: "/customers", label: "Customers" },
  { href: "/trips", label: "Trips" },
  { href: "/reports", label: "Reports" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-[#1A1A1A] text-white flex flex-col border-r border-[#E0E0E0]/20">
      <div className="p-5 border-b border-[#E0E0E0]/20">
        <Link href="/" className="block">
          <Image
            src="/icon-transparent.png"
            alt="Zo Mu Je"
            width={140}
            height={140}
            className="object-contain"
          />
        </Link>
      </div>
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
                    ? "bg-primary text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-3 border-t border-[#E0E0E0]/20">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
