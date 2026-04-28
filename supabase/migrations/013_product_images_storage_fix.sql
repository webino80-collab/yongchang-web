-- ============================================================
-- 013_product_images_storage_fix.sql
-- 제품 이미지 Storage 404/403/400 대응
--  - 버킷이 예전에 비공개로만 만들어진 경우 → public = true 로 보정
--  - 브라우저 <img> 요청(익명)이 SELECT 정책을 타도록 anon 명시
--  - upload(..., { upsert: true }) 덮어쓰기용 UPDATE 정책
-- ============================================================

update storage.buckets
set public = true
where id = 'product-images';

drop policy if exists "public read product-images" on storage.objects;
create policy "public read product-images" on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "admin product-images update" on storage.objects;
create policy "admin product-images update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
