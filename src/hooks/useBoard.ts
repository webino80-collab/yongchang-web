import { useQuery } from "@tanstack/react-query";
import { boardService } from "@/lib/boardService";

export function useBoards() {
  return useQuery({
    queryKey: ["boards"],
    queryFn: () => boardService.getBoards(),
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });
}

export function useBoardBySlug(slug: string) {
  return useQuery({
    queryKey: ["board", slug],
    queryFn: () => boardService.getBoardBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}
