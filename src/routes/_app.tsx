import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, ClipboardList, FileText, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pendataan", label: "Pendataan", icon: ClipboardList },
  { to: "/laporan", label: "Laporan", icon: FileText },
] as const;

function AppLayout() {
  const { authed, ready, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !authed) navigate({ to: "/", replace: true });
  }, [ready, authed, navigate]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (!ready || !authed) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Memuat…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Logo size="sm" />
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-md border p-2"
          aria-label="Menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-sidebar p-5 transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-8">
            <Logo />
          </div>
          <nav className="space-y-1">
            {nav.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="absolute inset-x-5 bottom-5">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => { logout(); navigate({ to: "/" }); }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Keluar
            </Button>
          </div>
        </aside>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
