import { useParams, Navigate } from "react-router-dom";
import { usePost, useComments } from "@/hooks/usePosts";
import { PostView } from "@/components/board/PostView";
import { PageSpinner } from "@/components/ui/Spinner";

export function PostPage() {
  const { postId } = useParams<{ slug: string; postId: string }>();
  const { data: post, isLoading: postLoading } = usePost(postId ?? "");
  const { data: comments = [], isLoading: commentsLoading } = useComments(postId ?? "");

  if (postLoading) return <PageSpinner />;
  if (!post) return <Navigate to="/" replace />;

  return (
    <PostView
      post={post}
      comments={comments}
      commentsLoading={commentsLoading}
    />
  );
}
