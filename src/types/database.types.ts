export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          admin_id: number | null
          created_at: string | null
          deleted_at: string | null
          id: number
          type: number | null
          updated_at: string | null
        }
        Insert: {
          admin_id?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          type?: number | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          type?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          admin_id: number | null
          allow_working_create: boolean | null
          allow_working_delete: boolean | null
          allow_working_get: boolean | null
          allow_working_update: boolean | null
          created_at: string | null
          deleted_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          admin_id?: number | null
          allow_working_create?: boolean | null
          allow_working_delete?: boolean | null
          allow_working_get?: boolean | null
          allow_working_update?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          admin_id?: number | null
          allow_working_create?: boolean | null
          allow_working_delete?: boolean | null
          allow_working_get?: boolean | null
          allow_working_update?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          auth_user_id: string
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: number
          name: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: number
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: number
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: number
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      m_rank: {
        Row: {
          created_at: string | null
          id: number
          rank: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          rank?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          rank?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      work_videos: {
        Row: {
          created_admin_id: number | null
          created_at: string | null
          deleted_at: string | null
          id: number
          updated_at: string | null
          video_title: string | null
          video_url: string | null
        }
        Insert: {
          created_admin_id?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          updated_at?: string | null
          video_title?: string | null
          video_url?: string | null
        }
        Update: {
          created_admin_id?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          updated_at?: string | null
          video_title?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_videos_created_admin_id_fkey"
            columns: ["created_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_skills: {
        Row: {
          comment: string | null
          created_at: string | null
          deleted_at: string | null
          id: number
          rank_id: number | null
          updated_at: string | null
          worker_id: number | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          rank_id?: number | null
          updated_at?: string | null
          worker_id?: number | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          rank_id?: number | null
          updated_at?: string | null
          worker_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "m_rank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          address: string | null
          auth_user_id: string
          birthday: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          group_id: number | null
          id: number
          name: string | null
          next_visit_date: string | null
          unit_price_ratio: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          auth_user_id: string
          birthday?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          group_id?: number | null
          id?: number
          name?: string | null
          next_visit_date?: string | null
          unit_price_ratio?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          auth_user_id?: string
          birthday?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          group_id?: number | null
          id?: number
          name?: string | null
          next_visit_date?: string | null
          unit_price_ratio?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          delivery_date: string | null
          id: number
          quantity: number | null
          status: number | null
          unit_price: number | null
          updated_at: string | null
          work_title: string | null
          work_videos_id: number | null
          worker_id: number | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          delivery_date?: string | null
          id?: number
          quantity?: number | null
          status?: number | null
          unit_price?: number | null
          updated_at?: string | null
          work_title?: string | null
          work_videos_id?: number | null
          worker_id?: number | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          delivery_date?: string | null
          id?: number
          quantity?: number | null
          status?: number | null
          unit_price?: number | null
          updated_at?: string | null
          work_title?: string | null
          work_videos_id?: number | null
          worker_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "works_user_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_work_videos_id_fkey"
            columns: ["work_videos_id"]
            isOneToOne: false
            referencedRelation: "work_videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
