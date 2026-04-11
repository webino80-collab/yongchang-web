import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "@/lib/supabaseClient";
import { Pagination } from "@/components/ui/Pagination";
import { PageSpinner } from "@/components/ui/Spinner";
import type { Profile } from "@/types";

const PER_PAGE = 20;

async function fetchMembers(page: number) {
  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (error) throw error;
  return { data: data as Profile[], total: count ?? 0 };
}

export function MembersPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-members", page],
    queryFn: () => fetchMembers(page),
  });

  const updateLevel = useMutation({
    mutationFn: async ({ id, level }: { id: string; level: number }) => {
      const { error } = await supabase.from("profiles").update({ level }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-members"] }),
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ id, is_admin }: { id: string; is_admin: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_admin }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-members"] }),
  });

  if (isLoading && !data) return <PageSpinner />;

  const totalPages = Math.ceil((data?.total ?? 0) / PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        <span className="text-sm text-gray-500">
          전체 {data?.total.toLocaleString()}명
        </span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">닉네임</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium hidden sm:table-cell">레벨</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium hidden md:table-cell">포인트</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium">관리자</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium hidden lg:table-cell">가입일</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((member) => (
              <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{member.nickname}</p>
                  {member.phone && (
                    <p className="text-xs text-gray-400">{member.phone}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <select
                    value={member.level}
                    onChange={(e) =>
                      updateLevel.mutate({ id: member.id, level: Number(e.target.value) })
                    }
                    className="text-sm border border-gray-200 rounded px-1 py-0.5"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-center text-gray-500 hidden md:table-cell">
                  {member.point.toLocaleString()}P
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() =>
                      toggleAdmin.mutate({ id: member.id, is_admin: !member.is_admin })
                    }
                    className={`badge cursor-pointer ${member.is_admin ? "badge-red" : "badge-blue"}`}
                  >
                    {member.is_admin ? "관리자" : "일반"}
                  </button>
                </td>
                <td className="px-4 py-3 text-center text-gray-400 hidden lg:table-cell text-xs">
                  {format(new Date(member.created_at), "yyyy.MM.dd", { locale: ko })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data?.data.length === 0 && (
          <div className="py-16 text-center text-gray-400">회원이 없습니다.</div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
