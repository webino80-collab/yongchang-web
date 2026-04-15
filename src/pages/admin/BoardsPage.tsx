import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { PageSpinner } from "@/components/ui/Spinner";
import type { Board } from "@/types";

async function fetchAllBoards(): Promise<Board[]> {
  const { data, error } = await supabase
    .from("boards")
    .select("*, board_groups(*)")
    .order("display_order");
  if (error) throw error;
  return data as unknown as Board[];
}

export function BoardsPage() {
  const queryClient = useQueryClient();
  const { data: boards = [], isLoading } = useQuery({
    queryKey: ["admin-boards"],
    queryFn: fetchAllBoards,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("boards").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-boards"] }),
  });

  const deleteBoard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("boards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-boards"] }),
  });

  if (isLoading && !boards.length) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">게시판 관리</h1>
        <a href="/admin/boards/new" className="btn btn-primary btn-sm">
          + 게시판 추가
        </a>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">게시판명</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium hidden sm:table-cell">슬러그</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium hidden md:table-cell">스킨</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium">상태</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {boards?.map((board) => (
              <tr key={board.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{board.subject}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell font-mono text-xs">
                  {board.table_name}
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <span className="badge badge-blue">{board.skin}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() =>
                      toggleActive.mutate({ id: board.id, is_active: !board.is_active })
                    }
                    className={`badge ${board.is_active ? "badge-green" : "badge-red"} cursor-pointer`}
                  >
                    {board.is_active ? "활성" : "비활성"}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <a
                      href={`/admin/boards/${board.id}/edit`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      수정
                    </a>
                    <button
                      onClick={() => {
                        if (confirm(`"${board.subject}" 게시판을 삭제하시겠습니까? 모든 게시글이 삭제됩니다.`))
                          deleteBoard.mutate(board.id);
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {boards?.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            등록된 게시판이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
