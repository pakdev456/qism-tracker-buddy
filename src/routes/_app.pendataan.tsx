import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchAll, JENIS_OPTIONS, type Pelanggaran } from "@/lib/pelanggaran";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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

interface FormState {
  tanggal: string;
  nama: string;
  kelas: number;
  jenis: string;
  jenisLainnya: string;
  catatan: string;
}

function emptyForm(): FormState {
  return {
    tanggal: format(new Date(), "yyyy-MM-dd"),
    nama: "",
    kelas: 7,
    jenis: "Mashol",
    jenisLainnya: "",
    catatan: "",
  };
}

function PendataanPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["pelanggaran"], queryFn: fetchAll });

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Pelanggaran | null>(null);
  const [deleting, setDeleting] = useState<Pelanggaran | null>(null);

  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterJenis, setFilterJenis] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (filterKelas !== "all" && d.kelas !== Number(filterKelas)) return false;
      if (filterJenis !== "all" && d.jenis !== filterJenis) return false;
      if (search && !d.nama.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, filterKelas, filterJenis, search]);

  const create = useMutation({
    mutationFn: async (f: FormState) => {
      const jenis = f.jenis === "Lainnya" ? (f.jenisLainnya.trim() || "Lainnya") : f.jenis;
      const { error } = await supabase.from("pelanggaran").insert({
        tanggal: f.tanggal,
        nama: f.nama.trim(),
        kelas: f.kelas,
        jenis,
        catatan: f.catatan.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pelanggaran"] });
      toast.success("Data pelanggar ditambahkan");
      setForm(emptyForm());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: FormState }) => {
      const jenis = f.jenis === "Lainnya" ? (f.jenisLainnya.trim() || "Lainnya") : f.jenis;
      const { error } = await supabase.from("pelanggaran").update({
        tanggal: f.tanggal,
        nama: f.nama.trim(),
        kelas: f.kelas,
        jenis,
        catatan: f.catatan.trim() || null,
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) return toast.error("Nama wajib diisi");
    create.mutate(form);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pendataan Mukholif</h1>
        <p className="mt-1 text-sm text-muted-foreground">Catat dan kelola data pelanggar</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Tambah Pelanggar</CardTitle></CardHeader>
        <CardContent>
          <FormFields form={form} setForm={setForm} onSubmit={onSubmit} submitting={create.isPending} submitLabel="Simpan" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pelanggar</CardTitle>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama…"
                className="pl-9"
              />
            </div>
            <Select value={filterKelas} onValueChange={setFilterKelas}>
              <SelectTrigger><SelectValue placeholder="Filter kelas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kelas</SelectItem>
                {KELAS_OPTIONS.map((k) => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterJenis} onValueChange={setFilterJenis}>
              <SelectTrigger><SelectValue placeholder="Filter jenis" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua jenis</SelectItem>
                {Array.from(new Set(data.map((d) => d.jenis))).map((j) =>
                  <SelectItem key={j} value={j}>{j}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Memuat…</p> :
            filtered.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada data</p> :
              (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="py-3 pr-4">Tanggal</th>
                        <th className="py-3 pr-4">Nama</th>
                        <th className="py-3 pr-4">Kelas</th>
                        <th className="py-3 pr-4">Jenis</th>
                        <th className="py-3 pr-4">Catatan</th>
                        <th className="py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="py-3 pr-4 whitespace-nowrap">{format(parseISO(p.tanggal), "d MMM yyyy", { locale: localeId })}</td>
                          <td className="py-3 pr-4 font-medium">{p.nama}</td>
                          <td className="py-3 pr-4">{p.kelas}</td>
                          <td className="py-3 pr-4"><Badge variant="secondary">{p.jenis}</Badge></td>
                          <td className="py-3 pr-4 max-w-xs truncate text-muted-foreground">{p.catatan ?? "—"}</td>
                          <td className="py-3 text-right">
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
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Pelanggar</DialogTitle></DialogHeader>
          {editing && (
            <EditForm
              initial={editing}
              onCancel={() => setEditing(null)}
              onSave={(f) => update.mutate({ id: editing.id, f })}
              saving={update.isPending}
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

function FormFields({
  form, setForm, onSubmit, submitting, submitLabel,
}: {
  form: FormState; setForm: (f: FormState) => void;
  onSubmit: (e: React.FormEvent) => void; submitting: boolean; submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Tanggal</Label>
        <Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label>Nama Pelanggar</Label>
        <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap" required />
      </div>
      <div className="space-y-2">
        <Label>Kelas</Label>
        <Select value={String(form.kelas)} onValueChange={(v) => setForm({ ...form, kelas: Number(v) })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {KELAS_OPTIONS.map((k) => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Jenis Pelanggaran</Label>
        <Select value={form.jenis} onValueChange={(v) => setForm({ ...form, jenis: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {JENIS_OPTIONS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {form.jenis === "Lainnya" && (
        <div className="space-y-2 md:col-span-2">
          <Label>Jenis Lainnya</Label>
          <Input value={form.jenisLainnya} onChange={(e) => setForm({ ...form, jenisLainnya: e.target.value })} placeholder="Sebutkan jenis pelanggaran" />
        </div>
      )}
      <div className="space-y-2 md:col-span-2">
        <Label>Catatan</Label>
        <Textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} placeholder="Catatan tambahan (opsional)" rows={3} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={submitting} className="w-full md:w-auto">
          {submitting ? "Menyimpan…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function EditForm({
  initial, onCancel, onSave, saving,
}: {
  initial: Pelanggaran;
  onCancel: () => void;
  onSave: (f: FormState) => void;
  saving: boolean;
}) {
  const known = (JENIS_OPTIONS as string[]).includes(initial.jenis);
  const [form, setForm] = useState<FormState>({
    tanggal: initial.tanggal,
    nama: initial.nama,
    kelas: initial.kelas,
    jenis: known ? initial.jenis : "Lainnya",
    jenisLainnya: known ? "" : initial.jenis,
    catatan: initial.catatan ?? "",
  });

  return (
    <>
      <FormFields
        form={form}
        setForm={setForm}
        onSubmit={(e) => { e.preventDefault(); onSave(form); }}
        submitting={saving}
        submitLabel="Simpan perubahan"
      />
      <DialogFooter className="mt-2">
        <Button variant="outline" onClick={onCancel}>Tutup</Button>
      </DialogFooter>
    </>
  );
}
