# Scheduler Setup (Renewal Alerts + Keep Alive)

아래 순서대로 한 번만 설정하면 됩니다.

## 1) 마이그레이션 적용

- `supabase/migrations/028_asset_renewal_alerts.sql`
- `supabase/migrations/029_schedule_renewal_and_keepalive_jobs.sql`

## 2) Edge Function 배포

- `send-renewal-alerts`
- `keep-alive`

## 3) 함수 환경변수 확인

`send-renewal-alerts` 쪽에 아래 값이 있어야 메일이 발송됩니다.

- `MAIL_WORKER_URL`
- `MAIL_WORKER_KEY` (또는 `MAIL_WORKER_SECRET`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SITE_NAME` (선택)
- `RENEWAL_ALERT_TO` (선택, 미설정 시 `jmpapa@kakao.com`)

## 4) 스케줄 등록 (SQL Editor에서 실행)

아래 SQL에서 `<PROJECT_REF>`와 `<SERVICE_ROLE_KEY>`를 실제 값으로 바꿔 실행하세요.

```sql
select public.configure_system_schedules(
  'https://<PROJECT_REF>.supabase.co',
  '<SERVICE_ROLE_KEY>'
);
```

기본 스케줄:

- `keep-alive`: 30분마다 (`*/30 * * * *`)
- `send-renewal-alerts`: 매일 09:00 (`0 9 * * *`)

원하면 cron 표현식을 직접 넘겨 변경할 수 있습니다.

```sql
select public.configure_system_schedules(
  'https://<PROJECT_REF>.supabase.co',
  '<SERVICE_ROLE_KEY>',
  '*/15 * * * *',  -- keep-alive
  '0 8 * * *'      -- renewal alerts
);
```

## 5) 해제

```sql
select public.disable_system_schedules();
```

## 참고

- `configure_system_schedules`/`disable_system_schedules`는 최고 관리자(level >= 10)만 실행 가능하도록 제한되어 있습니다.
- 이미 등록된 동일 잡 이름은 재등록 시 자동으로 교체됩니다.

