import { useParams, Navigate, useSearchParams } from "react-router-dom";
import { useBoardBySlug } from "@/hooks/useBoard";
import { usePost } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";
import { PostWrite } from "@/components/board/PostWrite";
import { PageSpinner } from "@/components/ui/Spinner";

export function WritePage() {
  const { slug, postId } = useParams<{ slug: string; postId?: string }>();
  const [searchParams] = useSearchParams();
  const editId = postId ?? searchParams.get("edit") ?? undefined;

  const { data: board, isLoading: boardLoading } = useBoardBySlug(slug ?? "");
  const { data: editPost, isLoading: editLoading } = usePost(editId ?? "");
  const { user, profile, loading } = useAuth();

  if (boardLoading || loading || (editId && editLoading)) return <PageSpinner />;
  if (!board) return <Navigate to="/" replace />;

  const writeLevel = board.write_level;
  const userLevel = profile?.level ?? 0;
  const canWrite = writeLevel === 0 || userLevel >= writeLevel || !!user;

  if (!canWrite) return <Navigate to={`/board/${slug}`} replace />;

  return <PostWrite board={board} editPost={editPost ?? undefined} />;
}
