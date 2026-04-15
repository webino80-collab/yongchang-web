export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          level: number;
          point: number;
          email_verified: boolean;
          is_admin: boolean;
          phone: string | null;
          homepage: string | null;
          birth_date: string | null;
          memo: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          level?: number;
          point?: number;
          email_verified?: boolean;
          is_admin?: boolean;
          phone?: string | null;
          homepage?: string | null;
          birth_date?: string | null;
          memo?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          nickname?: string;
          level?: number;
          point?: number;
          email_verified?: boolean;
          is_admin?: boolean;
          phone?: string | null;
          homepage?: string | null;
          birth_date?: string | null;
          memo?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      board_groups: {
        Row: {
          id: string;
          name: string;
          admin_id: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          admin_id?: string | null;
          display_order?: number;
        };
        Update: {
          name?: string;
          admin_id?: string | null;
          display_order?: number;
        };
        Relationships: [];
      };
      boards: {
        Row: {
          id: string;
          group_id: string | null;
          table_name: string;
          subject: string;
          skin: string;
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
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          table_name: string;
          subject: string;
          skin?: string;
          read_level?: number;
          write_level?: number;
          comment_level?: number;
          use_comment?: boolean;
          use_upload?: boolean;
          upload_count?: number;
          upload_size?: number;
          posts_per_page?: number;
          is_active?: boolean;
          display_order?: number;
        };
        Update: {
          group_id?: string | null;
          table_name?: string;
          subject?: string;
          skin?: string;
          read_level?: number;
          write_level?: number;
          comment_level?: number;
          use_comment?: boolean;
          use_upload?: boolean;
          upload_count?: number;
          upload_size?: number;
          posts_per_page?: number;
          is_active?: boolean;
          display_order?: number;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          board_id: string;
          author_id: string | null;
          author_name: string | null;
          subject: string;
          content: string;
          password: string | null;
          is_notice: boolean;
          view_count: number;
          good_count: number;
          bad_count: number;
          parent_id: string | null;
          reply_depth: number;
          reply_order: string;
          ip: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          author_id?: string | null;
          author_name?: string | null;
          subject: string;
          content?: string;
          password?: string | null;
          is_notice?: boolean;
          view_count?: number;
          good_count?: number;
          bad_count?: number;
          parent_id?: string | null;
          reply_depth?: number;
          reply_order?: string;
          ip?: string | null;
        };
        Update: {
          subject?: string;
          content?: string;
          password?: string | null;
          is_notice?: boolean;
          parent_id?: string | null;
          reply_depth?: number;
          reply_order?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string | null;
          author_name: string | null;
          content: string;
          password: string | null;
          parent_id: string | null;
          ip: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id?: string | null;
          author_name?: string | null;
          content: string;
          password?: string | null;
          parent_id?: string | null;
          ip?: string | null;
        };
        Update: {
          content?: string;
        };
        Relationships: [];
      };
      files: {
        Row: {
          id: string;
          post_id: string;
          storage_path: string;
          original_name: string;
          mime_type: string;
          size: number;
          download_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          storage_path: string;
          original_name: string;
          mime_type: string;
          size: number;
          download_count?: number;
        };
        Update: {
          download_count?: number;
        };
        Relationships: [];
      };
      contact_inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string;
          message: string;
          is_read: boolean;
          reply_content: string | null;
          replied_at: string | null;
          ip: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          subject: string;
          message: string;
          is_read?: boolean;
          reply_content?: string | null;
          replied_at?: string | null;
          ip?: string | null;
        };
        Update: {
          is_read?: boolean;
          reply_content?: string | null;
          replied_at?: string | null;
        };
        Delete: Record<string, never>;
        Relationships: [];
      };
      site_config: {
        Row: {
          key: string;
          value: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: string | null;
        };
        Update: {
          value?: string | null;
        };
        Relationships: [];
      };
      hero_slides: {
        Row: {
          id: string;
          image_url: string;
          main_text: string;
          main_text_en: string | null;
          sub_text: string | null;
          sub_text_en: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          main_text: string;
          main_text_en?: string | null;
          sub_text?: string | null;
          sub_text_en?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          image_url?: string;
          main_text?: string;
          main_text_en?: string | null;
          sub_text?: string | null;
          sub_text_en?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      home_rolling_slides: {
        Row: {
          id: string;
          image_url: string;
          image_url_en: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          image_url_en?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          image_url?: string;
          image_url_en?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      home_products: {
        Row: {
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
        };
        Insert: {
          id?: string;
          title_ko: string;
          title_en: string;
          desc_ko?: string | null;
          desc_en?: string | null;
          image_url?: string | null;
          link_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title_ko?: string;
          title_en?: string;
          desc_ko?: string | null;
          desc_en?: string | null;
          image_url?: string | null;
          link_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          title_ko: string;
          title_en: string;
          desc_ko: string | null;
          desc_en: string | null;
          image_url: string | null;
          gallery_urls: string[];
          category: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          subtitle_ko: string | null;
          subtitle_en: string | null;
          summary_ko: string | null;
          summary_en: string | null;
          features_ko: string[];
          features_en: string[];
          detail_html_ko: string | null;
          detail_html_en: string | null;
          spec_subtype: string | null;
          spec_rows: Record<string, unknown>[];
          spec_gcc_plus_intro_ko: string | null;
          spec_gcc_plus_intro_en: string | null;
          spec_gcc_plus_tables: unknown | null;
        };
        Insert: {
          id?: string;
          title_ko: string;
          title_en: string;
          desc_ko?: string | null;
          desc_en?: string | null;
          image_url?: string | null;
          gallery_urls?: string[];
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          subtitle_ko?: string | null;
          subtitle_en?: string | null;
          summary_ko?: string | null;
          summary_en?: string | null;
          features_ko?: string[];
          features_en?: string[];
          detail_html_ko?: string | null;
          detail_html_en?: string | null;
          spec_subtype?: string | null;
          spec_rows?: Record<string, unknown>[];
          spec_gcc_plus_intro_ko?: string | null;
          spec_gcc_plus_intro_en?: string | null;
          spec_gcc_plus_tables?: unknown | null;
        };
        Update: {
          title_ko?: string;
          title_en?: string;
          desc_ko?: string | null;
          desc_en?: string | null;
          image_url?: string | null;
          gallery_urls?: string[];
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          subtitle_ko?: string | null;
          subtitle_en?: string | null;
          summary_ko?: string | null;
          summary_en?: string | null;
          features_ko?: string[];
          features_en?: string[];
          detail_html_ko?: string | null;
          detail_html_en?: string | null;
          spec_subtype?: string | null;
          spec_rows?: Record<string, unknown>[];
          spec_gcc_plus_intro_ko?: string | null;
          spec_gcc_plus_intro_en?: string | null;
          spec_gcc_plus_tables?: unknown | null;
        };
        Relationships: [];
      };
      product_categories: {
        Row: {
          slug: string;
          label_ko: string;
          label_en: string;
          sort_order: number;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          slug: string;
          label_ko: string;
          label_en: string;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          label_ko?: string;
          label_en?: string;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      certificates: {
        Row: {
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
        };
        Insert: {
          id?: string;
          title_ko: string;
          title_en?: string | null;
          cert_type?: string;
          image_url?: string | null;
          issued_by?: string | null;
          issued_year?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title_ko?: string;
          title_en?: string | null;
          cert_type?: string;
          image_url?: string | null;
          issued_by?: string | null;
          issued_year?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      brochures: {
        Row: {
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
        };
        Insert: {
          id?: string;
          title_ko: string;
          title_en?: string | null;
          desc_ko?: string | null;
          desc_en?: string | null;
          cover_image_url?: string | null;
          file_url?: string | null;
          file_size?: number | null;
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title_ko?: string;
          title_en?: string | null;
          desc_ko?: string | null;
          desc_en?: string | null;
          cover_image_url?: string | null;
          file_url?: string | null;
          file_size?: number | null;
          category?: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      about_timeline: {
        Row: {
          id: number;
          items: unknown;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: number;
          items: unknown;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          items?: unknown;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      page_banners: {
        Row: {
          id: string;
          page_key: string;
          image_url: string | null;
          title_ko: string | null;
          title_en: string | null;
          subtitle_ko: string | null;
          subtitle_en: string | null;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_key: string;
          image_url?: string | null;
          title_ko?: string | null;
          title_en?: string | null;
          subtitle_ko?: string | null;
          subtitle_en?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          image_url?: string | null;
          title_ko?: string | null;
          title_en?: string | null;
          subtitle_ko?: string | null;
          subtitle_en?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      product_landing_categories: {
        Row: {
          category: string;
          title_ko: string;
          title_en: string;
          desc_ko: string;
          desc_en: string;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          category: string;
          title_ko?: string;
          title_en?: string;
          desc_ko?: string;
          desc_en?: string;
          image_url?: string | null;
          sort_order: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          title_ko?: string;
          title_en?: string;
          desc_ko?: string;
          desc_en?: string;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_contact_inquiry: {
        Args: {
          p_name: string;
          p_email: string;
          p_phone: string;
          p_subject: string;
          p_message: string;
        };
        Returns: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string;
          message: string;
          is_read: boolean;
          reply_content: string | null;
          replied_at: string | null;
          ip: string | null;
          created_at: string;
        };
      };
      delete_contact_inquiry: {
        Args: { p_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
