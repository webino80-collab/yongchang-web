import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";

const schema = z
  .object({
    nickname: z
      .string()
      .min(2, "닉네임은 2자 이상입니다")
      .max(20, "닉네임은 20자 이하입니다"),
    email: z.string().email("올바른 이메일을 입력하세요"),
    password: z
      .string()
      .min(8, "비밀번호는 8자 이상입니다")
      .regex(/[A-Za-z]/, "영문자를 포함해야 합니다")
      .regex(/[0-9]/, "숫자를 포함해야 합니다"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await signUp(data.email, data.password, data.nickname);
      navigate("/login", {
        state: { message: "가입이 완료되었습니다. 이메일을 확인해 주세요." },
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.";
      setError("root", { message: msg });
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">회원가입</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200">
              {errors.root.message}
            </div>
          )}

          {(
            [
              { id: "nickname", label: "닉네임", type: "text", autoComplete: "nickname" },
              { id: "email", label: "이메일", type: "email", autoComplete: "email" },
              { id: "password", label: "비밀번호", type: "password", autoComplete: "new-password" },
              { id: "confirmPassword", label: "비밀번호 확인", type: "password", autoComplete: "new-password" },
            ] as const
          ).map(({ id, label, type, autoComplete }) => (
            <div key={id}>
              <label className="label" htmlFor={id}>{label}</label>
              <input
                id={id}
                type={type}
                autoComplete={autoComplete}
                className={`input ${errors[id] ? "input-error" : ""}`}
                {...register(id)}
              />
              {errors[id] && (
                <p className="mt-1 text-xs text-red-500">{errors[id]?.message}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
            가입하기
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="font-medium">로그인</Link>
        </p>
      </div>
    </div>
  );
}
