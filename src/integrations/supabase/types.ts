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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_types: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          attended: boolean | null
          class_id: string
          created_at: string
          id: string
          intent: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          class_id: string
          created_at?: string
          id?: string
          intent?: string
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attended?: boolean | null
          class_id?: string
          created_at?: string
          id?: string
          intent?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      class_templates: {
        Row: {
          active: boolean
          activity_type_id: string | null
          cancel_hours_before: number
          capacity: number
          coach_id: string | null
          coach_name: string | null
          created_at: string
          duration_min: number
          id: string
          min_attendees: number
          start_time: string
          tenant_id: string
          title: string
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          activity_type_id?: string | null
          cancel_hours_before?: number
          capacity?: number
          coach_id?: string | null
          coach_name?: string | null
          created_at?: string
          duration_min?: number
          id?: string
          min_attendees?: number
          start_time: string
          tenant_id: string
          title: string
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          activity_type_id?: string | null
          cancel_hours_before?: number
          capacity?: number
          coach_id?: string | null
          coach_name?: string | null
          created_at?: string
          duration_min?: number
          id?: string
          min_attendees?: number
          start_time?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_templates_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          activity_type_id: string | null
          cancel_hours_before: number
          cancelled_reason: string | null
          capacity: number
          coach_id: string | null
          coach_name: string | null
          created_at: string
          ends_at: string
          id: string
          min_attendees: number
          phases: Json
          starts_at: string
          status: string
          template_id: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          activity_type_id?: string | null
          cancel_hours_before?: number
          cancelled_reason?: string | null
          capacity?: number
          coach_id?: string | null
          coach_name?: string | null
          created_at?: string
          ends_at: string
          id?: string
          min_attendees?: number
          phases?: Json
          starts_at: string
          status?: string
          template_id?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          activity_type_id?: string | null
          cancel_hours_before?: number
          cancelled_reason?: string | null
          capacity?: number
          coach_id?: string | null
          coach_name?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          min_attendees?: number
          phases?: Json
          starts_at?: string
          status?: string
          template_id?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          rm_lift: string | null
          tenant_id: string
          updated_at: string
          uses_load: boolean
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          rm_lift?: string | null
          tenant_id: string
          updated_at?: string
          uses_load?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          rm_lift?: string | null
          tenant_id?: string
          updated_at?: string
          uses_load?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "exercises_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          approval_required: boolean
          closes_at: string
          created_at: string
          id: string
          kind: string
          name: string
          opens_at: string
          slot_minutes: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approval_required?: boolean
          closes_at?: string
          created_at?: string
          id?: string
          kind: string
          name: string
          opens_at?: string
          slot_minutes?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approval_required?: boolean
          closes_at?: string
          created_at?: string
          id?: string
          kind?: string
          name?: string
          opens_at?: string
          slot_minutes?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facilities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_reservations: {
        Row: {
          created_at: string
          ends_at: string
          facility_id: string
          id: string
          starts_at: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          facility_id: string
          id?: string
          starts_at: string
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          facility_id?: string
          id?: string
          starts_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_reservations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_reservations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_events: {
        Row: {
          blocks_classes: boolean
          created_at: string
          description: string | null
          ends_at: string
          id: string
          kind: string
          starts_at: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          blocks_classes?: boolean
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          kind?: string
          starts_at: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          blocks_classes?: boolean
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          kind?: string
          starts_at?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          allowed_activity_type_ids: string[]
          allowed_weekdays: number[]
          created_at: string
          facility_windows: Json
          id: string
          name: string
          price_cents: number
          tenant_id: string
          updated_at: string
          weekly_class_limit: number | null
        }
        Insert: {
          allowed_activity_type_ids?: string[]
          allowed_weekdays?: number[]
          created_at?: string
          facility_windows?: Json
          id?: string
          name: string
          price_cents?: number
          tenant_id: string
          updated_at?: string
          weekly_class_limit?: number | null
        }
        Update: {
          allowed_activity_type_ids?: string[]
          allowed_weekdays?: number[]
          created_at?: string
          facility_windows?: Json
          id?: string
          name?: string
          price_cents?: number
          tenant_id?: string
          updated_at?: string
          weekly_class_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          created_at: string
          id: string
          lift: string
          recorded_on: string
          tenant_id: string | null
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          lift: string
          recorded_on?: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          lift?: string
          recorded_on?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      platform_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          hide_attendance: boolean
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          hide_attendance?: boolean
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          hide_attendance?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      roadmap_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          priority: number
          sort_order: number
          status: Database["public"]["Enums"]["roadmap_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          priority?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["roadmap_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          priority?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["roadmap_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_invites: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number | null
          requires_approval: boolean
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          updated_at: string
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          requires_approval?: boolean
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          updated_at?: string
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          requires_approval?: boolean
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          updated_at?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_join_requests: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_join_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          created_at: string
          default_cancel_hours: number
          default_min_attendees: number
          rounding_kg: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_cancel_hours?: number
          default_min_attendees?: number
          rounding_kg?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_cancel_hours?: number
          default_min_attendees?: number
          rounding_kg?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          city: string | null
          created_at: string
          id: string
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_memberships: {
        Row: {
          created_at: string
          ends_on: string | null
          id: string
          plan_id: string
          starts_on: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          id?: string
          plan_id: string
          starts_on?: string
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          id?: string
          plan_id?: string
          starts_on?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wod_items: {
        Row: {
          alternative_to: string | null
          alternatives: string | null
          block: string
          class_id: string
          created_at: string
          exercise_id: string | null
          id: string
          label: string | null
          notes: string | null
          percent_rm: number | null
          position: number
          reps: string | null
          sets: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          alternative_to?: string | null
          alternatives?: string | null
          block?: string
          class_id: string
          created_at?: string
          exercise_id?: string | null
          id?: string
          label?: string | null
          notes?: string | null
          percent_rm?: number | null
          position?: number
          reps?: string | null
          sets?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          alternative_to?: string | null
          alternatives?: string | null
          block?: string
          class_id?: string
          created_at?: string
          exercise_id?: string | null
          id?: string
          label?: string | null
          notes?: string | null
          percent_rm?: number | null
          position?: number
          reps?: string | null
          sets?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wod_items_alternative_to_fkey"
            columns: ["alternative_to"]
            isOneToOne: false
            referencedRelation: "wod_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wod_items_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wod_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wod_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _gen_week: {
        Args: { _tenant: string; _week_start: string }
        Returns: number
      }
      add_class_attendee: {
        Args: { _class: string; _user: string }
        Returns: string
      }
      book_class: { Args: { _class: string; _intent: string }; Returns: string }
      box_coaches: {
        Args: { _tenant: string }
        Returns: {
          avatar_url: string
          full_name: string
          user_id: string
        }[]
      }
      cancel_underfilled_classes: { Args: never; Returns: number }
      change_facility_reservation: {
        Args: { _reservation: string; _status: string }
        Returns: undefined
      }
      class_attendance: {
        Args: { _from: string; _tenant: string; _to: string }
        Returns: {
          class_id: string
          going: number
          maybe: number
          not_going: number
          waitlist: number
        }[]
      }
      class_attendees: {
        Args: { _class: string }
        Returns: {
          attended: boolean
          avatar_url: string
          full_name: string
          intent: string
          status: string
          user_id: string
        }[]
      }
      create_tenant: {
        Args: {
          _city: string
          _code: string
          _name: string
          _requires_approval?: boolean
          _slug: string
        }
        Returns: string
      }
      delete_class_phase: {
        Args: { _class: string; _key: string }
        Returns: undefined
      }
      facility_availability: {
        Args: { _facility: string; _from: string; _to: string }
        Returns: {
          ends_at: string
          starts_at: string
          status: string
        }[]
      }
      generate_week_classes: {
        Args: { _tenant: string; _week_start: string }
        Returns: number
      }
      has_tenant_role: {
        Args: {
          _roles: Database["public"]["Enums"]["tenant_role"][]
          _tenant: string
          _uid: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: { _uid: string }; Returns: boolean }
      is_platform_staff: { Args: { _uid: string }; Returns: boolean }
      is_tenant_member: {
        Args: { _tenant: string; _uid: string }
        Returns: boolean
      }
      join_tenant_with_code: { Args: { _code: string }; Returns: string }
      leave_class: { Args: { _class: string }; Returns: undefined }
      promote_waitlist: { Args: { _class: string }; Returns: undefined }
      request_facility: {
        Args: { _facility: string; _start: string }
        Returns: string
      }
      review_join_request: {
        Args: { _approve: boolean; _id: string }
        Returns: undefined
      }
    }
    Enums: {
      platform_role: "super_admin" | "developer"
      roadmap_status: "pending" | "in_progress" | "done"
      tenant_role: "athlete" | "coach" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      platform_role: ["super_admin", "developer"],
      roadmap_status: ["pending", "in_progress", "done"],
      tenant_role: ["athlete", "coach", "admin"],
    },
  },
} as const
