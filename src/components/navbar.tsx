"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, Inbox, BarChart3, Settings, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  if (pathname === "/login") return null;

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/login";
  }

  return (
    <nav className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 sm:gap-6 px-4">
        <Link href="/" className="text-base sm:text-lg font-bold tracking-tight shrink-0">
          Spend Radar
        </Link>
        <div className="flex gap-0.5 sm:gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 sm:px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                pathname.startsWith(href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-muted-foreground hover:text-foreground px-2 sm:px-3"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
            ) : (
              <LogOut className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">
              {signingOut ? "Signing out..." : "Sign out"}
            </span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
