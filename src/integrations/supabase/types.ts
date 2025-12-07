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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      active_jobs: {
        Row: {
          actual_completion_date: string | null
          agreed_price: number
          bid_id: string
          contract_signed: boolean | null
          contract_signed_at: string | null
          created_at: string | null
          customer_id: string
          expected_completion_date: string | null
          id: string
          job_id: string
          job_status: string
          payment_status: string
          payment_structure: string
          provider_id: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          agreed_price: number
          bid_id: string
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          created_at?: string | null
          customer_id: string
          expected_completion_date?: string | null
          id?: string
          job_id: string
          job_status?: string
          payment_status?: string
          payment_structure?: string
          provider_id: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          agreed_price?: number
          bid_id?: string
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          created_at?: string | null
          customer_id?: string
          expected_completion_date?: string | null
          id?: string
          job_id?: string
          job_status?: string
          payment_status?: string
          payment_structure?: string
          provider_id?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "active_jobs_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_report_schedules: {
        Row: {
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          email: string
          frequency: string
          id: string
          is_active: boolean
          last_sent_at: string | null
          next_send_at: string | null
          provider_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          email: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          next_send_at?: string | null
          provider_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          email?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          next_send_at?: string | null
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_report_schedules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_report_schedules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_portfolio_items: {
        Row: {
          bid_id: string
          id: string
          order_index: number | null
          portfolio_item_id: string
        }
        Insert: {
          bid_id: string
          id?: string
          order_index?: number | null
          portfolio_item_id: string
        }
        Update: {
          bid_id?: string
          id?: string
          order_index?: number | null
          portfolio_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_portfolio_items_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_portfolio_items_portfolio_item_id_fkey"
            columns: ["portfolio_item_id"]
            isOneToOne: false
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          accepted_at: string | null
          id: string
          job_id: string
          materials_included: boolean | null
          price_breakdown: Json | null
          proposal_text: string
          provider_id: string
          quoted_price: number
          status: Database["public"]["Enums"]["bid_status"] | null
          submitted_at: string | null
          timeline_duration_days: number | null
          timeline_start_date: string | null
          warranty_details: string | null
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          job_id: string
          materials_included?: boolean | null
          price_breakdown?: Json | null
          proposal_text: string
          provider_id: string
          quoted_price: number
          status?: Database["public"]["Enums"]["bid_status"] | null
          submitted_at?: string | null
          timeline_duration_days?: number | null
          timeline_start_date?: string | null
          warranty_details?: string | null
        }
        Update: {
          accepted_at?: string | null
          id?: string
          job_id?: string
          materials_included?: boolean | null
          price_breakdown?: Json | null
          proposal_text?: string
          provider_id?: string
          quoted_price?: number
          status?: Database["public"]["Enums"]["bid_status"] | null
          submitted_at?: string | null
          timeline_duration_days?: number | null
          timeline_start_date?: string | null
          warranty_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          active_job_id: string
          additional_cost: number | null
          description: string
          id: string
          proposed_at: string | null
          requested_by: string
          resolved_at: string | null
          status: string
          timeline_impact: number | null
        }
        Insert: {
          active_job_id: string
          additional_cost?: number | null
          description: string
          id?: string
          proposed_at?: string | null
          requested_by: string
          resolved_at?: string | null
          status?: string
          timeline_impact?: number | null
        }
        Update: {
          active_job_id?: string
          additional_cost?: number | null
          description?: string
          id?: string
          proposed_at?: string | null
          requested_by?: string
          resolved_at?: string | null
          status?: string
          timeline_impact?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          job_id: string | null
          provider_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          job_id?: string | null
          provider_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          job_id?: string | null
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          created_at: string
          event_name: string
          event_type: string
          id: string
          metadata: Json | null
          provider_id: string
          source: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          event_type: string
          id?: string
          metadata?: Json | null
          provider_id: string
          source?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          provider_id?: string
          source?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          provider_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_provider_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_provider_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_provider_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_following_provider_id_fkey"
            columns: ["following_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_provider_id_fkey"
            columns: ["following_provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      job_media: {
        Row: {
          id: string
          job_id: string
          media_type: string
          media_url: string
          order_index: number | null
          thumbnail_url: string | null
          uploaded_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          media_type: string
          media_url: string
          order_index?: number | null
          thumbnail_url?: string | null
          uploaded_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          media_type?: string
          media_url?: string
          order_index?: number | null
          thumbnail_url?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_media_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
        ]
      }
      job_updates: {
        Row: {
          active_job_id: string
          created_at: string | null
          id: string
          media_urls: Json | null
          posted_by: string
          update_text: string | null
          update_type: string
        }
        Insert: {
          active_job_id: string
          created_at?: string | null
          id?: string
          media_urls?: Json | null
          posted_by: string
          update_text?: string | null
          update_type: string
        }
        Update: {
          active_job_id?: string
          created_at?: string | null
          id?: string
          media_urls?: Json | null
          posted_by?: string
          update_text?: string | null
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_updates_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs_posted: {
        Row: {
          appointment_type: string | null
          bid_deadline: string | null
          budget_disclosed: boolean | null
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          created_at: string | null
          customer_id: string
          description: string
          id: string
          insurance_required: boolean | null
          is_featured: boolean | null
          is_teleconsultation: boolean | null
          is_urgent: boolean | null
          license_required: boolean | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          materials_included: string | null
          max_bids: number | null
          patient_notes: string | null
          preferred_end_date: string | null
          preferred_start_date: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at: string | null
          urgency: Database["public"]["Enums"]["urgency_level"] | null
        }
        Insert: {
          appointment_type?: string | null
          bid_deadline?: string | null
          budget_disclosed?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          created_at?: string | null
          customer_id: string
          description: string
          id?: string
          insurance_required?: boolean | null
          is_featured?: boolean | null
          is_teleconsultation?: boolean | null
          is_urgent?: boolean | null
          license_required?: boolean | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          materials_included?: string | null
          max_bids?: number | null
          patient_notes?: string | null
          preferred_end_date?: string | null
          preferred_start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Update: {
          appointment_type?: string | null
          bid_deadline?: string | null
          budget_disclosed?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          created_at?: string | null
          customer_id?: string
          description?: string
          id?: string
          insurance_required?: boolean | null
          is_featured?: boolean | null
          is_teleconsultation?: boolean | null
          is_urgent?: boolean | null
          license_required?: boolean | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          materials_included?: string | null
          max_bids?: number | null
          patient_notes?: string | null
          preferred_end_date?: string | null
          preferred_start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title?: string
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_posted_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_lead_time: number
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_lead_time?: number
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_lead_time?: number
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          priority: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_milestones: {
        Row: {
          active_job_id: string
          amount: number
          approved_at: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          milestone_description: string | null
          milestone_name: string
          order_index: number | null
          status: string
        }
        Insert: {
          active_job_id: string
          amount: number
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          milestone_description?: string | null
          milestone_name: string
          order_index?: number | null
          status?: string
        }
        Update: {
          active_job_id?: string
          amount?: number
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          milestone_description?: string | null
          milestone_name?: string
          order_index?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_milestones_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          caption: string | null
          category_id: string | null
          created_at: string | null
          id: string
          is_featured: boolean | null
          media_type: string | null
          media_url: string
          order_index: number | null
          provider_id: string
        }
        Insert: {
          caption?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          media_type?: string | null
          media_url: string
          order_index?: number | null
          provider_id: string
        }
        Update: {
          caption?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          media_type?: string | null
          media_url?: string
          order_index?: number | null
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          id: string
          provider_id: string
          source: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          provider_id: string
          source?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          provider_id?: string
          source?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          credits_balance: number | null
          email: string | null
          first_name: string | null
          id: string
          languages: string[] | null
          last_name: string | null
          phone: string | null
          referral_code: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          credits_balance?: number | null
          email?: string | null
          first_name?: string | null
          id?: string
          languages?: string[] | null
          last_name?: string | null
          phone?: string | null
          referral_code?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          credits_balance?: number | null
          email?: string | null
          first_name?: string | null
          id?: string
          languages?: string[] | null
          last_name?: string | null
          phone?: string | null
          referral_code?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      promoted_ads: {
        Row: {
          ad_type: string
          budget: number
          clicks: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          impressions: number | null
          media_type: string | null
          media_url: string | null
          post_id: string | null
          provider_id: string
          spent: number | null
          start_date: string | null
          status: string
          target_audience: Json | null
          title: string | null
          updated_at: string
        }
        Insert: {
          ad_type?: string
          budget?: number
          clicks?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          media_type?: string | null
          media_url?: string | null
          post_id?: string | null
          provider_id: string
          spent?: number | null
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          ad_type?: string
          budget?: number
          clicks?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          media_type?: string | null
          media_url?: string | null
          post_id?: string | null
          provider_id?: string
          spent?: number | null
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoted_ads_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_ads_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoted_ads_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_addons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number | null
          price: number
          provider_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number | null
          price?: number
          provider_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number | null
          price?: number
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_addons_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_addons_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string | null
          id: string
          is_available: boolean | null
          provider_id: string
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          provider_id: string
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          provider_id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_credentials: {
        Row: {
          coverage_amount: number | null
          created_at: string | null
          credential_type: string
          document_url: string | null
          expiration_date: string | null
          id: string
          is_verified: boolean | null
          issue_date: string | null
          issuing_authority: string | null
          license_number: string | null
          provider_id: string
          title: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          coverage_amount?: number | null
          created_at?: string | null
          credential_type: string
          document_url?: string | null
          expiration_date?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string | null
          issuing_authority?: string | null
          license_number?: string | null
          provider_id: string
          title: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          coverage_amount?: number | null
          created_at?: string | null
          credential_type?: string
          document_url?: string | null
          expiration_date?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string | null
          issuing_authority?: string | null
          license_number?: string | null
          provider_id?: string
          title?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_credentials_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_credentials_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_faqs: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          order_index: number | null
          provider_id: string
          question: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          provider_id: string
          question: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          provider_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_faqs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_faqs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_services: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          fixed_price: number | null
          hourly_rate: number | null
          id: string
          is_quote_based: boolean | null
          provider_id: string
          subcategory_id: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          fixed_price?: number | null
          hourly_rate?: number | null
          id?: string
          is_quote_based?: boolean | null
          provider_id: string
          subcategory_id?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          fixed_price?: number | null
          hourly_rate?: number | null
          id?: string
          is_quote_based?: boolean | null
          provider_id?: string
          subcategory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "service_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          accepted_insurance: string[] | null
          address: string | null
          avg_rating: number | null
          bids_remaining_this_month: number | null
          bio: string | null
          business_name: string
          business_type: string | null
          consultation_duration_minutes: number | null
          contact_email: string | null
          contact_phone: string | null
          cpf_cnpj: string | null
          created_at: string | null
          crm_number: string | null
          google_analytics_id: string | null
          guarantee_info: string | null
          hospital_affiliations: string[] | null
          id: string
          id_type: string | null
          is_background_checked: boolean | null
          is_insured: boolean | null
          is_licensed: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          location_lat: number | null
          location_lng: number | null
          meta_pixel_id: string | null
          passport_number: string | null
          requires_background_check: boolean | null
          response_time_hours: number | null
          service_radius_km: number | null
          specialty_id: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tagline: string | null
          teleconsultation_available: boolean | null
          total_jobs: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          warranty_info: string | null
          years_experience: number | null
        }
        Insert: {
          accepted_insurance?: string[] | null
          address?: string | null
          avg_rating?: number | null
          bids_remaining_this_month?: number | null
          bio?: string | null
          business_name: string
          business_type?: string | null
          consultation_duration_minutes?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          crm_number?: string | null
          google_analytics_id?: string | null
          guarantee_info?: string | null
          hospital_affiliations?: string[] | null
          id?: string
          id_type?: string | null
          is_background_checked?: boolean | null
          is_insured?: boolean | null
          is_licensed?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          meta_pixel_id?: string | null
          passport_number?: string | null
          requires_background_check?: boolean | null
          response_time_hours?: number | null
          service_radius_km?: number | null
          specialty_id?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tagline?: string | null
          teleconsultation_available?: boolean | null
          total_jobs?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          warranty_info?: string | null
          years_experience?: number | null
        }
        Update: {
          accepted_insurance?: string[] | null
          address?: string | null
          avg_rating?: number | null
          bids_remaining_this_month?: number | null
          bio?: string | null
          business_name?: string
          business_type?: string | null
          consultation_duration_minutes?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          crm_number?: string | null
          google_analytics_id?: string | null
          guarantee_info?: string | null
          hospital_affiliations?: string[] | null
          id?: string
          id_type?: string | null
          is_background_checked?: boolean | null
          is_insured?: boolean | null
          is_licensed?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          meta_pixel_id?: string | null
          passport_number?: string | null
          requires_background_check?: boolean | null
          response_time_hours?: number | null
          service_radius_km?: number | null
          specialty_id?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tagline?: string | null
          teleconsultation_available?: boolean | null
          total_jobs?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          warranty_info?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          created_at: string
          customer_email: string | null
          customer_id: string
          customer_phone: string | null
          description: string
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          preferred_start_date: string | null
          provider_id: string | null
          quoted_price: number | null
          responded_at: string | null
          response_message: string | null
          status: string
          timeline_flexibility: string | null
          title: string
          updated_at: string
          urgency: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id: string
          customer_phone?: string | null
          description: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          preferred_start_date?: string | null
          provider_id?: string | null
          quoted_price?: number | null
          responded_at?: string | null
          response_message?: string | null
          status?: string
          timeline_flexibility?: string | null
          title: string
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string
          customer_phone?: string | null
          description?: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          preferred_start_date?: string | null
          provider_id?: string | null
          quoted_price?: number | null
          responded_at?: string | null
          response_message?: string | null
          status?: string
          timeline_flexibility?: string | null
          title?: string
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          amount: number
          created_at: string | null
          credited_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          milestone_count: number | null
          reward_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          credited_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          milestone_count?: number | null
          reward_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          credited_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          milestone_count?: number | null
          reward_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          activated_at: string | null
          bonus_credit: number | null
          created_at: string | null
          credit_amount: number | null
          credited_at: string | null
          id: string
          referral_code: string
          referral_type: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          activated_at?: string | null
          bonus_credit?: number | null
          created_at?: string | null
          credit_amount?: number | null
          credited_at?: string | null
          id?: string
          referral_code: string
          referral_type?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          activated_at?: string | null
          bonus_credit?: number | null
          created_at?: string | null
          credit_amount?: number | null
          credited_at?: string | null
          id?: string
          referral_code?: string
          referral_type?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          communication_rating: number | null
          created_at: string | null
          customer_id: string
          id: string
          is_verified: boolean | null
          job_id: string | null
          overall_rating: number
          professionalism_rating: number | null
          provider_id: string
          provider_response: string | null
          punctuality_rating: number | null
          quality_rating: number | null
          value_rating: number | null
        }
        Insert: {
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          customer_id: string
          id?: string
          is_verified?: boolean | null
          job_id?: string | null
          overall_rating: number
          professionalism_rating?: number | null
          provider_id: string
          provider_response?: string | null
          punctuality_rating?: number | null
          quality_rating?: number | null
          value_rating?: number | null
        }
        Update: {
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          customer_id?: string
          id?: string
          is_verified?: boolean | null
          job_id?: string | null
          overall_rating?: number
          professionalism_rating?: number | null
          provider_id?: string
          provider_response?: string | null
          punctuality_rating?: number | null
          quality_rating?: number | null
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reminders: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_triggered_at: string | null
          message: string
          metadata: Json | null
          next_trigger_at: string | null
          related_job_id: string | null
          related_provider_id: string | null
          reminder_type: string
          repeat_interval: string | null
          scheduled_for: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          message: string
          metadata?: Json | null
          next_trigger_at?: string | null
          related_job_id?: string | null
          related_provider_id?: string | null
          reminder_type?: string
          repeat_interval?: string | null
          scheduled_for: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          message?: string
          metadata?: Json | null
          next_trigger_at?: string | null
          related_job_id?: string | null
          related_provider_id?: string | null
          reminder_type?: string
          repeat_interval?: string | null
          scheduled_for?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reminders_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reminders_related_provider_id_fkey"
            columns: ["related_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reminders_related_provider_id_fkey"
            columns: ["related_provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_services: {
        Row: {
          created_at: string
          customer_id: string
          day_of_month: number | null
          day_of_week: number | null
          description: string | null
          duration_minutes: number | null
          end_date: string | null
          frequency: string
          id: string
          last_completed_date: string | null
          next_scheduled_date: string | null
          notes: string | null
          preferred_time: string | null
          price_per_visit: number | null
          provider_id: string
          service_id: string | null
          start_date: string
          status: string
          title: string
          total_visits: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          frequency?: string
          id?: string
          last_completed_date?: string | null
          next_scheduled_date?: string | null
          notes?: string | null
          preferred_time?: string | null
          price_per_visit?: number | null
          provider_id: string
          service_id?: string | null
          start_date: string
          status?: string
          title: string
          total_visits?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          frequency?: string
          id?: string
          last_completed_date?: string | null
          next_scheduled_date?: string | null
          notes?: string | null
          preferred_time?: string | null
          price_per_visit?: number | null
          provider_id?: string
          service_id?: string | null
          start_date?: string
          status?: string
          title?: string
          total_visits?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "provider_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name_en: string
          name_pt: string
          order_index: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name_en: string
          name_pt: string
          order_index?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name_en?: string
          name_pt?: string
          order_index?: number | null
        }
        Relationships: []
      }
      service_instances: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          scheduled_date: string
          scheduled_service_id: string
          scheduled_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date: string
          scheduled_service_id: string
          scheduled_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date?: string
          scheduled_service_id?: string
          scheduled_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_instances_scheduled_service_id_fkey"
            columns: ["scheduled_service_id"]
            isOneToOne: false
            referencedRelation: "scheduled_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          name_en: string
          name_pt: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          name_en: string
          name_pt: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          name_en?: string
          name_pt?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_warranties: {
        Row: {
          created_at: string
          description: string | null
          duration_months: number | null
          id: string
          service_id: string
          title: string
          warranty_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          service_id: string
          title: string
          warranty_type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          service_id?: string
          title?: string
          warranty_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_warranties_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "provider_services"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string
          id: string
          is_promoted: boolean | null
          likes_count: number | null
          media_type: string
          media_url: string
          promotion_budget: number | null
          promotion_end_date: string | null
          promotion_start_date: string | null
          promotion_status: string | null
          provider_id: string
          show_book_now: boolean
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          is_promoted?: boolean | null
          likes_count?: number | null
          media_type?: string
          media_url: string
          promotion_budget?: number | null
          promotion_end_date?: string | null
          promotion_start_date?: string | null
          promotion_status?: string | null
          provider_id: string
          show_book_now?: boolean
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          is_promoted?: boolean | null
          likes_count?: number | null
          media_type?: string
          media_url?: string
          promotion_budget?: number | null
          promotion_end_date?: string | null
          promotion_start_date?: string | null
          promotion_status?: string | null
          provider_id?: string
          show_book_now?: boolean
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_meetings: {
        Row: {
          active_job_id: string | null
          created_at: string
          duration_minutes: number | null
          guest_user_id: string | null
          host_user_id: string
          id: string
          job_id: string | null
          meeting_id: string | null
          meeting_type: string
          meeting_url: string | null
          notes: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          active_job_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          guest_user_id?: string | null
          host_user_id: string
          id?: string
          job_id?: string | null
          meeting_id?: string | null
          meeting_type?: string
          meeting_url?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          active_job_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          guest_user_id?: string | null
          host_user_id?: string
          id?: string
          job_id?: string | null
          meeting_id?: string | null
          meeting_type?: string
          meeting_url?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_meetings_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_meetings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
        ]
      }
      video_testimonials: {
        Row: {
          approved_at: string | null
          created_at: string
          customer_id: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          job_id: string | null
          provider_id: string
          thumbnail_url: string | null
          title: string | null
          video_url: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          job_id?: string | null
          provider_id: string
          thumbnail_url?: string | null
          title?: string | null
          video_url: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          job_id?: string | null
          provider_id?: string
          thumbnail_url?: string | null
          title?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_testimonials_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_testimonials_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_testimonials_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      work_approval_media: {
        Row: {
          active_job_id: string
          approved_at: string | null
          caption: string | null
          created_at: string
          customer_feedback: string | null
          id: string
          media_type: string
          media_url: string
          rejected_at: string | null
          status: string
          thumbnail_url: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          active_job_id: string
          approved_at?: string | null
          caption?: string | null
          created_at?: string
          customer_feedback?: string | null
          id?: string
          media_type?: string
          media_url: string
          rejected_at?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          active_job_id?: string
          approved_at?: string | null
          caption?: string | null
          created_at?: string
          customer_feedback?: string | null
          id?: string
          media_type?: string
          media_url?: string
          rejected_at?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_approval_media_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          state: string | null
          user_id: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          state?: string | null
          user_id?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          state?: string | null
          user_id?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      providers_public: {
        Row: {
          avg_rating: number | null
          bio: string | null
          business_name: string | null
          business_type: string | null
          created_at: string | null
          google_analytics_id: string | null
          guarantee_info: string | null
          id: string | null
          is_background_checked: boolean | null
          is_insured: boolean | null
          is_licensed: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          location_lat: number | null
          location_lng: number | null
          meta_pixel_id: string | null
          response_time_hours: number | null
          service_radius_km: number | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tagline: string | null
          total_jobs: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          warranty_info: string | null
          years_experience: number | null
        }
        Insert: {
          avg_rating?: number | null
          bio?: string | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string | null
          google_analytics_id?: string | null
          guarantee_info?: string | null
          id?: string | null
          is_background_checked?: boolean | null
          is_insured?: boolean | null
          is_licensed?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          meta_pixel_id?: string | null
          response_time_hours?: number | null
          service_radius_km?: number | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tagline?: string | null
          total_jobs?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          warranty_info?: string | null
          years_experience?: number | null
        }
        Update: {
          avg_rating?: number | null
          bio?: string | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string | null
          google_analytics_id?: string | null
          guarantee_info?: string | null
          id?: string | null
          is_background_checked?: boolean | null
          is_insured?: boolean | null
          is_licensed?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          meta_pixel_id?: string | null
          response_time_hours?: number | null
          service_radius_km?: number | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tagline?: string | null
          total_jobs?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          warranty_info?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      bid_status:
        | "submitted"
        | "under_review"
        | "accepted"
        | "declined"
        | "withdrawn"
        | "expired"
      job_status:
        | "accepting_bids"
        | "bid_accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      payment_status:
        | "pending_deposit"
        | "deposit_received"
        | "full_payment_held"
        | "milestone_partial"
        | "completed"
      subscription_tier: "free" | "pro" | "elite" | "enterprise"
      urgency_level: "emergency" | "asap" | "flexible" | "scheduled"
      user_type: "customer" | "provider"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      bid_status: [
        "submitted",
        "under_review",
        "accepted",
        "declined",
        "withdrawn",
        "expired",
      ],
      job_status: [
        "accepting_bids",
        "bid_accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      payment_status: [
        "pending_deposit",
        "deposit_received",
        "full_payment_held",
        "milestone_partial",
        "completed",
      ],
      subscription_tier: ["free", "pro", "elite", "enterprise"],
      urgency_level: ["emergency", "asap", "flexible", "scheduled"],
      user_type: ["customer", "provider"],
    },
  },
} as const
