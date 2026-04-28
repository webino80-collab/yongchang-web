import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { contactService } from "@/lib/contactService";
import { Pagination } from "@/components/ui/Pagination";
import { PageSpinner } from "@/components/ui/Spinner";
import { clsx } from "clsx";
import type { ContactInquiry } from "@/types";

const PER_PAGE = 20;

export function InquiriesPage() {
  const [page, setPage] = useState(1);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [selected, setSelected] = useState<ContactInquiry | null>(null);
  const [replyText, setReplyText] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inquiries", page, onlyUnread],
    queryFn: () => contactService.getInquiries(page, PER_PAGE, onlyUnread),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => contactService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] }),
  });

  const sendReply = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      contactService.sendReply(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      setSelected(null);
      setReplyText("");
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : String(e);
      window.alert(msg);
    },
  });

  const deleteInquiry = useMutation({
    mutationFn: (id: string) => contactService.deleteInquiry(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      if (selected?.id === id) {
        setSelected(null);
        setReplyText("");
      }
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : String(e);
      window.alert(msg);
    },
  });

  const handleOpen = (inquiry: ContactInquiry) => {
    setSelected(inquiry);
    setReplyText(inquiry.reply_content ?? "");
    if (!inquiry.is_read) markRead.mutate(inquiry.id);
  };

  if (isLoading && !data) return <PageSpinner />;

  const totalPages = Math.ceil((data?.total ?? 0) / PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">문의 관리</h1>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyUnread}
            onChange={(e) => { setOnlyUnread(e.target.checked); setPage(1); }}
            className="rounded"
          />
          미확인만 보기
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 목록 */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">제목</th>
                <th className="px-4 py-3 text-center text-gray-600 font-medium hidden sm:table-cell">날짜</th>
                <th className="px-4 py-3 text-center text-gray-600 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((inq) => (
                <tr
                  key={inq.id}
                  onClick={() => handleOpen(inq)}
                  className={clsx(
                    "border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                    selected?.id === inq.id && "bg-indigo-50",
                    !inq.is_read && "font-semibold"
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="text-gray-800 line-clamp-1">{inq.subject}</p>
                    <p className="text-xs text-gray-400">{inq.name} · {inq.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 hidden sm:table-cell text-xs">
                    {format(new Date(inq.created_at), "yy.MM.dd", { locale: ko })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {inq.replied_at ? (
                      <span className="badge badge-green">답변완료</span>
                    ) : inq.is_read ? (
                      <span className="badge badge-blue">확인</span>
                    ) : (
                      <span className="badge badge-red">미확인</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.data.length === 0 && (
            <div className="py-16 text-center text-gray-400">문의가 없습니다.</div>
          )}
          <div className="p-3">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>

        {/* 상세 */}
        {selected ? (
          <div className="card p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">{selected.subject}</h2>
              <div className="text-sm text-gray-500 space-y-0.5">
                <p>이름: {selected.name}</p>
                <p>이메일: {selected.email}</p>
                {selected.phone && <p>연락처: {selected.phone}</p>}
                <p>
                  접수일:{" "}
                  {format(new Date(selected.created_at), "yyyy년 MM월 dd일 HH:mm", { locale: ko })}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-24">
              {selected.message}
            </div>

            <div>
              <label className="label">답변 내용</label>
              <textarea
                rows={5}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답변을 입력하세요"
                className="input resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => sendReply.mutate({ id: selected.id, content: replyText })}
                disabled={!replyText.trim() || sendReply.isPending}
                className="btn btn-primary flex-1"
              >
                {sendReply.isPending ? "저장 중..." : "답변 저장"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    !window.confirm(
                      "이 문의를 삭제할까요? 삭제하면 복구할 수 없습니다.",
                    )
                  ) {
                    return;
                  }
                  deleteInquiry.mutate(selected.id);
                }}
                disabled={deleteInquiry.isPending}
                className="btn border border-red-300 text-red-700 bg-white hover:bg-red-50 flex-1"
              >
                {deleteInquiry.isPending ? "삭제 중..." : "문의 삭제"}
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-8 flex items-center justify-center text-gray-300">
            왼쪽에서 문의를 선택하세요
          </div>
        )}
      </div>
    </div>
  );
}
