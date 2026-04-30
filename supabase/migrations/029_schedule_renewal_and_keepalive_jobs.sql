-- Edge Function 스케줄러 유틸:
-- 1) send-renewal-alerts: 매일 09:00 (Asia/Seoul 기준 권장)
-- 2) keep-alive: 30분마다
--
-- 사용법(한 번만):
--   select public.configure_system_schedules(
--     'https://<PROJECT_REF>.supabase.co',
--     '<SERVICE_ROLE_KEY>'
--   );
--
-- 해제:
--   select public.disable_system_schedules();

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.configure_system_schedules(
  p_project_url text,
  p_service_role_key text,
  p_keepalive_cron text default '*/30 * * * *',
  p_renewal_cron text default '0 9 * * *'
) returns table(job_name text, job_id bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text := trim(both '/' from p_project_url);
  v_keepalive_sql text;
  v_renewal_sql text;
  v_keepalive_id bigint;
  v_renewal_id bigint;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true and level >= 10
  ) then
    raise exception 'only super admin can configure schedules';
  end if;

  if v_url is null or v_url = '' then
    raise exception 'p_project_url is required';
  end if;
  if p_service_role_key is null or p_service_role_key = '' then
    raise exception 'p_service_role_key is required';
  end if;

  perform cron.unschedule(jobid) from cron.job where jobname in (
    'edge-keep-alive-every-30m',
    'edge-send-renewal-alerts-daily'
  );

  v_keepalive_sql := format(
    $f$
    select
      net.http_get(
        url := %L,
        timeout_milliseconds := 10000
      );
    $f$,
    v_url || '/functions/v1/keep-alive'
  );

  v_renewal_sql := format(
    $f$
    select
      net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 15000
      );
    $f$,
    v_url || '/functions/v1/send-renewal-alerts',
    p_service_role_key
  );

  v_keepalive_id := cron.schedule('edge-keep-alive-every-30m', p_keepalive_cron, v_keepalive_sql);
  v_renewal_id := cron.schedule('edge-send-renewal-alerts-daily', p_renewal_cron, v_renewal_sql);

  return query
  select 'edge-keep-alive-every-30m'::text, v_keepalive_id
  union all
  select 'edge-send-renewal-alerts-daily'::text, v_renewal_id;
end;
$$;

comment on function public.configure_system_schedules(text, text, text, text)
  is 'Registers keep-alive and renewal alert edge-function cron jobs.';

create or replace function public.disable_system_schedules()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true and level >= 10
  ) then
    raise exception 'only super admin can disable schedules';
  end if;

  with targets as (
    select jobid
    from cron.job
    where jobname in ('edge-keep-alive-every-30m', 'edge-send-renewal-alerts-daily')
  )
  select count(*) into v_count from targets;

  perform cron.unschedule(jobid) from (
    select jobid
    from cron.job
    where jobname in ('edge-keep-alive-every-30m', 'edge-send-renewal-alerts-daily')
  ) t;

  return v_count;
end;
$$;

comment on function public.disable_system_schedules()
  is 'Unregisters keep-alive and renewal alert cron jobs.';

revoke all on function public.configure_system_schedules(text, text, text, text) from public;
revoke all on function public.disable_system_schedules() from public;
grant execute on function public.configure_system_schedules(text, text, text, text) to authenticated;
grant execute on function public.disable_system_schedules() to authenticated;

