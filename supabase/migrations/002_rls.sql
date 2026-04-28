-- ============================================================
-- 002_rls.sql : Row Level Security 정책
-- ============================================================

-- ---- profiles ----
alter table public.profiles enable row level security;

-- 누구나 프로필 읽기 가능
create policy "profiles_select_all"
  on public.profiles for select using (true);

-- 본인 또는 관리자만 수정 가능
create policy "profiles_update_own"
  on public.profiles for update
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ---- board_groups ----
alter table public.board_groups enable row level security;

create policy "board_groups_select_all"
  on public.board_groups for select using (true);

create policy "board_groups_admin_only"
  on public.board_groups for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ---- boards ----
alter table public.boards enable row level security;

create policy "boards_select_active"
  on public.boards for select using (is_active = true);

create policy "boards_admin_all"
  on public.boards for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ---- posts ----
alter table public.posts enable row level security;

-- 읽기: board의 read_level <= 사용자 level (비로그인은 level=0으로 처리)
create policy "posts_select_by_level"
  on public.posts for select
  using (
    exists (
      select 1 from public.boards b
      where b.id = posts.board_id
        and b.is_active = true
        and b.read_level <= coalesce(
          (select p.level from public.profiles p where p.id = auth.uid()),
          0
        )
    )
  );

-- 쓰기: board의 write_level <= 사용자 level 또는 비회원(password 필요)
create policy "posts_insert_by_level"
  on public.posts for insert
  with check (
    exists (
      select 1 from public.boards b
      where b.id = board_id
        and b.is_active = true
        and b.write_level <= coalesce(
          (select p.level from public.profiles p where p.id = auth.uid()),
          0
        )
    )
    -- 비회원 허용: write_level = 0 인 게시판
    or exists (
      select 1 from public.boards b
      where b.id = board_id and b.write_level = 0
    )
  );

-- 수정: 본인 글 또는 관리자
create policy "posts_update_own"
  on public.posts for update
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- 삭제: 본인 글 또는 관리자
create policy "posts_delete_own"
  on public.posts for delete
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ---- comments ----
alter table public.comments enable row level security;

-- 읽기: 해당 post가 읽기 가능하면 댓글도 읽기 가능
create policy "comments_select_if_post_readable"
  on public.comments for select
  using (
    exists (
      select 1 from public.posts po
      join public.boards b on b.id = po.board_id
      where po.id = comments.post_id
        and b.is_active = true
        and b.read_level <= coalesce(
          (select p.level from public.profiles p where p.id = auth.uid()),
          0
        )
    )
  );

-- 쓰기: board의 comment_level <= 사용자 level
create policy "comments_insert_by_level"
  on public.comments for insert
  with check (
    exists (
      select 1 from public.posts po
      join public.boards b on b.id = po.board_id
      where po.id = post_id
        and b.comment_level <= coalesce(
          (select p.level from public.profiles p where p.id = auth.uid()),
          0
        )
    )
    or exists (
      select 1 from public.posts po
      join public.boards b on b.id = po.board_id
      where po.id = post_id and b.comment_level = 0
    )
  );

-- 삭제: 본인 또는 관리자
create policy "comments_delete_own"
  on public.comments for delete
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ---- files ----
alter table public.files enable row level security;

create policy "files_select_all"
  on public.files for select using (true);

create policy "files_insert_authenticated"
  on public.files for insert
  with check (auth.uid() is not null);

create policy "files_delete_own_or_admin"
  on public.files for delete
  using (
    exists (
      select 1 from public.posts po
      where po.id = files.post_id and po.author_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ---- contact_inquiries ----
alter table public.contact_inquiries enable row level security;

-- 누구나 문의 등록 가능
create policy "inquiries_insert_all"
  on public.contact_inquiries for insert
  with check (true);

-- 관리자만 조회·수정
create policy "inquiries_admin_select"
  on public.contact_inquiries for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "inquiries_admin_update"
  on public.contact_inquiries for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ---- site_config ----
alter table public.site_config enable row level security;

-- 누구나 읽기 가능
create policy "site_config_select_all"
  on public.site_config for select using (true);

-- 관리자만 수정
create policy "site_config_admin_all"
  on public.site_config for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
