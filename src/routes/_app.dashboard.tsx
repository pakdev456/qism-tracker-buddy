import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAll } from "@/lib/pelanggaran";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, parseISO, subDays, isAfter } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Qism Ibadah OSBA" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data = [], isLoading } = useQuery({ queryKey: ["pelanggaran"], queryFn: fetchAll });

  const total = data.length;
  const last7 = data.filter((d) => isAfter(parseISO(d.tanggal), subDays(new Date(), 7))).length;

  const counts = new Map<string, number>();
  data.forEach((d) => counts.set(d.nama, (counts.get(d.nama) ?? 0) + 1));
  const topList = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const top = topList[0];

  const last = data[0];

  const byJenis = new Map<string, number>();
  data.forEach((d) => byJenis.set(d.jenis, (byJenis.get(d.jenis) ?? 0) + 1));
  const jenisData = [...byJenis.entries()].map(([name, value]) => ({ name, value }));

  const byKelas = new Map<number, number>();
  data.forEach((d) => byKelas.set(d.kelas, (byKelas.get(d.kelas) ?? 0) + 1));
  const kelasData = [7, 8, 9, 10, 11].map((k) => ({ kelas: `Kelas ${k}`, total: byKelas.get(k) ?? 0 }));

  // last 14 days trend
  const trend: { date: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const key = format(day, "yyyy-MM-dd");
    trend.push({
      date: format(day, "d MMM", { locale: localeId }),
      total: data.filter((d) => d.tanggal === key).length,
    });
  }

  const SHADES = ["oklch(0.12 0 0)", "oklch(0.32 0 0)", "oklch(0.5 0 0)", "oklch(0.68 0 0)", "oklch(0.82 0 0)"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ringkasan statistik mukholif</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat icon={AlertTriangle} label="Total Mukholif" value={total} />
        <Stat icon={Clock} label="7 Hari Terakhir" value={last7} />
        <Stat icon={Users} label="Mukholif Terbanyak" value={top ? top[0] : "—"} sub={top ? `${top[1]} kali` : undefined} />
        <Stat
          icon={TrendingUp}
          label="Mukholif Terakhir"
          value={last ? last.nama : "—"}
          sub={last ? `${format(parseISO(last.tanggal), "d MMM yyyy", { locale: localeId })} · ${last.jenis}` : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tren 14 Hari Terakhir</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "oklch(0.95 0 0)" }} />
                <Bar dataKey="total" fill="oklch(0.15 0 0)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Distribusi Per Jenis</CardTitle></CardHeader>
          <CardContent className="h-72">
            {jenisData.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={jenisData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
                    {jenisData.map((_, i) => <Cell key={i} fill={SHADES[i % SHADES.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Per Kelas</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={kelasData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="kelas" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "oklch(0.95 0 0)" }} />
                <Bar dataKey="total" fill="oklch(0.2 0 0)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>5 Mukholif Terbanyak</CardTitle></CardHeader>
        <CardContent>
          {topList.length === 0 ? <Empty /> : (
            <ol className="space-y-2">
              {topList.map(([nama, n], i) => (
                <li key={nama} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                      {i + 1}
                    </span>
                    <span className="font-medium">{nama}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{n} kali</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Memuat data…</p>}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string | number; sub?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 truncate text-2xl font-bold">{value}</p>
            {sub && <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="rounded-lg bg-foreground p-2 text-background">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Empty() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data</div>;
}
