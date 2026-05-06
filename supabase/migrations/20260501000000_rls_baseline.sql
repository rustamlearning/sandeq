-- Baseline Row Level Security policies for SANDEQ.
-- This migration documents the intended access model used by the app.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid() and aktif = true
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'
$$;

create or replace function public.is_guru_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('guru', 'admin')
$$;

create or replace function public._sandeq_apply_policy(
  table_name text,
  policy_name text,
  policy_sql text
)
returns void
language plpgsql
as $$
begin
  if to_regclass('public.' || table_name) is null then
    return;
  end if;

  execute format('drop policy if exists %I on public.%I', policy_name, table_name);
  execute policy_sql;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'kelas', 'jadwal', 'materi', 'kuis', 'soal',
    'pengerjaan', 'nilai', 'absensi', 'pengumuman', 'forum',
    'progress_materi', 'mastery_progress', 'embedded_quiz_attempts',
    'tutor_sessions', 'tutor_messages', 'badges', 'user_badges'
  ]
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
    end if;
  end loop;
end $$;

select public._sandeq_apply_policy(
  'users',
  'sandeq_users_select_authenticated',
  'create policy "sandeq_users_select_authenticated" on public.users
   for select to authenticated
   using (
     public.is_admin()
     or id = auth.uid()
     or role in (''guru'', ''siswa'')
   )'
);

select public._sandeq_apply_policy(
  'users',
  'sandeq_users_update_self',
  'create policy "sandeq_users_update_self" on public.users
   for update to authenticated
   using (id = auth.uid())
   with check (id = auth.uid())'
);

select public._sandeq_apply_policy(
  'users',
  'sandeq_users_admin_all',
  'create policy "sandeq_users_admin_all" on public.users
   for all to authenticated
   using (public.is_admin())
   with check (public.is_admin())'
);

select public._sandeq_apply_policy(
  'kelas',
  'sandeq_kelas_read_authenticated',
  'create policy "sandeq_kelas_read_authenticated" on public.kelas
   for select to authenticated using (true)'
);

select public._sandeq_apply_policy(
  'kelas',
  'sandeq_kelas_admin_write',
  'create policy "sandeq_kelas_admin_write" on public.kelas
   for all to authenticated
   using (public.is_admin())
   with check (public.is_admin())'
);

select public._sandeq_apply_policy(
  'jadwal',
  'sandeq_jadwal_read_authenticated',
  'create policy "sandeq_jadwal_read_authenticated" on public.jadwal
   for select to authenticated using (true)'
);

select public._sandeq_apply_policy(
  'jadwal',
  'sandeq_jadwal_admin_write',
  'create policy "sandeq_jadwal_admin_write" on public.jadwal
   for all to authenticated
   using (public.is_admin())
   with check (public.is_admin())'
);

select public._sandeq_apply_policy(
  'materi',
  'sandeq_materi_select_scoped',
  'create policy "sandeq_materi_select_scoped" on public.materi
   for select to authenticated
   using (
     public.is_admin()
     or guru_id = auth.uid()
     or kelas_id in (select kelas_id from public.users where id = auth.uid())
   )'
);

select public._sandeq_apply_policy(
  'materi',
  'sandeq_materi_guru_write',
  'create policy "sandeq_materi_guru_write" on public.materi
   for all to authenticated
   using (public.is_admin() or guru_id = auth.uid())
   with check (public.is_admin() or guru_id = auth.uid())'
);

select public._sandeq_apply_policy(
  'kuis',
  'sandeq_kuis_select_scoped',
  'create policy "sandeq_kuis_select_scoped" on public.kuis
   for select to authenticated
   using (
     public.is_admin()
     or guru_id = auth.uid()
     or (
       is_published = true
       and kelas_id in (select kelas_id from public.users where id = auth.uid())
     )
   )'
);

select public._sandeq_apply_policy(
  'kuis',
  'sandeq_kuis_guru_write',
  'create policy "sandeq_kuis_guru_write" on public.kuis
   for all to authenticated
   using (public.is_admin() or guru_id = auth.uid())
   with check (public.is_admin() or guru_id = auth.uid())'
);

select public._sandeq_apply_policy(
  'soal',
  'sandeq_soal_select_guru_only',
  'create policy "sandeq_soal_select_guru_only" on public.soal
   for select to authenticated
   using (
     public.is_admin()
     or exists (
       select 1 from public.kuis
       where kuis.id = soal.kuis_id and kuis.guru_id = auth.uid()
     )
   )'
);

select public._sandeq_apply_policy(
  'soal',
  'sandeq_soal_guru_write',
  'create policy "sandeq_soal_guru_write" on public.soal
   for all to authenticated
   using (
     public.is_admin()
     or exists (
       select 1 from public.kuis
       where kuis.id = soal.kuis_id and kuis.guru_id = auth.uid()
     )
   )
   with check (
     public.is_admin()
     or exists (
       select 1 from public.kuis
       where kuis.id = soal.kuis_id and kuis.guru_id = auth.uid()
     )
   )'
);

