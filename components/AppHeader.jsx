"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AuthStatus from "./AuthStatus";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/writing", label: "Writing" },
  { href: "/listing", label: "Listing" },
  { href: "/studying", label: "Studying" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="fixed top-0 inset-x-0 z-20 border-b bg-white/80 backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="font-semibold text-sm"
          onClick={() => setOpen(false)}
        >
          AI Writing Lab
        </Link>

        <div className="flex items-center gap-4">
          {/* Desktop nav */}
          <nav className="hidden sm:flex gap-3 text-xs sm:text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "px-2 py-1 rounded transition-colors",
                  isActive(item.href)
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden sm:block">
            <AuthStatus />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="sm:hidden text-xs px-2 py-1 border rounded"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? "닫기" : "메뉴"}
          </button>
        </div>
      </div>

      {/* Mobile expanded menu */}
      {open && (
        <nav className="sm:hidden border-t bg-white">
          <div className="max-w-3xl mx-auto px-4 py-2 flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={[
                  "px-2 py-1 rounded",
                  isActive(item.href)
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t mt-2">
              <AuthStatus />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
