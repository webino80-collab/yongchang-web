import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/lib/authService";
import { Spinner } from "@/components/ui/Spinner";

const schema = z.object({
  nickname: z.string().min(2, "닉네임은 2자 이상입니다").max(20),
  phone: z.string().optional(),
  homepage: z.string().url("올바른 URL을 입력하세요").optional().or(z.literal("")),
  memo: z.string().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

export function ProfilePage() {
  const { user, profile, setProfile } = useAuth();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nickname: profile?.nickname ?? "",
      phone: profile?.phone ?? "",
      homepage: profile?.homepage ?? "",
      memo: profile?.memo ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    try {
      const updated = await authService.updateProfile(user.id, {
        nickname: data.nickname,
        phone: data.phone || undefined,
        homepage: data.homepage || undefined,
        memo: data.memo || undefined,
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("root", { message: "프로필 업데이트 중 오류가 발생했습니다." });
    }
  };

  if (!user || !profile) {
    return (
      <div className="text-center py-16 text-gray-400">
        로그인이 필요합니다.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">내 프로필</h1>

      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold flex-shrink-0">
          {profile.nickname[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{profile.nickname}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="flex gap-2 mt-1">
            <span className="badge badge-blue">레벨 {profile.level}</span>
            {profile.is_admin && <span className="badge badge-red">관리자</span>}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        {errors.root && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200">
            {errors.root.message}
          </div>
        )}
        {saved && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-md border border-green-200">
            프로필이 저장되었습니다.
          </div>
        )}

        <div>
          <label className="label">이메일</label>
          <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
            {user.email}
          </p>
        </div>

        <div>
          <label className="label" htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            type="text"
            className={`input ${errors.nickname ? "input-error" : ""}`}
            {...register("nickname")}
          />
          {errors.nickname && (
            <p className="mt-1 text-xs text-red-500">{errors.nickname.message}</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="phone">연락처</label>
          <input
            id="phone"
            type="tel"
            className="input"
            placeholder="010-0000-0000"
            {...register("phone")}
          />
        </div>

        <div>
          <label className="label" htmlFor="homepage">홈페이지</label>
          <input
            id="homepage"
            type="url"
            className={`input ${errors.homepage ? "input-error" : ""}`}
            placeholder="https://"
            {...register("homepage")}
          />
          {errors.homepage && (
            <p className="mt-1 text-xs text-red-500">{errors.homepage.message}</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="memo">자기소개</label>
          <textarea
            id="memo"
            rows={3}
            className="input resize-none"
            maxLength={200}
            {...register("memo")}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full"
        >
          {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
          저장
        </button>
      </form>
    </div>
  );
}
