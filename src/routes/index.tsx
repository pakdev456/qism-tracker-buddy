import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masuk · Qism Ibadah OSBA" },
      { name: "description", content: "Halaman masuk pendataan Qism Ibadah OSBA." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { authed, login, ready } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && authed) navigate({ to: "/dashboard", replace: true });
  }, [ready, authed, navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = login(username, password);
    setSubmitting(false);
    if (ok) {
      toast.success("Selamat datang!");
      navigate({ to: "/dashboard", replace: true });
    } else {
      toast.error("Username atau password salah");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Logo top-left */}
      <header className="flex items-center px-6 py-5 md:px-10">
        <Logo />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex justify-center">
              <Logo size="lg" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Masuk</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pendataan mukholif Qism Ibadah OSBA
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-2xl border bg-card p-7 shadow-[var(--shadow-elevated)]"
          >
            <div className="space-y-2">
              <Label htmlFor="u">Username</Label>
              <Input
                id="u"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="masukkan username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p">Password</Label>
              <div className="relative">
                <Input
                  id="p"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="masukkan password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Sembunyikan password" : "Lihat password"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              <LogIn className="mr-2 h-4 w-4" />
              Masuk
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Qism Ibadah OSBA
          </p>
        </div>
      </main>
    </div>
  );
}
