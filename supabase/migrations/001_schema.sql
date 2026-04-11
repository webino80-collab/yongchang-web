-- ============================================================
-- 그누보드5 → Supabase 마이그레이션
-- 001_schema.sql : 전체 테이블 DDL
-- ============================================================

-- profiles (g5_member 대체, auth.users 확장)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nickname      text not null,
  level         int not null default 1 check (level between 1 and 10),
  point         int not null default 0,
  email_verified bool not null default false,
  is_admin      bool not null default false,
  phone         text,
  homepage      text,
  birth_date    date,
  memo          text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.profiles is 'g5_member 대체 — Supabase auth.users 1:1 확장';

-- board_groups (g5_board_group 대체)
create table if not exists public.board_groups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  admin_id      uuid references public.profiles(id) on delete set null,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);
comment on table public.board_groups is 'g5_board_group 대체';

-- boards (g5_board 대체)
create table if not exists public.boards (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid references public.board_groups(id) on delete set null,
  table_name      text not null unique,   -- URL slug, e.g. "notice", "qa"
  subject         text not null,
  skin            text not null default 'basic', -- 'basic' | 'gallery' | 'product'
  read_level      int not null default 1,
  write_level     int not null default 1,
  comment_level   int not null default 1,
  use_comment     bool not null default true,
  use_upload      bool not null default false,
  upload_count    int not null default 5,
  upload_size     int not null default 5242880, -- 5MB in bytes
  posts_per_page  int not null default 15,
  is_active       bool not null default true,
  display_order   int not null default 0,
  created_at      timestamptz not null default now()
);
comment on table public.boards is 'g5_board 대체 — 동적 테이블 방식 폐기, FK 방식 채택';

-- posts (g5_write_{bo_table} 수십 개 → 단일 통합)
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  board_id      uuid not null references public.boards(id) on delete cascade,
  author_id     uuid references public.profiles(id) on delete set null,
  author_name   text,                       -- 비회원 글 표시용
  subject       text not null,
  content       text not null default '',
  password      text,                       -- 비회원 글 bcrypt 해시
  is_notice     bool not null default false,
  view_count    int not null default 0,
  good_count    int not null default 0,
  bad_count     int not null default 0,
  parent_id     uuid references public.posts(id) on delete cascade, -- 답글
  reply_depth   int not null default 0,     -- 답글 깊이
  reply_order   text not null default '',   -- 그누보드 wr_reply 대체 정렬용
  ip            inet,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.posts is 'g5_write_* 동적 테이블 → 단일 posts 테이블로 통합';

create index if not exists idx_posts_board_id     on public.posts(board_id);
create index if not exists idx_posts_parent_id    on public.posts(parent_id);
create index if not exists idx_posts_created_at   on public.posts(created_at desc);
create index if not exists idx_posts_is_notice    on public.posts(board_id, is_notice) where is_notice = true;

-- comments (그누보드 wr_is_comment → 별도 테이블)
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  author_name text,
  content     text not null,
  password    text,
  parent_id   uuid references public.comments(id) on delete cascade,
  ip          inet,
  created_at  timestamptz not null default now()
);
comment on table public.comments is 'g5_write 내 wr_is_comment 방식 → 별도 테이블';

create index if not exists idx_comments_post_id on public.comments(post_id);

-- files (g5_file 대체, Supabase Storage 연동)
create table if not exists public.files (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references public.posts(id) on delete cascade,
  storage_path   text not null,            -- Supabase Storage 내 경로
  original_name  text not null,
  mime_type      text not null,
  size           bigint not null,
  download_count int not null default 0,
  created_at     timestamptz not null default now()
);
comment on table public.files is 'g5_file 대체 — Supabase Storage와 연동';

create index if not exists idx_files_post_id on public.files(post_id);

-- contact_inquiries (폼메일 → DB 저장)
create table if not exists public.contact_inquiries (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  phone          text,
  subject        text not null,
  message        text not null,
  is_read        bool not null default false,
  reply_content  text,
  replied_at     timestamptz,
  ip             inet,
  created_at     timestamptz not null default now()
);
comment on table public.contact_inquiries is '폼메일(contact.php + mail_send_update.php) 대체';

create index if not exists idx_inquiries_created_at on public.contact_inquiries(created_at desc);
create index if not exists idx_inquiries_is_read    on public.contact_inquiries(is_read);

-- site_config (g5_config 대체)
create table if not exists public.site_config (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);
comment on table public.site_config is 'g5_config 대체 — 사이트 전역 설정 KV 스토어';

-- 기본 설정값 삽입
insert into public.site_config (key, value) values
  ('site_name', '사이트명'),
  ('site_description', '사이트 설명'),
  ('admin_email', 'admin@example.com'),
  ('smtp_host', ''),
  ('smtp_port', '587'),
  ('smtp_user', ''),
  ('posts_per_page', '15'),
  ('use_email_verify', 'true')
on conflict (key) do nothing;

-- ============================================================
-- 트리거: updated_at 자동 갱신
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ============================================================
-- 함수: 신규 auth.user 생성 시 profiles 자동 생성
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nickname, level)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    1
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
