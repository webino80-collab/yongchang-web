import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "@/lib/supabaseClient";
import { Pagination } from "@/components/ui/Pagination";
import { PageSpinner } from "@/components/ui/Spinner";
import type { Post } from "@/types";

const PER_PAGE = 20;

async function fetchAllPosts(page: number) {
  const { data, error, count } = await supabase
    .from("posts")
    .select(
      "id, board_id, author_name, subject, view_count, is_notice, created_at, boards(table_name, subject), profiles(nickname)",
      { count: "exact" }
    )
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (error) throw error;
  return { data: data as Post[], total: count ?? 0 };
}

export function PostsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-posts", page],
    queryFn: () => fetchAllPosts(page),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-posts"] }),
  });

  if (isLoading && !data) return <PageSpinner />;

  const totalPages = Math.ceil((data?.total ?? 0) / PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">게시글 관리</h1>
        <span className="text-sm text-gray-500">
          전체 {data?.total.toLocaleString()}건
        </span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium hidden md:table-cell">게시판</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">제목</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium hidden sm:table-cell">작성자</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium hidden lg:table-cell">날짜</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((post) => (
              <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="badge badge-blue">
                    {(post.boards as { subject?: string } | undefined)?.subject ?? "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/board/${(post.boards as { table_name?: string } | undefined)?.table_name ?? ""}/${post.id}`}
                    className="text-gray-800 hover:text-indigo-600 font-medium line-clamp-1"
                  >
                    {post.is_notice && <span className="badge badge-red mr-1">공지</span>}
                    {post.subject}
                  </a>
                </td>
                <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">
                  {(post.profiles as { nickname?: string } | undefined)?.nickname ?? post.author_name ?? "비회원"}
                </td>
                <td className="px-4 py-3 text-center text-gray-400 hidden lg:table-cell text-xs">
                  {format(new Date(post.created_at), "yy.MM.dd HH:mm", { locale: ko })}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => {
                      if (confirm("이 게시글을 삭제하시겠습니까?"))
                        deletePost.mutate(post.id);
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data?.data.length === 0 && (
          <div className="py-16 text-center text-gray-400">게시글이 없습니다.</div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
