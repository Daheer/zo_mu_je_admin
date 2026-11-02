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
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const logoutForm = (
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            Log out
          </button>
        </form>
  );

  return (
    <aside className="w-full shrink-0 bg-[#1A1A1A] text-white flex flex-col border-b border-[#E0E0E0]/20 md:w-56 md:min-h-screen md:border-b-0 md:border-r">
      <div className="flex items-center justify-between p-3 border-b border-[#E0E0E0]/20 md:block md:p-5">
        <Link href="/" className="flex items-center gap-2 md:block">
          <Image
            src="/icon-transparent.png"
            alt=""
            width={140}
            height={140}
            className="h-10 w-auto object-contain md:h-auto md:w-[140px]"
          />
          <span className="text-sm font-semibold md:sr-only">Zo Mu Je Admin</span>
        </Link>
        <div className="md:hidden">{logoutForm}</div>
      </div>
      <nav aria-label="Admin navigation" className="min-w-0 p-2 md:flex-1 md:p-3">
        <ul className="grid grid-cols-3 gap-1 md:block md:space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`block whitespace-nowrap px-3 py-3 text-center md:px-4 md:text-left rounded-xl text-sm font-medium transition-colors ${isActive
                    ? "bg-primary text-primary-foreground"
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
      <div className="hidden p-3 border-t border-[#E0E0E0]/20 md:block">
        {logoutForm}
      </div>
    </aside>
  );
}
