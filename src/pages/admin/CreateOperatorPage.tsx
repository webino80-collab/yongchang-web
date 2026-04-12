import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/authService";
import { PageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

export function CreateOperatorPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nickname, setNickname] = useState("");
  const [grantAdmin, setGrantAdmin] = useState(true);

  const createOp = useMutation({
    mutationFn: async () => {
      const em = email.trim();
      if (!em || !password) throw new Error("이메일과 비밀번호를 입력해 주세요.");
      if (password !== password2) throw new Error("비밀번호가 서로 일치하지 않습니다.");
      if (password.length < 6) throw new Error("비밀번호는 6자 이상이어야 합니다.");
      return authService.adminSignUpOperator({
        email: em,
        password,
        nickname: nickname.trim() || undefined,
        grantAdmin,
      });
    },
    onSuccess: () => {
      setPassword("");
      setPassword2("");
      setEmail("");
      setNickname("");
      void queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    },
  });

  if (loading && !user) return <PageSpinner />;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">운영자 계정 생성</h1>
      <p className="text-sm text-gray-600 mb-6">
        이메일·비밀번호로 Supabase Auth 계정을 등록합니다. 가입 후 바로 로그인하려면 프로젝트에서 이메일 확인을 끄세요.
      </p>

      <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950/90 mb-6 leading-relaxed">
        <strong className="font-semibold">Supabase 설정</strong>
        <br />
        Dashboard → Authentication → Providers → Email →{" "}
        <span className="whitespace-nowrap">Confirm email</span> 을 끄면 확인 메일 없이 즉시 활성화됩니다.
      </div>

      <form
        className="card p-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          createOp.mutate();
        }}
      >
        <div>
          <label htmlFor="op-email" className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <input
            id="op-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input w-full"
            placeholder="operator@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="op-nick" className="block text-sm font-medium text-gray-700 mb-1">
            닉네임 (선택)
          </label>
          <input
            id="op-nick"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="input w-full"
            placeholder="비우면 이메일 @ 앞부분이 사용됩니다"
          />
        </div>

        <div>
          <label htmlFor="op-pw" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            id="op-pw"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input w-full"
            minLength={6}
            required
          />
        </div>

        <div>
          <label htmlFor="op-pw2" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호 확인
          </label>
          <input
            id="op-pw2"
            type="password"
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="input w-full"
            minLength={6}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={grantAdmin}
            onChange={(e) => setGrantAdmin(e.target.checked)}
            className="rounded border-gray-300"
          />
          관리자 패널 접근 허용 (<code className="text-xs bg-gray-100 px-1 rounded">is_admin</code>)
        </label>

        {createOp.isError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {createOp.error instanceof Error ? createOp.error.message : "계정 생성에 실패했습니다."}
          </div>
        )}

        {createOp.isSuccess && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2">
            계정이 생성되었습니다. ({createOp.data.email})
          </div>
        )}

        <button
          type="submit"
          disabled={createOp.isPending}
          className="btn btn-primary w-full sm:w-auto"
        >
          {createOp.isPending ? "처리 중…" : "계정 만들기"}
        </button>
      </form>
    </div>
  );
}
