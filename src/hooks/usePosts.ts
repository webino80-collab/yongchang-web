import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boardService } from "@/lib/boardService";

export function usePosts(
  boardId: string,
  page = 1,
  perPage = 15,
  search?: string
) {
  return useQuery({
    queryKey: ["posts", boardId, page, perPage, search],
    queryFn: () => boardService.getPosts(boardId, page, perPage, search),
    enabled: !!boardId,
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => boardService.getPost(postId),
    enabled: !!postId,
  });
}

export function useCreatePost(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      authorId,
      payload,
    }: {
      authorId: string | null;
      payload: Parameters<typeof boardService.createPost>[2];
    }) => boardService.createPost(boardId, authorId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", boardId] });
    },
  });
}

export function useUpdatePost(postId: string, boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof boardService.updatePost>[1]) =>
      boardService.updatePost(postId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts", boardId] });
    },
  });
}

export function useDeletePost(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => boardService.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", boardId] });
    },
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => boardService.getComments(postId),
    enabled: !!postId,
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      authorId,
      payload,
    }: {
      authorId: string | null;
      payload: Parameters<typeof boardService.createComment>[2];
    }) => boardService.createComment(postId, authorId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => boardService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
}