select public._sandeq_apply_policy(
  'pengerjaan',
  'sandeq_pengerjaan_select_scoped',
  'create policy "sandeq_pengerjaan_select_scoped" on public.pengerjaan
   for select to authenticated
   using (
     public.is_admin()
     or siswa_id = auth.uid()
     or exists (
       select 1 from public.kuis
       where kuis.id = pengerjaan.kuis_id and kuis.guru_id = auth.uid()
     )
   )'
);

select public._sandeq_apply_policy(
  'pengerjaan',
  'sandeq_pengerjaan_student_insert',
  'create policy "sandeq_pengerjaan_student_insert" on public.pengerjaan
   for insert to authenticated
   with check (siswa_id = auth.uid())'
);

select public._sandeq_apply_policy(
  'nilai',
  'sandeq_nilai_select_scoped',
  'create policy "sandeq_nilai_select_scoped" on public.nilai
   for select to authenticated
   using (
     public.is_admin()
     or siswa_id = auth.uid()
     or public.current_user_role() = ''guru''
   )'
);

select public._sandeq_apply_policy(
  'nilai',
  'sandeq_nilai_guru_write',
  'create policy "sandeq_nilai_guru_write" on public.nilai
   for all to authenticated
   using (public.is_guru_or_admin())
   with check (public.is_guru_or_admin())'
);

select public._sandeq_apply_policy(
  'absensi',
  'sandeq_absensi_select_scoped',
  'create policy "sandeq_absensi_select_scoped" on public.absensi
   for select to authenticated
   using (
     public.is_admin()
     or siswa_id = auth.uid()
     or public.current_user_role() = ''guru''
   )'
);

select public._sandeq_apply_policy(
  'absensi',
  'sandeq_absensi_guru_write',
  'create policy "sandeq_absensi_guru_write" on public.absensi
   for all to authenticated
   using (public.is_guru_or_admin())
   with check (public.is_guru_or_admin())'
);

select public._sandeq_apply_policy(
  'pengumuman',
  'sandeq_pengumuman_read_authenticated',
  'create policy "sandeq_pengumuman_read_authenticated" on public.pengumuman
   for select to authenticated using (true)'
);

select public._sandeq_apply_policy(
  'pengumuman',
  'sandeq_pengumuman_guru_write',
  'create policy "sandeq_pengumuman_guru_write" on public.pengumuman
   for all to authenticated
   using (public.is_guru_or_admin())
   with check (public.is_guru_or_admin())'
);

select public._sandeq_apply_policy(
  'forum',
  'sandeq_forum_read_authenticated',
  'create policy "sandeq_forum_read_authenticated" on public.forum
   for select to authenticated using (true)'
);

select public._sandeq_apply_policy(
  'forum',
  'sandeq_forum_insert_authenticated',
  'create policy "sandeq_forum_insert_authenticated" on public.forum
   for insert to authenticated
   with check (author_id = auth.uid())'
);

select public._sandeq_apply_policy(
  'forum',
  'sandeq_forum_delete_owner_or_staff',
  'create policy "sandeq_forum_delete_owner_or_staff" on public.forum
   for delete to authenticated
   using (author_id = auth.uid() or public.is_guru_or_admin())'
);

select public._sandeq_apply_policy(
  'progress_materi',
  'sandeq_progress_owner',
  'create policy "sandeq_progress_owner" on public.progress_materi
   for all to authenticated
   using (user_id = auth.uid() or public.is_admin())
   with check (user_id = auth.uid() or public.is_admin())'
);

select public._sandeq_apply_policy(
  'mastery_progress',
  'sandeq_mastery_owner',
  'create policy "sandeq_mastery_owner" on public.mastery_progress
   for all to authenticated
   using (user_id = auth.uid() or public.is_admin())
   with check (user_id = auth.uid() or public.is_admin())'
);

select public._sandeq_apply_policy(
  'embedded_quiz_attempts',
  'sandeq_embedded_quiz_owner',
  'create policy "sandeq_embedded_quiz_owner" on public.embedded_quiz_attempts
   for all to authenticated
   using (user_id = auth.uid() or public.is_admin())
   with check (user_id = auth.uid() or public.is_admin())'
);

select public._sandeq_apply_policy(
  'tutor_sessions',
  'sandeq_tutor_sessions_owner',
  'create policy "sandeq_tutor_sessions_owner" on public.tutor_sessions
   for all to authenticated
   using (user_id = auth.uid() or public.is_admin())
   with check (user_id = auth.uid() or public.is_admin())'
);

select public._sandeq_apply_policy(
  'tutor_messages',
  'sandeq_tutor_messages_owner',
  'create policy "sandeq_tutor_messages_owner" on public.tutor_messages
   for all to authenticated
   using (user_id = auth.uid() or public.is_admin())
   with check (user_id = auth.uid() or public.is_admin())'
);

select public._sandeq_apply_policy(
  'badges',
  'sandeq_badges_read_authenticated',
  'create policy "sandeq_badges_read_authenticated" on public.badges
   for select to authenticated using (true)'
);

select public._sandeq_apply_policy(
  'user_badges',
  'sandeq_user_badges_owner',
  'create policy "sandeq_user_badges_owner" on public.user_badges
   for select to authenticated
   using (user_id = auth.uid() or public.is_admin())'
);

drop function if exists public._sandeq_apply_policy(text, text, text);
