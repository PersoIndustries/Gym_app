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
          logo_url: string | null
          mode: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          logo_url?: string | null
          mode?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          logo_url?: string | null
          mode?: string
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
          session: Json
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
          session?: Json
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
          session?: Json
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
      community_events: {
        Row: {
          activity_type_ids: string[]
          capacity: number | null
          categories: string[]
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          featured: boolean
          format: string
          id: string
          kind: string
          location: string | null
          price_cents: number | null
          review_note: string | null
          scope: string
          starts_at: string
          status: string
          tenant_id: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          activity_type_ids?: string[]
          capacity?: number | null
          categories?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          featured?: boolean
          format?: string
          id?: string
          kind?: string
          location?: string | null
          price_cents?: number | null
          review_note?: string | null
          scope?: string
          starts_at: string
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          activity_type_ids?: string[]
          capacity?: number | null
          categories?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          featured?: boolean
          format?: string
          id?: string
          kind?: string
          location?: string | null
          price_cents?: number | null
          review_note?: string | null
          scope?: string
          starts_at?: string
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          category: string | null
          created_at: string
          event_id: string
          id: string
          intent: string
          looking_for_partner: boolean
          note: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          event_id: string
          id?: string
          intent?: string
          looking_for_partner?: boolean
          note?: string | null
          tenant_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          event_id?: string
          id?: string
          intent?: string
          looking_for_partner?: boolean
          note?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_tenant_id_fkey"
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
          active: boolean
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
          active?: boolean
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
          active?: boolean
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
      help_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_requests_tenant_id_fkey"
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
          classes_enabled: boolean
          created_at: string
          facility_booking_enabled: boolean
          facility_windows: Json
          id: string
          name: string
          price_cents: number
          tenant_id: string
          trial_class_limit: number | null
          updated_at: string
          weekly_class_limit: number | null
        }
        Insert: {
          allowed_activity_type_ids?: string[]
          allowed_weekdays?: number[]
          classes_enabled?: boolean
          created_at?: string
          facility_booking_enabled?: boolean
          facility_windows?: Json
          id?: string
          name: string
          price_cents?: number
          tenant_id: string
          trial_class_limit?: number | null
          updated_at?: string
          weekly_class_limit?: number | null
        }
        Update: {
          allowed_activity_type_ids?: string[]
          allowed_weekdays?: number[]
          classes_enabled?: boolean
          created_at?: string
          facility_booking_enabled?: boolean
          facility_windows?: Json
          id?: string
          name?: string
          price_cents?: number
          tenant_id?: string
          trial_class_limit?: number | null
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
          alias: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          hide_attendance: boolean
          id: string
          preferred_level_name: string | null
          show_alias: boolean
          updated_at: string
        }
        Insert: {
          alias?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          hide_attendance?: boolean
          id: string
          preferred_level_name?: string | null
          show_alias?: boolean
          updated_at?: string
        }
        Update: {
          alias?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          hide_attendance?: boolean
          id?: string
          preferred_level_name?: string | null
          show_alias?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          affiliate_email: string | null
          affiliate_name: string | null
          code: string
          commission_pct: number
          created_at: string
          discount_pct: number
          duration_months: number | null
          expires_at: string | null
          id: string
          max_uses: number | null
          notes: string | null
          plan_id: string | null
          updated_at: string
          uses: number
        }
        Insert: {
          active?: boolean
          affiliate_email?: string | null
          affiliate_name?: string | null
          code: string
          commission_pct?: number
          created_at?: string
          discount_pct?: number
          duration_months?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          notes?: string | null
          plan_id?: string | null
          updated_at?: string
          uses?: number
        }
        Update: {
          active?: boolean
          affiliate_email?: string | null
          affiliate_name?: string | null
          code?: string
          commission_pct?: number
          created_at?: string
          discount_pct?: number
          duration_months?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          notes?: string | null
          plan_id?: string | null
          updated_at?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_redemptions: {
        Row: {
          billing: string
          code_id: string
          created_at: string
          discount_pct: number
          id: string
          owner_id: string
          plan_id: string
          price_after_cents: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          billing: string
          code_id: string
          created_at?: string
          discount_pct: number
          id?: string
          owner_id: string
          plan_id: string
          price_after_cents: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          billing?: string
          code_id?: string
          created_at?: string
          discount_pct?: number
          id?: string
          owner_id?: string
          plan_id?: string
          price_after_cents?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      saas_plans: {
        Row: {
          advanced_metrics: boolean
          created_at: string
          custom_domain: boolean
          facilities: boolean
          id: string
          max_activity_types: number | null
          max_gyms: number
          max_member_plans: number | null
          max_members: number | null
          max_staff: number | null
          name: string
          price_month_cents: number
          price_year_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          advanced_metrics: boolean
          created_at?: string
          custom_domain: boolean
          facilities: boolean
          id: string
          max_activity_types?: number | null
          max_gyms: number
          max_member_plans?: number | null
          max_members?: number | null
          max_staff?: number | null
          name: string
          price_month_cents: number
          price_year_cents: number
          sort_order: number
          updated_at?: string
        }
        Update: {
          advanced_metrics?: boolean
          created_at?: string
          custom_domain?: boolean
          facilities?: boolean
          id?: string
          max_activity_types?: number | null
          max_gyms?: number
          max_member_plans?: number | null
          max_members?: number | null
          max_staff?: number | null
          name?: string
          price_month_cents?: number
          price_year_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tenant_custom_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          permissions: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          permissions?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          permissions?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_custom_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_invites: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number | null
          membership_plan_id: string | null
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
          membership_plan_id?: string | null
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
          membership_plan_id?: string | null
          requires_approval?: boolean
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          updated_at?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invites_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
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
          invite_id: string | null
          role: Database["public"]["Enums"]["tenant_role"]
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_id?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_id?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_join_requests_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "tenant_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_join_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_levels: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_levels_tenant_id_fkey"
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
          custom_role_id: string | null
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          status: string
          status_note: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_role_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: string
          status_note?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_role_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: string
          status_note?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "tenant_custom_roles"
            referencedColumns: ["id"]
          },
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
          facilities_enabled: boolean
          logo_url: string | null
          rounding_kg: number
          tenant_id: string
          theme_preset: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_cancel_hours?: number
          default_min_attendees?: number
          facilities_enabled?: boolean
          logo_url?: string | null
          rounding_kg?: number
          tenant_id: string
          theme_preset?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_cancel_hours?: number
          default_min_attendees?: number
          facilities_enabled?: boolean
          logo_url?: string | null
          rounding_kg?: number
          tenant_id?: string
          theme_preset?: string
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
      tenant_subscriptions: {
        Row: {
          billing: string
          created_at: string
          discount_pct: number
          discount_until: string | null
          owner_id: string
          plan_id: string
          promo_code_id: string | null
          status: string
          tenant_id: string
          trial_ends_on: string
          updated_at: string
        }
        Insert: {
          billing?: string
          created_at?: string
          discount_pct?: number
          discount_until?: string | null
          owner_id: string
          plan_id: string
          promo_code_id?: string | null
          status?: string
          tenant_id: string
          trial_ends_on?: string
          updated_at?: string
        }
        Update: {
          billing?: string
          created_at?: string
          discount_pct?: number
          discount_until?: string | null
          owner_id?: string
          plan_id?: string
          promo_code_id?: string | null
          status?: string
          tenant_id?: string
          trial_ends_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
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
      user_exercise_levels: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          level_name: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          level_name: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          level_name?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_levels_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exercise_levels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      wod_item_levels: {
        Row: {
          created_at: string
          id: string
          level_id: string
          load_kg: number | null
          notes: string | null
          percent_rm: number | null
          reps: string | null
          tenant_id: string
          updated_at: string
          wod_item_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level_id: string
          load_kg?: number | null
          notes?: string | null
          percent_rm?: number | null
          reps?: string | null
          tenant_id: string
          updated_at?: string
          wod_item_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level_id?: string
          load_kg?: number | null
          notes?: string | null
          percent_rm?: number | null
          reps?: string | null
          tenant_id?: string
          updated_at?: string
          wod_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wod_item_levels_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "tenant_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wod_item_levels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wod_item_levels_wod_item_id_fkey"
            columns: ["wod_item_id"]
            isOneToOne: false
            referencedRelation: "wod_items"
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
          group_key: string | null
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
          group_key?: string | null
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
          group_key?: string | null
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
      activity_catalog: {
        Args: never
        Returns: {
          mode: string
          name: string
        }[]
      }
      add_class_attendee: {
        Args: { _class: string; _user: string }
        Returns: string
      }
      assign_invite_membership: {
        Args: { _invite: string; _user: string }
        Returns: undefined
      }
      book_class: { Args: { _class: string; _intent: string }; Returns: string }
      box_branding: {
        Args: { _code: string }
        Returns: {
          logo_url: string
          name: string
          theme_preset: string
        }[]
      }
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
      check_promo_code: {
        Args: { _code: string }
        Returns: {
          code: string
          discount_pct: number
          duration_months: number
          plan_id: string
        }[]
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
      coach_stats: {
        Args: { _from: string; _tenant: string; _to: string }
        Returns: {
          attendees: number
          capacity: number
          done: number
          pending: number
        }[]
      }
      create_gym_with_activities: {
        Args: {
          _activities: string[]
          _billing: string
          _cancel_hours: number
          _city: string
          _code: string
          _facilities: boolean
          _logo: string
          _min_attendees: number
          _name: string
          _plan: string
          _promo?: string
          _requires_approval: boolean
          _rounding: number
          _theme: string
        }
        Returns: string
      }
      create_gym_with_plan: {
        Args: {
          _billing: string
          _cancel_hours: number
          _city: string
          _code: string
          _facilities: boolean
          _logo: string
          _min_attendees: number
          _name: string
          _plan: string
          _promo?: string
          _requires_approval: boolean
          _rounding: number
          _theme: string
        }
        Returns: string
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
      event_attendees: {
        Args: { _event: string; _tenant: string }
        Returns: {
          avatar_url: string
          category: string
          full_name: string
          intent: string
          looking_for_partner: boolean
          note: string
          user_id: string
        }[]
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
      has_box_content_access: { Args: { _tenant: string }; Returns: boolean }
      has_tenant_permission: {
        Args: { _perm: string; _tenant: string; _uid: string }
        Returns: boolean
      }
      has_tenant_role: {
        Args: {
          _roles: Database["public"]["Enums"]["tenant_role"][]
          _tenant: string
          _uid: string
        }
        Returns: boolean
      }
      is_member_suspended: {
        Args: { _tenant: string; _uid: string }
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
      my_trial_usage: {
        Args: { _tenant: string }
        Returns: {
          class_ids: string[]
          used: number
        }[]
      }
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
