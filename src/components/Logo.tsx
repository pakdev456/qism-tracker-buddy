import { Moon } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
  const title = size === "lg" ? "text-xl" : "text-base";
  return (
    <div className="flex items-center gap-3">
      <div
        className={`${dim} flex items-center justify-center rounded-full bg-foreground text-background shadow-[var(--shadow-soft)]`}
        aria-hidden
      >
        <Moon className={`${icon} fill-background`} strokeWidth={2.2} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`${title} font-bold tracking-tight`}>Qism Ibadah</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">OSBA</span>
      </div>
    </div>
  );
}
