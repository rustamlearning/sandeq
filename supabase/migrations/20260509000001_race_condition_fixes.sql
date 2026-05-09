-- ============================================================
-- FIX 1: Unique constraint kode live_session yang aktif
-- ============================================================
ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS kode text;

CREATE UNIQUE INDEX IF NOT EXISTS live_sessions_kode_active
  ON public.live_sessions(kode)
  WHERE status != 'finished';

-- ============================================================
-- FIX 2: Unique constraint kuis_attempts — 1 attempt aktif per siswa per kuis
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS kuis_attempts_one_active
  ON public.kuis_attempts(kuis_id, user_id)
  WHERE selesai = false;

-- ============================================================
-- FIX 3: Function generate kode unik di server (bukan client)
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_live_kode()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_kode text;
  exists boolean;
BEGIN
  LOOP
    new_kode := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
    SELECT EXISTS(
      SELECT 1 FROM live_sessions
      WHERE kode = new_kode AND status != 'finished'
    ) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN new_kode;
END;
$$;

-- ============================================================
-- FIX 4: Function buat sesi live secara atomic
-- ============================================================
CREATE OR REPLACE FUNCTION public.buat_live_session(
  p_guru_id uuid,
  p_kuis_id uuid,
  p_kelas_id uuid
)
RETURNS TABLE(id uuid, kode text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kode text;
  v_id uuid;
BEGIN
  v_kode := generate_live_kode();
  INSERT INTO live_sessions(guru_id, kuis_id, kelas_id, kode, status)
  VALUES (p_guru_id, p_kuis_id, p_kelas_id, v_kode, 'waiting')
  RETURNING live_sessions.id INTO v_id;

  RETURN QUERY SELECT v_id, v_kode, 'waiting'::text;
END;
$$;

-- ============================================================
-- FIX 5: Function buat attempt secara atomic (cegah double submit)
-- ============================================================
CREATE OR REPLACE FUNCTION public.buat_kuis_attempt(
  p_kuis_id uuid,
  p_user_id uuid
)
RETURNS TABLE(attempt_id uuid, attempt_number int, error_msg text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_attempt int;
  v_count int;
  v_attempt_id uuid;
  v_attempt_number int;
BEGIN
  -- Cek max attempt
  SELECT max_attempt INTO v_max_attempt FROM kuis WHERE id = p_kuis_id;
  IF v_max_attempt IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM kuis_attempts
    WHERE kuis_id = p_kuis_id AND user_id = p_user_id AND selesai = true;
    IF v_count >= v_max_attempt THEN
      RETURN QUERY SELECT NULL::uuid, 0, format('Maksimal %s kali pengerjaan', v_max_attempt);
      RETURN;
    END IF;
  END IF;

  -- Cek apakah sudah ada attempt aktif
  SELECT id INTO v_attempt_id
  FROM kuis_attempts
  WHERE kuis_id = p_kuis_id AND user_id = p_user_id AND selesai = false
  LIMIT 1;

  IF v_attempt_id IS NOT NULL THEN
    -- Return attempt yang sudah ada, jangan buat baru
    SELECT attempt_number INTO v_attempt_number
    FROM kuis_attempts WHERE id = v_attempt_id;
    RETURN QUERY SELECT v_attempt_id, v_attempt_number, NULL::text;
    RETURN;
  END IF;

  -- Buat attempt baru
  SELECT COUNT(*) + 1 INTO v_attempt_number
  FROM kuis_attempts WHERE kuis_id = p_kuis_id AND user_id = p_user_id;

  INSERT INTO kuis_attempts(kuis_id, user_id, attempt_number, started_at, selesai)
  VALUES (p_kuis_id, p_user_id, v_attempt_number, now(), false)
  RETURNING kuis_attempts.id INTO v_attempt_id;

  RETURN QUERY SELECT v_attempt_id, v_attempt_number, NULL::text;
END;
$$;
