import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileText } from "lucide-react";
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

  const exportPdf = () => {
    if (filtered.length === 0) return toast.error("Tidak ada data untuk diekspor");

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const margin = 40;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LAPORAN MUKHOLIF", W / 2, 50, { align: "center" });
    doc.setFontSize(11);
    doc.text("Qism Ibadah OSBA", W / 2, 68, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const periode = `Periode: ${format(parseISO(from), "d MMM yyyy", { locale: localeId })} – ${format(parseISO(to), "d MMM yyyy", { locale: localeId })}`;
    const kelasLabel = kelas === "all" ? "Semua Kelas" : `Kelas ${kelas}`;
    doc.text(periode, margin, 100);
    doc.text(kelasLabel, W - margin, 100, { align: "right" });

    doc.setDrawColor(0);
    doc.line(margin, 110, W - margin, 110);

    // Ringkasan
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Total Pelanggaran: ${filtered.length}`, margin, 130);

    autoTable(doc, {
      startY: 145,
      head: [["No", "Tanggal", "Nama", "Kelas", "Jenis", "Catatan"]],
      body: filtered.map((d, i) => [
        i + 1,
        format(parseISO(d.tanggal), "dd/MM/yyyy"),
        d.nama,
        d.kelas,
        d.jenis,
        d.catatan ?? "-",
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [20, 20, 20], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      theme: "grid",
      margin: { left: margin, right: margin },
    });

    // Ringkasan tables
    const afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan per Jenis", margin, afterY);
    autoTable(doc, {
      startY: afterY + 8,
      head: [["Jenis", "Jumlah"]],
      body: summary.byJenis.map(([j, n]) => [j, n]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 20, 20], textColor: 255 },
      theme: "grid",
      margin: { left: margin, right: W / 2 + 10 },
      tableWidth: W / 2 - margin - 10,
    });
    autoTable(doc, {
      startY: afterY + 8,
      head: [["Kelas", "Jumlah"]],
      body: summary.byKelas.map(([k, n]) => [`Kelas ${k}`, n]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 20, 20], textColor: 255 },
      theme: "grid",
      margin: { left: W / 2 + 10, right: margin },
      tableWidth: W / 2 - margin - 10,
    });

    // Footer signature
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      const H = doc.internal.pageSize.getHeight();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Halaman ${i} dari ${pages}`, W / 2, H - 20, { align: "center" });
      doc.text(`Dicetak: ${format(new Date(), "d MMM yyyy HH:mm", { locale: localeId })}`, margin, H - 20);
      doc.setTextColor(0);
    }

    // Signature on last page
    doc.setPage(pages);
    const H = doc.internal.pageSize.getHeight();
    doc.setFontSize(10);
    doc.text("Mengetahui,", W - margin - 160, H - 100);
    doc.text("Pengawas Qism Ibadah", W - margin - 160, H - 88);
    doc.text("( ............................. )", W - margin - 160, H - 50);

    doc.save(`laporan-mukholif-${from}_${to}.pdf`);
    toast.success("Laporan PDF berhasil diunduh");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Laporan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ekspor laporan mukholif untuk pengawas</p>
      </div>

      <Card>
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
            <Button onClick={exportPdf} className="w-full">
              <Download className="mr-2 h-4 w-4" /> Ekspor PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
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

      <Card>
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
                <p className="mt-3 text-center text-xs text-muted-foreground">+{filtered.length - 20} baris lainnya akan ikut diekspor</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
