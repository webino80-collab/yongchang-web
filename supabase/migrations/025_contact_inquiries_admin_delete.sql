-- 관리자만 문의(contact_inquiries) 삭제 가능 (JWT 또는 profiles — public.is_app_admin())
create policy "inquiries_admin_delete"
  on public.contact_inquiries for delete
  using (public.is_app_admin());
