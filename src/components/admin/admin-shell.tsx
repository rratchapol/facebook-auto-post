import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

type NavigationItem =
  | { href: Route; label: string; disabled?: false }
  | { label: string; disabled: true };

const navigation: NavigationItem[] = [
  { href: "/dashboard", label: "ภาพรวม" },
  { href: "/sources", label: "แหล่งข่าว" },
  { href: "/news-stack", label: "News Stack" },
  { label: "Composer", disabled: true },
  { label: "คิวโพสต์", disabled: true },
];

export function AdminShell({
  children,
  email,
  role,
}: {
  children: ReactNode;
  email: string | null;
  role: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--canvas)] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-b border-[var(--line)] bg-[#102542] px-5 py-6 text-white lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="mb-9">
          <p className="text-xs font-bold tracking-[0.18em] text-[#8fc7ff]">SPORTS NEWS</p>
          <h1 className="mt-1 text-xl font-semibold">Editorial Admin</h1>
          <p className="mt-2 text-sm text-[#c3d0df]">ข่าวกีฬาไทยที่เชื่อถือได้</p>
        </div>

        <nav aria-label="เมนูหลัก" className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
          {navigation.map((item) =>
            item.disabled ? (
              <span
                className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-[#8295ac]"
                key={item.label}
                title="จะเปิดใน Slice ถัดไป"
              >
                {item.label}
              </span>
            ) : (
              <Link
                className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-[#e5edf6] transition hover:bg-[#1a3960]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="mt-8 border-t border-[#2a4565] pt-4 text-xs text-[#b8c8d9]">
          <p className="truncate">{email ?? "ไม่ระบุอีเมล"}</p>
          <p className="mt-1 capitalize">สิทธิ์: {role}</p>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
