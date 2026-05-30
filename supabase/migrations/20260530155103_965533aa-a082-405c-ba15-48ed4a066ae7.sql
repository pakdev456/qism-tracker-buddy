
CREATE TABLE public.pelanggaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  nama text NOT NULL,
  kelas smallint NOT NULL CHECK (kelas BETWEEN 7 AND 11),
  jenis text NOT NULL,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pelanggaran_tanggal_idx ON public.pelanggaran (tanggal DESC);
CREATE INDEX pelanggaran_nama_idx ON public.pelanggaran (nama);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pelanggaran TO anon, authenticated;
GRANT ALL ON public.pelanggaran TO service_role;

ALTER TABLE public.pelanggaran ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pelanggaran" ON public.pelanggaran FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert pelanggaran" ON public.pelanggaran FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update pelanggaran" ON public.pelanggaran FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete pelanggaran" ON public.pelanggaran FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER pelanggaran_set_updated_at
BEFORE UPDATE ON public.pelanggaran
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
