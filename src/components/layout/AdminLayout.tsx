import { useEffect } from "react";
import { Link, NavLink, Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PageSpinner } from "@/components/ui/Spinner";
import { clsx } from "clsx";
import { authService } from "@/lib/authService";
import {
  isLevel5ContentAdmin,
  isLevel5AdminPathAllowed,
  LEVEL5_ADMIN_DEFAULT_PATH,
  LEVEL5_ADMIN_NAV_PATHS,
} from "@/lib/adminAccess";

const LEVEL5_NAV_ORDER = new Map<string, number>(
  LEVEL5_ADMIN_NAV_PATHS.map((p, i) => [p, i])
);

const navItems = [
  { to: "/admin",              label: "대시보드",        icon: "📊", exact: true },
  { to: "/admin/visual",       label: "비주얼 관리",     icon: "🖼️" },
  { to: "/admin/home-products",label: "홈 제품 관리",    icon: "🏠" },
  { to: "/admin/page-banners", label: "페이지 배너 관리", icon: "🖼️" },
  { to: "/admin/product-landing", label: "제품 랜딩 카드", icon: "▦" },
  { to: "/admin/products",     label: "제품소개 관리",   icon: "💉" },
  { to: "/admin/certificates", label: "특허·인증 관리",  icon: "📜" },
  { to: "/admin/brochures",    label: "브로셔 관리",     icon: "📂" },
  { to: "/admin/boards",       label: "게시판 관리",     icon: "📋" },
  { to: "/admin/create-operator", label: "운영자 계정 생성", icon: "➕" },
  { to: "/admin/members",      label: "회원 관리",       icon: "👥" },
  { to: "/admin/posts",        label: "게시글 관리",     icon: "📝" },
  { to: "/admin/inquiries",    label: "문의 관리",       icon: "💬" },
];

function navItemsForProfile(profile: ReturnType<typeof useAuth>["profile"]) {
  if (!isLevel5ContentAdmin(profile)) return navItems;
  const allowed = new Set<string>(LEVEL5_ADMIN_NAV_PATHS);
  return navItems
    .filter((item) => allowed.has(item.to))
    .sort((a, b) => (LEVEL5_NAV_ORDER.get(a.to) ?? 99) - (LEVEL5_NAV_ORDER.get(b.to) ?? 99));
}

export function AdminLayout() {
  const { user, profile, loading, profileLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const level5Content = isLevel5ContentAdmin(profile);

  /** 레벨 5: 탭/창을 닫을 때 등 pagehide 시 세션 종료(SPA 내 /admin 전환에는 발생하지 않음). 새로고침 시에도 호출될 수 있음 */
  useEffect(() => {
    if (!level5Content) return;
    const onPageHide = (e: PageTransitionEvent) => {
      if (e.persisted) return;
      void authService.signOut();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [level5Content]);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  if (loading || (user && profileLoading)) return <PageSpinner />;

  // profiles.is_admin 또는 Supabase app_metadata.is_admin 둘 중 하나라도 true면 허용
  const isAdmin = profile?.is_admin === true || user?.app_metadata?.is_admin === true;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const sidebarNav = navItemsForProfile(profile);

  const mainContent =
    level5Content && !isLevel5AdminPathAllowed(location.pathname) ? (
      <Navigate to={LEVEL5_ADMIN_DEFAULT_PATH} replace />
    ) : (
      <Outlet />
    );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-60 bg-[#0f2d52] text-gray-300 flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <Link to="/" className="block">
            <p className="text-[10px] tracking-widest text-blue-300 uppercase mb-0.5">Admin Panel</p>
            <p className="text-white font-bold text-lg leading-tight">주식회사 용창</p>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {sidebarNav.map(({ to, label, icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-[#2e7cf6] text-white font-semibold"
                    : "hover:bg-white/10 hover:text-white"
                )
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2e7cf6] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(profile?.nickname?.[0] ?? user?.email?.[0] ?? "A").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{profile?.nickname ?? user?.email ?? "관리자"}</p>
              <p className="text-blue-300 text-[11px] truncate">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/"
            className="mt-3 flex items-center justify-center gap-1.5 w-full text-xs text-gray-400 hover:text-white transition-colors py-1.5 rounded hover:bg-white/10"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            사이트로 이동
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-1 flex items-center justify-center gap-1.5 w-full text-xs text-gray-400 hover:text-white transition-colors py-1.5 rounded hover:bg-white/10"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* 본문 */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between shrink-0">
          <h1 className="text-sm font-semibold text-gray-700">관리자 패널</h1>
          <div className="flex items-center gap-3">
            <span className="badge badge-navy">{level5Content ? "콘텐츠 관리자" : "관리자"}</span>
            <span className="text-sm text-gray-500">{profile?.nickname ?? user?.email}</span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="text-sm text-gray-500 hover:text-[#0f2d52] underline-offset-2 hover:underline"
            >
              로그아웃
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {mainContent}
        </main>
      </div>
    </div>
  );
}
