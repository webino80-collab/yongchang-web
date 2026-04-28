/**
 * 라우팅용 캐치올 핸들러.
 *
 * Cloudflare Pages는 "매칭되는 Function 파일"이 없으면 정적 자산으로만 처리하고,
 * 그 경우 `_middleware`가 호출되지 않을 수 있습니다.
 * 이 파일로 모든 문서 경로에 Function이 매칭되게 한 뒤 `next()`로 기존 정적/SPA 동작으로 넘깁니다.
 */
export async function onRequest(context: {
  next: () => Promise<Response>;
}): Promise<Response> {
  return context.next();
}
