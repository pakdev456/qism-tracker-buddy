import { supabase } from "@/integrations/supabase/client";

export type JenisPelanggaran = "Mashol" | "Masbuk" | "Lainnya";

export const JENIS_OPTIONS: JenisPelanggaran[] = [
  "Mashol",
  "Masbuk",
  "Lainnya",
];

export interface Pelanggaran {
  id: string;
  tanggal: string;
  nama: string;
  kelas: number;
  jenis: string;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchAll(): Promise<Pelanggaran[]> {
  const { data, error } = await supabase
    .from("pelanggaran")
    .select("*")
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as Pelanggaran[];
}
