-- 비로그인 문의: RLS 때문에 anon은 contact_inquiries SELECT 불가 → insert().select() 실패 방지
-- SECURITY DEFINER로 INSERT 후 행을 한 번에 반환 (목록 조회는 여전히 관리자만)

create or replace function public.create_contact_inquiry(
  p_name text,
  p_email text,
  p_phone text,
  p_subject text,
  p_message text
)
returns public.contact_inquiries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := left(trim(coalesce(p_name, '')), 80);
  v_email text := left(lower(trim(coalesce(p_email, ''))), 254);
  v_phone text := nullif(left(trim(coalesce(p_phone, '')), 40), '');
  v_subject text := left(trim(coalesce(p_subject, '')), 200);
  v_message text := left(trim(coalesce(p_message, '')), 4000);
  r public.contact_inquiries%rowtype;
begin
  if length(v_name) < 1 then
    raise exception 'invalid_name' using errcode = '22000';
  end if;
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(v_email) < 3 then
    raise exception 'invalid_email' using errcode = '22000';
  end if;
  if length(v_subject) < 1 then
    raise exception 'invalid_subject' using errcode = '22000';
  end if;
  if length(v_message) < 10 then
    raise exception 'message_too_short' using errcode = '22000';
  end if;

  insert into public.contact_inquiries (name, email, phone, subject, message)
  values (v_name, v_email, v_phone, v_subject, v_message)
  returning * into strict r;

  return r;
end;
$$;

comment on function public.create_contact_inquiry(text, text, text, text, text) is
  '문의 폼 전용 INSERT+반환 (anon은 테이블 SELECT RLS로 행을 읽을 수 없음)';

revoke all on function public.create_contact_inquiry(text, text, text, text, text) from public;
grant execute on function public.create_contact_inquiry(text, text, text, text, text) to anon, authenticated;
