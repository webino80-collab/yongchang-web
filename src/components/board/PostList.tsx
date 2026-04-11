import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { clsx } from "clsx";
import type { Post, Board } from "@/types";
import { Pagination } from "@/components/ui/Pagination";
import { PageSpinner } from "@/components/ui/Spinner";

interface PostListProps {
  board: Board;
  posts: Post[];
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  search?: string;
  onSearchChange?: (q: string) => void;
}

export function PostList({
  board,
  posts,
  total,
  page,
  perPage,
  onPageChange,
  isLoading,
  search,
  onSearchChange,
}: PostListProps) {
  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      {/* 게시판 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{board.subject}</h1>
        <Link
          to={`/board/${board.table_name}/write`}
          className="btn btn-primary btn-sm"
        >
          글쓰기
        </Link>
      </div>

      {/* 검색 */}
      {onSearchChange && (
        <form
          className="flex gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
            onSearchChange(q);
          }}
        >
          <input
            name="q"
            type="search"
            defaultValue={search}
            placeholder="제목 검색..."
            className="input max-w-xs"
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            검색
          </button>
        </form>
      )}

      {isLoading ? (
        <PageSpinner />
      ) : (
        <>
          {/* 갤러리 스킨 */}
          {board.skin === "gallery" ? (
            <GalleryGrid posts={posts} board={board} />
          ) : (
            <BasicTable posts={posts} board={board} />
          )}

          {posts.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              등록된 게시물이 없습니다.
            </div>
          )}

          <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
            <span>전체 {total.toLocaleString()}건</span>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
}

function BasicTable({ posts, board }: { posts: Post[]; board: Board }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-t-2 border-gray-900 border-b border-gray-200 text-gray-500">
          <th className="py-2 pr-2 text-center w-12">번호</th>
          <th className="py-2 text-left">제목</th>
          <th className="py-2 text-center w-24 hidden sm:table-cell">작성자</th>
          <th className="py-2 text-center w-24 hidden md:table-cell">날짜</th>
          <th className="py-2 text-center w-12 hidden md:table-cell">조회</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post, idx) => (
          <tr
            key={post.id}
            className={clsx(
              "border-b border-gray-100 hover:bg-gray-50 transition-colors",
              post.is_notice && "bg-amber-50"
            )}
          >
            <td className="py-2 pr-2 text-center text-gray-400">
              {post.is_notice ? (
                <span className="badge badge-red">공지</span>
              ) : (
                idx + 1
              )}
            </td>
            <td className="py-2">
              <Link
                to={`/board/${board.table_name}/${post.id}`}
                className="text-gray-900 hover:text-indigo-600 font-medium no-underline line-clamp-1"
              >
                {post.reply_depth > 0 && (
                  <span className="text-gray-400 mr-1">{"└".padStart(post.reply_depth * 2, " ")}</span>
                )}
                {post.subject}
              </Link>
            </td>
            <td className="py-2 text-center text-gray-500 hidden sm:table-cell">
              {post.profiles?.nickname ?? post.author_name ?? "비회원"}
            </td>
            <td className="py-2 text-center text-gray-400 hidden md:table-cell">
              {format(new Date(post.created_at), "yy.MM.dd", { locale: ko })}
            </td>
            <td className="py-2 text-center text-gray-400 hidden md:table-cell">
              {post.view_count}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GalleryGrid({ posts, board }: { posts: Post[]; board: Board }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {posts.map((post) => (
        <Link
          key={post.id}
          to={`/board/${board.table_name}/${post.id}`}
          className="block card overflow-hidden hover:shadow-md transition-shadow no-underline"
        >
          {post.files?.[0] ? (
            <img
              src={post.files[0].storage_path}
              alt={post.subject}
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-300">
              이미지 없음
            </div>
          )}
          <div className="p-2">
            <p className="text-sm font-medium text-gray-800 line-clamp-1">{post.subject}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {format(new Date(post.created_at), "yy.MM.dd")}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
