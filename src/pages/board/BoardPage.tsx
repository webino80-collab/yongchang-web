import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useBoardBySlug } from "@/hooks/useBoard";
import { usePosts } from "@/hooks/usePosts";
import { PostList } from "@/components/board/PostList";
import { PageSpinner } from "@/components/ui/Spinner";

export function BoardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data: board, isLoading: boardLoading } = useBoardBySlug(slug ?? "");
  const { data: result, isLoading: postsLoading } = usePosts(
    board?.id ?? "",
    page,
    board?.posts_per_page ?? 15,
    search || undefined
  );

  if (boardLoading) return <PageSpinner />;
  if (!board) return <Navigate to="/" replace />;

  return (
    <PostList
      board={board}
      posts={result?.data ?? []}
      total={result?.meta.total ?? 0}
      page={page}
      perPage={board.posts_per_page}
      onPageChange={(p) => { setPage(p); window.scrollTo(0, 0); }}
      isLoading={postsLoading}
      search={search}
      onSearchChange={(q) => { setSearch(q); setPage(1); }}
    />
  );
}
