import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { PageSpinner } from "@/components/ui/Spinner";

interface Stats {
  members: number;
  posts: number;
  comments: number;
  inquiries: number;
  unreadInquiries: number;
}

async function fetchStats(): Promise<Stats> {
  const safe = async (label: string, run: () => Promise<{ count: number | null }>) => {
    try {
      const r = await run();
      return r.count ?? 0;
    } catch (e) {
      console.warn(`[Dashboard] ${label} 실패:`, e);
      return 0;
    }
  };

  const [members, posts, comments, inquiries, unread] = await Promise.all([
    safe("members", async () => {
      const { count, error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    safe("posts", async () => {
      const { count, error } = await supabase.from("posts").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    safe("comments", async () => {
      const { count, error } = await supabase.from("comments").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    safe("inquiries", async () => {
      const { count, error } = await supabase.from("contact_inquiries").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    safe("unread", async () => {
      const { count, error } = await supabase
        .from("contact_inquiries")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw error;
      return { count };
    }),
  ]);

  return { members, posts, comments, inquiries, unreadInquiries: unread };
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchStats,
    retry: 0,
    staleTime: 30_000,
  });

  if (isLoading && !data) return <PageSpinner />;

  const stats = data ?? { members: 0, posts: 0, comments: 0, inquiries: 0, unreadInquiries: 0 };
  const cards = [
    { label: "전체 회원", value: stats.members, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "전체 게시글", value: stats.posts, color: "text-green-600", bg: "bg-green-50" },
    { label: "전체 댓글", value: stats.comments, color: "text-purple-600", bg: "bg-purple-50" },
    {
      label: "미확인 문의",
      value: stats.unreadInquiries,
      total: stats.inquiries,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl p-5`}>
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color}`}>
              {card.value.toLocaleString()}
            </p>
            {card.total !== undefined && (
              <p className="text-xs text-gray-400 mt-1">
                전체 {card.total.toLocaleString()}건
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-3">빠른 메뉴</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "게시판 관리", to: "/admin/boards" },
            { label: "회원 관리", to: "/admin/members" },
            { label: "게시글 관리", to: "/admin/posts" },
            { label: "문의 관리", to: "/admin/inquiries" },
          ].map(({ label, to }) => (
            <a
              key={to}
              href={to}
              className="btn btn-secondary text-center no-underline"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
