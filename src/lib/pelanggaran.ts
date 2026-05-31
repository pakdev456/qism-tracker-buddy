import { supabase } from "@/integrations/supabase/client";

export type JenisPelanggaran = string;

// Saran cepat untuk jenis "Lainnya"
export const JENIS_OPTIONS: string[] = [
  "senderan ke tiang",
  "Ribut di Masjid",
  "Tidak Pakai Songkok/peci",
  "Tidak Pakai celana syari",
  "lari di masjid",
  "bercanda di masjid",
  "Bercanda Saat Sholat",
  "ngobrol ",
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
