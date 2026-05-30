import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Printer, FileText } from "lucide-react";
import { toast } from "sonner";
import { fetchAll } from "@/lib/pelanggaran";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/laporan")({
  head: () => ({ meta: [{ title: "Laporan · Qism Ibadah OSBA" }] }),
  component: LaporanPage,
});

function LaporanPage() {
  const { data = [] } = useQuery({ queryKey: ["pelanggaran"], queryFn: fetchAll });
  const printRef = useRef<HTMLDivElement>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [kelas, setKelas] = useState("all");

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (d.tanggal < from || d.tanggal > to) return false;
      if (kelas !== "all" && d.kelas !== Number(kelas)) return false;
      return true;
    });
  }, [data, from, to, kelas]);

  const summary = useMemo(() => {
    const byJenis = new Map<string, number>();
    const byKelas = new Map<number, number>();
    const byNama = new Map<string, number>();
    filtered.forEach((d) => {
      byJenis.set(d.jenis, (byJenis.get(d.jenis) ?? 0) + 1);
      byKelas.set(d.kelas, (byKelas.get(d.kelas) ?? 0) + 1);
      byNama.set(d.nama, (byNama.get(d.nama) ?? 0) + 1);
    });
    return {
      byJenis: [...byJenis.entries()].sort((a, b) => b[1] - a[1]),
      byKelas: [...byKelas.entries()].sort((a, b) => a[0] - b[0]),
      topNama: [...byNama.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    };
  }, [filtered]);

  const handlePrint = () => {
    if (filtered.length === 0) {
      toast.error("Tidak ada data untuk dicetak");
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Laporan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cetak laporan mukholif untuk pengawas</p>
      </div>

      <Card className="no-print">
        <CardHeader><CardTitle>Filter Laporan</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Dari Tanggal</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Sampai Tanggal</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Kelas</Label>
            <Select value={kelas} onValueChange={setKelas}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kelas</SelectItem>
                {[7, 8, 9, 10, 11].map((k) => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handlePrint} className="w-full">
              <Printer className="mr-2 h-4 w-4" /> Cetak Laporan
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3 no-print">
        <Card>
          <CardHeader><CardTitle className="text-base">Total</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{filtered.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">pelanggaran pada periode</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Jenis</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {summary.byJenis.slice(0, 4).map(([j, n]) => (
              <div key={j} className="flex justify-between text-sm">
                <span>{j}</span><span className="font-medium">{n}</span>
              </div>
            ))}
            {summary.byJenis.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Nama</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {summary.topNama.slice(0, 4).map(([n, c]) => (
              <div key={n} className="flex justify-between text-sm">
                <span className="truncate">{n}</span><span className="font-medium">{c}</span>
              </div>
            ))}
            {summary.topNama.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          </CardContent>
        </Card>
      </div>

      {/* Printable content */}
      <div ref={printRef} className="print-content space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold uppercase tracking-wide">Laporan Mukholif</h2>
          <p className="text-sm font-medium">Qism Ibadah OSBA</p>
          <p className="mt-2 text-sm">
            Periode: {format(parseISO(from), "d MMM yyyy", { locale: localeId })} – {format(parseISO(to), "d MMM yyyy", { locale: localeId })} · {kelas === "all" ? "Semua Kelas" : `Kelas ${kelas}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase">Ringkasan per Jenis</h3>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-black px-3 py-2 text-left">Jenis</th>
                  <th className="border border-black px-3 py-2 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {summary.byJenis.map(([j, n]) => (
                  <tr key={j}>
                    <td className="border border-black px-3 py-1.5">{j}</td>
                    <td className="border border-black px-3 py-1.5 text-right">{n}</td>
                  </tr>
                ))}
                {summary.byJenis.length === 0 && (
                  <tr><td className="border border-black px-3 py-1.5 text-center" colSpan={2}>—</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase">Ringkasan per Kelas</h3>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-black px-3 py-2 text-left">Kelas</th>
                  <th className="border border-black px-3 py-2 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {summary.byKelas.map(([k, n]) => (
                  <tr key={k}>
                    <td className="border border-black px-3 py-1.5">Kelas {k}</td>
                    <td className="border border-black px-3 py-1.5 text-right">{n}</td>
                  </tr>
                ))}
                {summary.byKelas.length === 0 && (
                  <tr><td className="border border-black px-3 py-1.5 text-center" colSpan={2}>—</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold uppercase">Daftar Pelanggar</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-black text-white">
                <th className="border border-black px-3 py-2 text-left">No</th>
                <th className="border border-black px-3 py-2 text-left">Tanggal</th>
                <th className="border border-black px-3 py-2 text-left">Nama</th>
                <th className="border border-black px-3 py-2 text-left">Kelas</th>
                <th className="border border-black px-3 py-2 text-left">Jenis</th>
                <th className="border border-black px-3 py-2 text-left">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id}>
                  <td className="border border-black px-3 py-1.5">{i + 1}</td>
                  <td className="border border-black px-3 py-1.5 whitespace-nowrap">{format(parseISO(d.tanggal), "dd/MM/yyyy")}</td>
                  <td className="border border-black px-3 py-1.5">{d.nama}</td>
                  <td className="border border-black px-3 py-1.5">{d.kelas}</td>
                  <td className="border border-black px-3 py-1.5">{d.jenis}</td>
                  <td className="border border-black px-3 py-1.5">{d.catatan ?? "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td className="border border-black px-3 py-1.5 text-center" colSpan={6}>Tidak ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between pt-8 text-sm">
          <p>Dicetak: {format(new Date(), "d MMM yyyy HH:mm", { locale: localeId })}</p>
          <div className="text-center">
            <p>Mengetahui,</p>
            <p className="mt-1">Pengawas Qism Ibadah</p>
            <p className="mt-8">( ............................. )</p>
          </div>
        </div>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Pratinjau Data</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada data pada periode ini</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Tanggal</th>
                    <th className="py-2 pr-4">Nama</th>
                    <th className="py-2 pr-4">Kelas</th>
                    <th className="py-2 pr-4">Jenis</th>
                    <th className="py-2">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">{format(parseISO(d.tanggal), "d MMM yyyy", { locale: localeId })}</td>
                      <td className="py-2 pr-4 font-medium">{d.nama}</td>
                      <td className="py-2 pr-4">{d.kelas}</td>
                      <td className="py-2 pr-4">{d.jenis}</td>
                      <td className="py-2 max-w-xs truncate text-muted-foreground">{d.catatan ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 20 && (
                <p className="mt-3 text-center text-xs text-muted-foreground">+{filtered.length - 20} baris lainnya akan ikut dicetak</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
