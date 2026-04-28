import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useCreateComment, useDeleteComment } from "@/hooks/usePosts";
import { Spinner } from "@/components/ui/Spinner";
import type { Comment } from "@/types";

const schema = z.object({
  content: z.string().min(1, "내용을 입력하세요").max(2000),
  password: z.string().optional(),
});

type CommentFormData = z.infer<typeof schema>;

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  commentLevel: number;
}

export function CommentSection({ postId, comments, commentLevel }: CommentSectionProps) {
  const { user, profile } = useAuth();
  const createComment = useCreateComment(postId);
  const deleteComment = useDeleteComment(postId);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const canComment = commentLevel === 0 || (profile?.level ?? 0) >= commentLevel;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: CommentFormData) => {
    await createComment.mutateAsync({
      authorId: user?.id ?? null,
      payload: {
        content: data.content,
        author_name: user ? undefined : "비회원",
        password: data.password,
        parent_id: replyTo ?? undefined,
      },
    });
    reset();
    setReplyTo(null);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    await deleteComment.mutateAsync(commentId);
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId);

  return (
    <div className="mt-8">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        댓글 <span className="text-indigo-600">{comments.length}</span>
      </h3>

      <div className="space-y-4">
        {topLevel.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={replies(comment.id)}
            userId={user?.id}
            isAdmin={profile?.is_admin}
            onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            onDelete={handleDelete}
            replyActive={replyTo === comment.id}
            onReplySubmit={onSubmit}
          />
        ))}
      </div>

      {canComment ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 card p-4 space-y-3"
        >
          <p className="text-sm font-medium text-gray-700">댓글 작성</p>
          {!user && (
            <input
              type="password"
              placeholder="비회원 비밀번호 (삭제 시 필요)"
              className="input"
              {...register("password")}
            />
          )}
          <textarea
            rows={3}
            placeholder="댓글을 입력하세요"
            className={`input resize-none ${errors.content ? "input-error" : ""}`}
            {...register("content")}
          />
          {errors.content && (
            <p className="text-xs text-red-500">{errors.content.message}</p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm"
            >
              {isSubmitting ? <Spinner size="sm" className="mr-1" /> : null}
              등록
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-gray-400">
          {user ? `댓글 작성 권한(레벨 ${commentLevel})이 없습니다.` : "로그인 후 댓글을 작성할 수 있습니다."}
        </p>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  userId?: string;
  isAdmin?: boolean;
  onReply: () => void;
  onDelete: (id: string) => void;
  replyActive: boolean;
  onReplySubmit: (data: CommentFormData) => void;
}

function CommentItem({
  comment,
  replies,
  userId,
  isAdmin,
  onReply,
  onDelete,
  replyActive,
  onReplySubmit,
}: CommentItemProps) {
  const isOwn = userId && comment.author_id === userId;
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CommentFormData>({ resolver: zodResolver(schema) });

  const handleReplySubmit = async (data: CommentFormData) => {
    await onReplySubmit(data);
    reset();
  };

  return (
    <div className="border-b border-gray-100 pb-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
          {(comment.profiles?.nickname ?? comment.author_name ?? "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-800">
              {comment.profiles?.nickname ?? comment.author_name ?? "비회원"}
            </span>
            <span className="text-xs text-gray-400">
              {format(new Date(comment.created_at), "yyyy.MM.dd HH:mm", { locale: ko })}
            </span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          <div className="flex gap-3 mt-1">
            <button
              onClick={onReply}
              className="text-xs text-gray-400 hover:text-indigo-600"
            >
              답글
            </button>
            {(isOwn || isAdmin) && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 대댓글 */}
      {replies.length > 0 && (
        <div className="ml-11 mt-3 space-y-3">
          {replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2">
              <span className="text-gray-300 mt-0.5">└</span>
              <div>
                <span className="text-sm font-medium text-gray-700 mr-2">
                  {reply.profiles?.nickname ?? reply.author_name ?? "비회원"}
                </span>
                <span className="text-xs text-gray-400">
                  {format(new Date(reply.created_at), "yy.MM.dd HH:mm", { locale: ko })}
                </span>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 답글 폼 */}
      {replyActive && (
        <form
          onSubmit={handleSubmit(handleReplySubmit)}
          className="ml-11 mt-3 flex gap-2"
        >
          <textarea
            rows={2}
            placeholder="답글을 입력하세요"
            className="input flex-1 resize-none text-sm"
            {...register("content")}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-sm self-end"
          >
            등록
          </button>
        </form>
      )}
    </div>
  );
}
