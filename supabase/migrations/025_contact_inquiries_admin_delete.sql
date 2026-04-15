-- 관리자만 문의(contact_inquiries) 삭제 가능
create policy "inquiries_admin_delete"
  on public.contact_inquiries for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
