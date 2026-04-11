import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePost, useUpdatePost } from "@/hooks/usePosts";
import { FileUpload } from "./FileUpload";
import { Spinner } from "@/components/ui/Spinner";
import type { Board, Post, PostFile } from "@/types";

const schema = z.object({
  subject: z.string().min(1, "제목을 입력하세요").max(200),
  content: z.string().min(1, "내용을 입력하세요"),
  password: z.string().optional(),
  is_notice: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface PostWriteProps {
  board: Board;
  editPost?: Post;
}

export function PostWrite({ board, editPost }: PostWriteProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const createPost = useCreatePost(board.id);
  const updatePost = useUpdatePost(editPost?.id ?? "", board.id);
  const [uploadedFiles, setUploadedFiles] = useState<PostFile[]>(editPost?.files ?? []);
  const [savedPostId, setSavedPostId] = useState<string | null>(editPost?.id ?? null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: editPost?.subject ?? "",
      content: editPost?.content ?? "",
      is_notice: editPost?.is_notice ?? false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (editPost) {
        await updatePost.mutateAsync({ subject: data.subject, content: data.content });
        navigate(`/board/${board.table_name}/${editPost.id}`);
      } else {
        const post = await createPost.mutateAsync({
          authorId: user?.id ?? null,
          payload: {
            subject: data.subject,
            content: data.content,
            password: data.password,
            is_notice: data.is_notice ?? false,
            author_name: user ? undefined : "비회원",
          },
        });
        setSavedPostId(post.id);
        navigate(`/board/${board.table_name}/${post.id}`);
      }
    } catch {
      setError("root", { message: "저장 중 오류가 발생했습니다." });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {editPost ? "글 수정" : "글쓰기"} — {board.subject}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200">
            {errors.root.message}
          </div>
        )}

        {profile?.is_admin && !editPost && (
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" {...register("is_notice")} className="rounded" />
            공지사항으로 등록
          </label>
        )}

        <div>
          <label className="label" htmlFor="subject">제목</label>
          <input
            id="subject"
            type="text"
            className={`input ${errors.subject ? "input-error" : ""}`}
            {...register("subject")}
          />
          {errors.subject && (
            <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>
          )}
        </div>

        {!user && !editPost && (
          <div>
            <label className="label" htmlFor="password">비밀번호 (비회원)</label>
            <input
              id="password"
              type="password"
              className="input max-w-xs"
              placeholder="수정·삭제 시 필요합니다"
              {...register("password")}
            />
          </div>
        )}

        <div>
          <label className="label" htmlFor="content">내용</label>
          <textarea
            id="content"
            rows={15}
            className={`input resize-y ${errors.content ? "input-error" : ""}`}
            {...register("content")}
          />
          {errors.content && (
            <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>
          )}
        </div>

        {board.use_upload && savedPostId && (
          <FileUpload
            postId={savedPostId}
            existingFiles={uploadedFiles}
            maxCount={board.upload_count}
            maxSizeBytes={board.upload_size}
            onUploaded={(file) => setUploadedFiles((prev) => [...prev, file])}
            onDeleted={(id) =>
              setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
            }
          />
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
            {editPost ? "수정 완료" : "등록"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
