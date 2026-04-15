# 문의 메일 Worker (Cloudflare `send_email`)

## 준비

1. Cloudflare 대시보드 → **Email Routing** 활성화, 도메인 `yongchang.co.kr` 연결.
2. **목적지 주소** `ycpbm@hanmail.net` 을 검증된 destination으로 추가.
3. 발신 주소 `no-reply@yongchang.co.kr` 이 같은 도메인에서 사용 가능한지 확인 (라우팅/주소 설정).

## 배포

```bash
cd workers/contact-mail
npm install
npx wrangler secret put CONTACT_MAIL_SECRET   # 긴 랜덤 문자열
# 선택: 대시보드에서 Worker → Settings → Variables → ALLOWED_ORIGINS
#   예: https://yongchang.co.kr,https://www.yongchang.co.kr,http://localhost:5173
npx wrangler deploy
```

배포 후 표시되는 Worker URL을 Vite 환경변수 `VITE_CONTACT_MAIL_WORKER_URL`에 넣고, `CONTACT_MAIL_SECRET`과 **동일한 값**을 `VITE_CONTACT_MAIL_SECRET`에 설정합니다.

## 중복 메일 방지

- 기본: 브라우저가 Worker로만 발송합니다.
- Supabase Database Webhook이 `send-contact-mail` Edge Function을 호출 중이면, **같은 Worker를 두 번 쏘지 않도록** Supabase에서 해당 Webhook을 끄거나, Edge Function에 `CF_CONTACT_MAIL_*`를 **넣지 마세요** (미설정 시 Worker를 호출하지 않음).

## 참고

- [Send emails from Workers](https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/)
