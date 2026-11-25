"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeaderProps = {
  email?: string;
  isAdmin?: boolean;
  showNav?: boolean;
};

export function Header({ email, isAdmin, showNav = true }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const nav = (
    <>
      {showNav ? (
        <>
          <Link
            href="/dashboard"
            className={cn(
              "text-sm font-medium text-[#6B7280] hover:text-[#1F2328]",
              pathname.startsWith("/dashboard") && "text-[#C8102E]",
            )}
          >
            Рабочий стол
          </Link>
          {isAdmin ? (
            <>
              <Link
                href="/admin/leads"
                className={cn(
                  "text-sm font-medium text-[#6B7280] hover:text-[#1F2328]",
                  pathname.startsWith("/admin/leads") && "text-[#C8102E]",
                )}
              >
                Все заявки
              </Link>
              <Link
                href="/admin/operators"
                className={cn(
                  "text-sm font-medium text-[#6B7280] hover:text-[#1F2328]",
                  pathname.startsWith("/admin/operators") && "text-[#C8102E]",
                )}
              >
                Операторы
              </Link>
            </>
          ) : null}
        </>
      ) : (
        <span className="text-sm text-[#6B7280]">Справка</span>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex min-h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 md:gap-6">
          <Link
            href={showNav ? "/dashboard" : "/"}
            className="flex shrink-0 items-center"
          >
            <Logo size="header" priority />
          </Link>
          <nav className="hidden items-center gap-5 md:flex">{nav}</nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {email ? (
            <>
              <span className="max-w-[220px] truncate text-sm text-[#6B7280]">
                {email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                Выход
              </Button>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#1F2328] md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#E5E7EB] bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {nav}
            {email ? (
              <>
                <span className="truncate text-sm text-[#6B7280]">{email}</span>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  Выход
                </Button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
