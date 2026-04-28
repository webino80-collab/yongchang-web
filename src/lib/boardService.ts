import { supabase } from "./supabaseClient";
import type { Board, Post, Comment, PostFile, PaginatedResult } from "@/types";

// ---- Boards ----

export const boardService = {
  async getBoards(): Promise<Board[]> {
    const { data, error } = await supabase
      .from("boards")
      .select("*, board_groups(*)")
      .eq("is_active", true)
      .order("display_order");
    if (error) throw error;
    return data as unknown as Board[];
  },

  async getBoardBySlug(slug: string): Promise<Board | null> {
    const { data, error } = await supabase
      .from("boards")
      .select("*, board_groups(*)")
      .eq("table_name", slug)
      .eq("is_active", true)
      .single();
    if (error) return null;
    return data as unknown as Board;
  },

  // ---- Posts ----

  async getPosts(
    boardId: string,
    page = 1,
    perPage = 15,
    search?: string
  ): Promise<PaginatedResult<Post>> {
    let query = supabase
      .from("posts")
      .select("id, board_id, author_id, author_name, subject, is_notice, view_count, good_count, bad_count, parent_id, reply_depth, reply_order, created_at, profiles(id, nickname, avatar_url, level)", {
        count: "exact",
      })
      .eq("board_id", boardId)
      .is("parent_id", null); // 최상위 글만

    if (search) {
      query = query.ilike("subject", `%${search}%`);
    }

    // 공지 먼저, 그 다음 최신순
    const { data, error, count } = await query
      .order("is_notice", { ascending: false })
      .order("created_at", { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (error) throw error;
    const total = count ?? 0;

    return {
      data: data as unknown as Post[],
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async getPost(postId: string): Promise<Post | null> {
    // 조회수 증가 (best-effort)
    const { data: current } = await supabase
      .from("posts")
      .select("view_count")
      .eq("id", postId)
      .single();
    if (current) {
      await supabase
        .from("posts")
        .update({ view_count: (current.view_count ?? 0) + 1 } as never)
        .eq("id", postId);
    }

    const { data, error } = await supabase
      .from("posts")
      .select(
        "*, profiles(id, nickname, avatar_url, level), boards(id, table_name, subject, skin, use_comment, use_upload, comment_level, write_level), files(*)"
      )
      .eq("id", postId)
      .single();
    if (error) return null;
    return data as unknown as Post;
  },

  async createPost(
    boardId: string,
    authorId: string | null,
    payload: {
      subject: string;
      content: string;
      author_name?: string;
      password?: string;
      is_notice?: boolean;
      parent_id?: string;
      reply_depth?: number;
      reply_order?: string;
    }
  ): Promise<Post> {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        board_id: boardId,
        author_id: authorId,
        ...payload,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Post;
  },

  async updatePost(
    postId: string,
    payload: { subject?: string; content?: string }
  ): Promise<Post> {
    const { data, error } = await supabase
      .from("posts")
      .update(payload)
      .eq("id", postId)
      .select()
      .single();
    if (error) throw error;
    return data as Post;
  },

  async deletePost(postId: string) {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;
  },

  async votePost(postId: string, type: "good" | "bad") {
    const { data: current } = await supabase
      .from("posts")
      .select("good_count, bad_count")
      .eq("id", postId)
      .single();
    if (!current) throw new Error("Post not found");
    const update =
      type === "good"
        ? { good_count: current.good_count + 1 }
        : { bad_count: current.bad_count + 1 };
    const { error } = await supabase.from("posts").update(update).eq("id", postId);
    if (error) throw error;
  },

  // ---- Comments ----

  async getComments(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles(id, nickname, avatar_url)")
      .eq("post_id", postId)
      .order("created_at");
    if (error) throw error;
    return data as unknown as Comment[];
  },

  async createComment(
    postId: string,
    authorId: string | null,
    payload: { content: string; author_name?: string; password?: string; parent_id?: string }
  ): Promise<Comment> {
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: authorId, ...payload })
      .select("*, profiles(id, nickname, avatar_url)")
      .single();
    if (error) throw error;
    return data as unknown as Comment;
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (error) throw error;
  },

  // ---- Files ----

  async uploadFile(postId: string, file: File): Promise<PostFile> {
    const path = `board-files/${postId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("board-files")
      .upload(path, file);
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("files")
      .insert({
        post_id: postId,
        storage_path: path,
        original_name: file.name,
        mime_type: file.type,
        size: file.size,
      })
      .select()
      .single();
    if (error) throw error;
    return data as PostFile;
  },

  async deleteFile(fileId: string, storagePath: string) {
    await supabase.storage.from("board-files").remove([storagePath]);
    const { error } = await supabase.from("files").delete().eq("id", fileId);
    if (error) throw error;
  },

  getFileUrl(storagePath: string): string {
    const { data } = supabase.storage
      .from("board-files")
      .getPublicUrl(storagePath);
    return data.publicUrl;
  },
};
