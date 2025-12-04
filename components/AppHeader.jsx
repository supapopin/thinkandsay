"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/writing", label: "Writing" },
  { href: "/listing", label: "Listing" },
  { href: "/studying", label: "Studying" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  function isActive(href) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    }
    loadUser();

    // 유저 상태 변화 리스너
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setOpen(false);
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

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-4">
          <nav className="flex gap-3 text-xs sm:text-sm">
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

          {/* Auth Section */}
          {user ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-3 py-1 border rounded text-xs text-gray-700 hover:bg-gray-100"
            >
              Login
            </Link>
          )}
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

      {/* Mobile Navigation */}
      {open && (
        <nav className="sm:hidden border-t bg-white">
          <div className="max-w-3xl mx-auto px-4 py-2 flex flex-col gap-2 text-sm">
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

            <div className="border-t pt-2 mt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <span className="text-gray-600 text-xs">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-2 py-1 border rounded text-xs text-gray-700 hover:bg-gray-100 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-2 py-1 border rounded text-xs text-gray-700 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
