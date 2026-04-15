-- 문의 삭제: profiles.is_admin 뿐 아니라 JWT app_metadata.is_admin 도 허용 (004 is_app_admin 와 동일)
drop policy if exists "inquiries_admin_delete" on public.contact_inquiries;

create policy "inquiries_admin_delete"
  on public.contact_inquiries for delete
  using (public.is_app_admin());
