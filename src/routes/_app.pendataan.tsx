import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Search, Filter } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchAll, JENIS_OPTIONS, type Pelanggaran } from "@/lib/pelanggaran";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/pendataan")({
  head: () => ({ meta: [{ title: "Pendataan · Qism Ibadah OSBA" }] }),
  component: PendataanPage,
});

const KELAS_OPTIONS = [7, 8, 9, 10, 11];
const JENIS_QUICK = ["Mashol", "Masbuk", "Lainnya"] as const;

interface FormState {
  tanggal: string;
  nama: string;
  kelas: number | null;
  jenis: string;
  jenisLainnya: string;
  catatan: string;
}

function emptyForm(): FormState {
  return {
    tanggal: format(new Date(), "yyyy-MM-dd"),
    nama: "",
    kelas: null,
    jenis: "",
    jenisLainnya: "",
    catatan: "",
  };
}

function PendataanPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["pelanggaran"], queryFn: fetchAll });

  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState<Pelanggaran | null>(null);
  const [deleting, setDeleting] = useState<Pelanggaran | null>(null);

  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (filterKelas !== "all" && d.kelas !== Number(filterKelas)) return false;
      if (search && !d.nama.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, filterKelas, search]);

  const create = useMutation({
    mutationFn: async (f: FormState) => {
      const jenis = f.jenis === "Lainnya" ? (f.jenisLainnya.trim() || "Lainnya") : f.jenis;
      const { error } = await supabase.from("pelanggaran").insert({
        tanggal: f.tanggal, nama: f.nama.trim(), kelas: f.kelas!,
        jenis, catatan: f.catatan.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pelanggaran"] });
      toast.success("Data pelanggar ditambahkan");
      setOpenAdd(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: FormState }) => {
      const jenis = f.jenis === "Lainnya" ? (f.jenisLainnya.trim() || "Lainnya") : f.jenis;
      const { error } = await supabase.from("pelanggaran").update({
        tanggal: f.tanggal, nama: f.nama.trim(), kelas: f.kelas!,
        jenis, catatan: f.catatan.trim() || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pelanggaran"] });
      toast.success("Data diperbarui");
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pelanggaran").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pelanggaran"] });
      toast.success("Data dihapus");
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pendataan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola data pelanggar ibadah</p>
        </div>
        <Button onClick={() => setOpenAdd(true)} className="rounded-xl shadow-sm">
          <Plus className="mr-1 h-4 w-4" /> Tambah Pelanggar
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pelanggar…"
            className="h-12 rounded-xl border-border/70 bg-card pl-11 shadow-sm"
          />
        </div>
        <Select value={filterKelas} onValueChange={setFilterKelas}>
          <SelectTrigger className="h-12 rounded-xl border-border/70 bg-card shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Semua Kelas" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {KELAS_OPTIONS.map((k) => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Memuat…</p>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base text-muted-foreground">Belum ada data</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Tambah pelanggar baru untuk memulai</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-2 py-4">Nama</th>
                  <th className="px-2 py-4">Kelas</th>
                  <th className="px-2 py-4">Jenis</th>
                  <th className="px-2 py-4">Catatan</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="whitespace-nowrap px-6 py-3">{format(parseISO(p.tanggal), "d MMM yyyy", { locale: localeId })}</td>
                    <td className="px-2 py-3 font-medium">{p.nama}</td>
                    <td className="px-2 py-3">{p.kelas}</td>
                    <td className="px-2 py-3"><Badge variant="secondary">{p.jenis}</Badge></td>
                    <td className="max-w-xs truncate px-2 py-3 text-muted-foreground">{p.catatan ?? "—"}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(p)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleting(p)} aria-label="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle>Tambah Pelanggar</DialogTitle></DialogHeader>
          <PelanggarForm
            initial={emptyForm()}
            onCancel={() => setOpenAdd(false)}
            onSave={(f) => create.mutate(f)}
            saving={create.isPending}
            submitLabel="Simpan"
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle>Edit Pelanggar</DialogTitle></DialogHeader>
          {editing && (
            <PelanggarForm
              initial={fromPelanggaran(editing)}
              onCancel={() => setEditing(null)}
              onSave={(f) => update.mutate({ id: editing.id, f })}
              saving={update.isPending}
              submitLabel="Simpan perubahan"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data?</AlertDialogTitle>
            <AlertDialogDescription>
              Data pelanggar <span className="font-medium">{deleting?.nama}</span> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove.mutate(deleting.id)}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function fromPelanggaran(p: Pelanggaran): FormState {
  const known = (JENIS_QUICK as readonly string[]).includes(p.jenis);
  return {
    tanggal: p.tanggal,
    nama: p.nama,
    kelas: p.kelas,
    jenis: known ? p.jenis : "Lainnya",
    jenisLainnya: known ? "" : p.jenis,
    catatan: p.catatan ?? "",
  };
}

function PelanggarForm({
  initial, onCancel, onSave, saving, submitLabel,
}: {
  initial: FormState;
  onCancel: () => void;
  onSave: (f: FormState) => void;
  saving: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [showLainnyaList, setShowLainnyaList] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) return toast.error("Nama wajib diisi");
    if (form.kelas === null) return toast.error("Kelas wajib dipilih");
    if (!form.jenis) return toast.error("Jenis pelanggaran wajib dipilih");
    onSave(form);
  };

  const otherJenis = (JENIS_OPTIONS as readonly string[]).filter(
    (j) => !(JENIS_QUICK as readonly string[]).includes(j),
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tanggal</Label>
          <Input
            type="date"
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            className="h-11 rounded-xl"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Kelas</Label>
          <Select
            value={form.kelas === null ? "" : String(form.kelas)}
            onValueChange={(v) => setForm({ ...form, kelas: Number(v) })}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
              {KELAS_OPTIONS.map((k) => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Nama Pelanggar</Label>
        <Input
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          placeholder="Masukkan nama pelanggar"
          className="h-11 rounded-xl"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Jenis Pelanggaran</Label>
        <div className="grid grid-cols-3 gap-2">
          {JENIS_QUICK.map((j) => {
            const active = form.jenis === j || (j === "Lainnya" && form.jenis && !(JENIS_QUICK as readonly string[]).slice(0, 2).includes(form.jenis));
            return (
              <button
                key={j}
                type="button"
                onClick={() => {
                  if (j === "Lainnya") {
                    setShowLainnyaList((v) => !v);
                    setForm({ ...form, jenis: "Lainnya" });
                  } else {
                    setShowLainnyaList(false);
                    setForm({ ...form, jenis: j, jenisLainnya: "" });
                  }
                }}
                className={cn(
                  "h-11 rounded-xl border text-sm font-medium transition",
                  active
                    ? "border-foreground bg-foreground text-background shadow"
                    : "border-border bg-card hover:border-foreground/40",
                )}
              >
                {j}
              </button>
            );
          })}
        </div>
        {form.jenis === "Lainnya" && (
          <div className="space-y-2 pt-2">
            {showLainnyaList && otherJenis.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {otherJenis.map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setForm({ ...form, jenisLainnya: j })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition",
                      form.jenisLainnya === j
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card hover:border-foreground/40",
                    )}
                  >
                    {j}
                  </button>
                ))}
              </div>
            )}
            <Input
              value={form.jenisLainnya}
              onChange={(e) => setForm({ ...form, jenisLainnya: e.target.value })}
              placeholder="Sebutkan jenis pelanggaran"
              className="h-11 rounded-xl"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Catatan</Label>
        <Textarea
          value={form.catatan}
          onChange={(e) => setForm({ ...form, catatan: e.target.value })}
          placeholder="Tambahkan catatan (opsional)"
          rows={3}
          className="rounded-xl"
        />
      </div>

      <DialogFooter className="!justify-between gap-2 pt-2 sm:!justify-between">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Batal
        </Button>
        <Button type="submit" disabled={saving} className="rounded-xl">
          {saving ? "Menyimpan…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
