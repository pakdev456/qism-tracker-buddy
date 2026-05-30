import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import { fetchAll } from "@/lib/pelanggaran";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/peringkat")({
  head: () => ({ meta: [{ title: "Peringkat · Qism Ibadah OSBA" }] }),
  component: PeringkatPage,
});

function PeringkatPage() {
  const { data = [] } = useQuery({ queryKey: ["pelanggaran"], queryFn: fetchAll });
  const [kelas, setKelas] = useState("all");

  const rows = useMemo(() => {
    const src = kelas === "all" ? data : data.filter((d) => d.kelas === Number(kelas));
    const map = new Map<string, { nama: string; total: number; kelas: number; jenis: Set<string> }>();
    src.forEach((d) => {
      const cur = map.get(d.nama) ?? { nama: d.nama, total: 0, kelas: d.kelas, jenis: new Set() };
      cur.total += 1;
      cur.jenis.add(d.jenis);
      map.set(d.nama, cur);
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [data, kelas]);

  const max = rows[0]?.total ?? 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Peringkat Mukholif</h1>
          <p className="mt-1 text-sm text-muted-foreground">Daftar pelanggar terbanyak dari waktu ke waktu</p>
        </div>
        <Select value={kelas} onValueChange={setKelas}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kelas</SelectItem>
            {[7, 8, 9, 10, 11].map((k) => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Podium */}
      {rows.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {rows.slice(0, 3).map((r, i) => (
            <Card key={r.nama} className={i === 0 ? "border-foreground border-2" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${i === 0 ? "bg-foreground text-background" : "bg-muted"}`}>
                    {i === 0 ? <Trophy className="h-6 w-6" /> : <Medal className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Peringkat {i + 1}</p>
                    <p className="text-lg font-bold">{r.nama}</p>
                    <p className="text-xs text-muted-foreground">Kelas {r.kelas} · {r.total} pelanggaran</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Seluruh Peringkat</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Belum ada data</p>
          ) : (
            <ol className="space-y-3">
              {rows.map((r, i) => (
                <li key={r.nama} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">{i + 1}</span>
                      <div>
                        <p className="font-medium">{r.nama}</p>
                        <p className="text-xs text-muted-foreground">Kelas {r.kelas}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{r.total}</p>
                      <p className="text-xs text-muted-foreground">pelanggaran</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-foreground" style={{ width: `${(r.total / max) * 100}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {[...r.jenis].map((j) => <Badge key={j} variant="secondary">{j}</Badge>)}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
