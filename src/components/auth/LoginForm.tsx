import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";

const schema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(6, "비밀번호는 6자 이상입니다"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/";
  const message = (location.state as { message?: string })?.message;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await signIn(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      // 실제 에러 메시지를 그대로 표시 (타임아웃, 잘못된 자격증명 등 구분)
      const msg = err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.";
      const isCredentialError = msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credentials");
      setError("root", {
        message: isCredentialError ? "이메일 또는 비밀번호가 올바르지 않습니다." : msg,
      });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f4f7fb] px-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <p className="text-[10px] tracking-widest text-gray-400 uppercase">Medical Device</p>
            <p className="text-2xl font-bold text-[#0f2d52]">주식회사 용창</p>
          </Link>
          <h1 className="text-lg font-semibold text-gray-700">로그인</h1>
        </div>

        <div className="card p-8">
          {message && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg border border-green-200 mb-5">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
                {errors.root.message}
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`input ${errors.email ? "input-error" : ""}`}
                placeholder="example@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="password">비밀번호</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`input ${errors.password ? "input-error" : ""}`}
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full mt-2"
            >
              {isSubmitting ? <Spinner size="sm" /> : null}
              로그인
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500 space-y-2">
            <p>
              아직 회원이 아닌가요?{" "}
              <Link to="/register" className="font-semibold text-[#2e7cf6] hover:underline">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
