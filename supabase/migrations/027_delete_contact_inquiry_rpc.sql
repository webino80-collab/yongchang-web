-- 문의 삭제: 클라이언트 DELETE + RLS는 정책 누락·불일치 시 0행만 삭제될 수 있음 → SECURITY DEFINER RPC.
-- delete_contact_inquiry: is_app_admin() 미존재·불일치 환경 대비, 로그인(authenticated, auth.uid() 존재)만 허용.

-- 관리자 조회·수정: public.is_app_admin() 없이도 적용 가능하도록 profiles.is_admin 기준 (002 와 동일)
drop policy if exists "inquiries_admin_select" on public.contact_inquiries;
create policy "inquiries_admin_select"
  on public.contact_inquiries for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin is true
    )
  );

drop policy if exists "inquiries_admin_update" on public.contact_inquiries;
create policy "inquiries_admin_update"
  on public.contact_inquiries for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin is true
    )
  );

create or replace function public.delete_contact_inquiry(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted int;
begin
  if auth.uid() is null then
    raise exception 'auth required' using errcode = '28000';
  end if;

  delete from public.contact_inquiries where id = p_id;
  get diagnostics deleted = row_count;
  return deleted > 0;
end;
$$;

comment on function public.delete_contact_inquiry(uuid) is
  '로그인 사용자(auth.uid())만 문의 삭제; 테이블 DELETE RLS 미적용 환경 대비 SECURITY DEFINER';

revoke all on function public.delete_contact_inquiry(uuid) from public;
grant execute on function public.delete_contact_inquiry(uuid) to authenticated;
