// ============================================================
// 그누보드 → Supabase 공통 타입 정의
// ============================================================

export interface Profile {
  id: string;
  nickname: string;
  level: number; // 1~10
  point: number;
  email_verified: boolean;
  is_admin: boolean;
  phone?: string;
  homepage?: string;
  birth_date?: string;
  memo?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BoardGroup {
  id: string;
  name: string;
  admin_id?: string;
  display_order: number;
  created_at: string;
}

export interface Board {
  id: string;
  group_id?: string;
  table_name: string; // URL slug
  subject: string;
  skin: "basic" | "gallery" | "product";
  read_level: number;
  write_level: number;
  comment_level: number;
  use_comment: boolean;
  use_upload: boolean;
  upload_count: number;
  upload_size: number;
  posts_per_page: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  // join
  board_groups?: BoardGroup;
}

export interface Post {
  id: string;
  board_id: string;
  author_id?: string;
  author_name?: string;
  subject: string;
  content: string;
  password?: string;
  is_notice: boolean;
  view_count: number;
  good_count: number;
  bad_count: number;
  parent_id?: string;
  reply_depth: number;
  reply_order: string;
  ip?: string;
  created_at: string;
  updated_at: string;
  // join
  profiles?: Pick<Profile, "id" | "nickname" | "avatar_url" | "level">;
  boards?: Pick<Board, "id" | "table_name" | "subject" | "skin">;
  files?: PostFile[];
  comments?: Comment[];
}

export interface Comment {
  id: string;
  post_id: string;
  author_id?: string;
  author_name?: string;
  content: string;
  password?: string;
  parent_id?: string;
  ip?: string;
  created_at: string;
  // join
  profiles?: Pick<Profile, "id" | "nickname" | "avatar_url">;
}

export interface PostFile {
  id: string;
  post_id: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size: number;
  download_count: number;
  created_at: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  is_read: boolean;
  reply_content?: string;
  replied_at?: string;
  ip?: string;
  created_at: string;
}

export interface HeroSlide {
  id: string;
  image_url: string;
  /** 메인 카피(국문). 첫 줄바꿈으로 제목 1·2줄 구분 */
  main_text: string;
  /** 메인 카피(영문). 마이그레이션 전 행은 null/누락일 수 있음 */
  main_text_en?: string | null;
  /** 서브 카피(국문) */
  sub_text: string | null;
  /** 서브 카피(영문) */
  sub_text_en?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

/** 메인 히어로 바로 아래 롤링(이미지만, 최대 3장) */
export interface HomeRollingSlide {
  id: string;
  image_url: string;
  /** 영문 사이트용. 없으면 `image_url` 사용 */
  image_url_en?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface HomeProduct {
  id: string;
  title_ko: string;
  title_en: string;
  desc_ko: string | null;
  desc_en: string | null;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

/** 제품 규격표 한 행 (관리자 규격 정보) */
export interface ProductSpecRow {
  /** 천자침(anesthesia) 서브구분일 때만 사용 — Model 열 */
  model?: string;
  gauge: string;
  length: string;
  color_hex: string;
  /** 규격 "타입" (I.D.(ETW) 등, DB·JSON 키는 wall_type 유지) */
  wall_type: string;
  measurement: string;
}

export interface Product {
  id: string;
  title_ko: string;
  title_en: string;
  desc_ko: string | null;
  desc_en: string | null;
  image_url: string | null;
  /** 상세 갤러리 추가 이미지 (대표 image_url 뒤에 이어서 표시, DB 기본값 []) */
  gallery_urls: string[];
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  subtitle_ko: string | null;
  subtitle_en: string | null;
  summary_ko: string | null;
  summary_en: string | null;
  /** 특징 5줄 (운영 폼과 동일, 길이 5 권장) */
  features_ko: string[];
  features_en: string[];
  detail_html_ko: string | null;
  detail_html_en: string | null;
  spec_subtype: string | null;
  spec_rows: ProductSpecRow[];
}

/** 제품 분류 — `products.category` 값과 `slug`가 동일 */
export interface ProductCategory {
  slug: string;
  label_ko: string;
  label_en: string;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

export interface Certificate {
  id: string;
  title_ko: string;
  title_en: string | null;
  cert_type: string;
  image_url: string | null;
  issued_by: string | null;
  issued_year: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Brochure {
  id: string;
  title_ko: string;
  title_en: string | null;
  desc_ko: string | null;
  desc_en: string | null;
  cover_image_url: string | null;
  file_url: string | null;
  file_size: number | null;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface PageBanner {
  id: string;
  page_key: string;
  image_url: string | null;
  title_ko: string | null;
  title_en: string | null;
  subtitle_ko: string | null;
  subtitle_en: string | null;
  is_active: boolean;
  updated_at: string;
}

/** About 연혁 한 줄(월·국문·영문) */
export interface AboutTimelineEvent {
  date: string;
  ko: string;
  en: string;
}

/** About 연혁 연도 블록 (`img_path`: imgBase 기준 상대경로 또는 http(s) URL) */
export interface AboutTimelineYear {
  year: string;
  img_path: string | null;
  events: AboutTimelineEvent[];
}

/** /board/product 랜딩 2×2 카드 (카테고리 키 = browse 필터와 동일) */
export interface ProductLandingCategory {
  category: string;
  title_ko: string;
  title_en: string;
  desc_ko: string;
  desc_en: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

export interface SiteConfig {
  key: string;
  value: string;
  updated_at: string;
}

// ---- Form Types ----

export interface PostWriteForm {
  subject: string;
  content: string;
  password?: string;
  is_notice?: boolean;
}

export interface CommentForm {
  content: string;
  password?: string;
}

export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  nickname: string;
}

// ---- Pagination ----

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
