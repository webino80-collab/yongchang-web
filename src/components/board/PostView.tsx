import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useDeletePost } from "@/hooks/usePosts";
import { boardService } from "@/lib/boardService";
import { CommentSection } from "./CommentSection";
import type { Post } from "@/types";

interface PostViewProps {
  post: Post;
  comments: import("@/types").Comment[];
  commentsLoading?: boolean;
}

export function PostView({ post, comments, commentsLoading }: PostViewProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const deletePost = useDeletePost(post.board_id);

  const isOwn = user?.id && post.author_id === user.id;
  const canEdit = isOwn || profile?.is_admin;
  const boardSlug = (post.boards as { table_name: string } | undefined)?.table_name ?? "";

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deletePost.mutateAsync(post.id);
      navigate(`/board/${boardSlug}`);
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleVote = async (type: "good" | "bad") => {
    try {
      await boardService.votePost(post.id, type);
    } catch {
      alert("이미 추천하셨거나 오류가 발생했습니다.");
    }
  };

  return (
    <article>
      {/* 게시판 이름 */}
      <div className="mb-4">
        <Link
          to={`/board/${boardSlug}`}
          className="text-sm text-indigo-600 hover:text-indigo-800 no-underline"
        >
          ← {post.boards?.subject ?? "게시판"}
        </Link>
      </div>

      {/* 제목 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        {post.is_notice && (
          <span className="badge badge-red mr-2">공지</span>
        )}
        {post.subject}
      </h1>

      {/* 메타 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 pb-4 border-b border-gray-200">
        <span className="font-medium text-gray-700">
          {post.profiles?.nickname ?? post.author_name ?? "비회원"}
        </span>
        <span>
          {format(new Date(post.created_at), "yyyy년 MM월 dd일 HH:mm", { locale: ko })}
        </span>
        <span>조회 {post.view_count.toLocaleString()}</span>
        {post.updated_at !== post.created_at && (
          <span className="text-xs text-gray-400">(수정됨)</span>
        )}
      </div>

      {/* 본문 — 표·넓은 콘텐츠는 가로 스크롤로 뷰포트 밀어내지 않음 */}
      <div className="max-w-full overflow-x-auto">
        <div
          className="prose prose-sm max-w-none py-6 min-h-32 min-w-0 text-gray-800 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      {/* 첨부파일 */}
      {post.files && post.files.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">첨부파일</p>
          <ul className="space-y-1">
            {post.files.map((file) => (
              <li key={file.id}>
                <a
                  href={boardService.getFileUrl(file.storage_path)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  📎 {file.original_name} ({(file.size / 1024).toFixed(1)}KB)
                </a>
                <span className="text-xs text-gray-400 ml-2">
                  다운로드 {file.download_count}회
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 추천 / 비추천 */}
      <div className="flex items-center gap-4 py-6 border-t border-b border-gray-200 mt-6">
        <button
          onClick={() => handleVote("good")}
          className="flex items-center gap-1.5 btn btn-secondary btn-sm"
        >
          👍 추천 <span className="font-bold text-indigo-600">{post.good_count}</span>
        </button>
        <button
          onClick={() => handleVote("bad")}
          className="flex items-center gap-1.5 btn btn-secondary btn-sm"
        >
          👎 비추천 <span className="font-bold text-red-500">{post.bad_count}</span>
        </button>
      </div>

      {/* 수정 / 삭제 */}
      {canEdit && (
        <div className="flex gap-2 mt-4">
          <Link
            to={`/board/${boardSlug}/${post.id}/edit`}
            className="btn btn-secondary btn-sm no-underline"
          >
            수정
          </Link>
          <button
            onClick={handleDelete}
            className="btn btn-danger btn-sm"
            disabled={deletePost.isPending}
          >
            삭제
          </button>
        </div>
      )}

      {/* 댓글 */}
      {(post.boards as { use_comment?: boolean } | undefined)?.use_comment && !commentsLoading && (
        <CommentSection
          postId={post.id}
          comments={comments}
          commentLevel={(post.boards as { comment_level?: number } | undefined)?.comment_level ?? 0}
        />
      )}
    </article>
  );
}
