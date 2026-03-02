"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, Inbox, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Spend Radar
        </Link>
        <div className="flex gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100",
                pathname.startsWith(href)
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
