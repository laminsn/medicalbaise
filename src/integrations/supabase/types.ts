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
    PostgrestVersion: "14.5"
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
          platform: Database["public"]["Enums"]["baise_platform"]
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
          platform?: Database["public"]["Enums"]["baise_platform"]
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
          platform?: Database["public"]["Enums"]["baise_platform"]
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
            referencedRelation: "jobs_marketplace_public"
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
      appointment_reminders: {
        Row: {
          channel: string | null
          created_at: string
          id: string
          job_id: string
          message: string | null
          metadata: Json | null
          patient_id: string
          provider_id: string | null
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          id?: string
          job_id: string
          message?: string | null
          metadata?: Json | null
          patient_id: string
          provider_id?: string | null
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          id?: string
          job_id?: string
          message?: string | null
          metadata?: Json | null
          patient_id?: string
          provider_id?: string | null
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_marketplace_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_reminders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_reminders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_reminders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_type: string | null
          available_slots: number | null
          category_id: string
          chief_complaint: string | null
          consultation_fee_max: number | null
          consultation_fee_min: number | null
          created_at: string | null
          description: string | null
          id: string
          insurance_provider: string | null
          location: string | null
          preferred_datetime: string | null
          status: string | null
          title: string
          updated_at: string | null
          urgency: string | null
          user_id: string | null
        }
        Insert: {
          appointment_type?: string | null
          available_slots?: number | null
          category_id: string
          chief_complaint?: string | null
          consultation_fee_max?: number | null
          consultation_fee_min?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          insurance_provider?: string | null
          location?: string | null
          preferred_datetime?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          urgency?: string | null
          user_id?: string | null
        }
        Update: {
          appointment_type?: string | null
          available_slots?: number | null
          category_id?: string
          chief_complaint?: string | null
          consultation_fee_max?: number | null
          consultation_fee_min?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          insurance_provider?: string | null
          location?: string | null
          preferred_datetime?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          urgency?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
            referencedRelation: "jobs_marketplace_public"
            referencedColumns: ["id"]
          },
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
      campaign_redemptions: {
        Row: {
          app_key: string
          campaign_id: string
          credit_applied: number
          id: string
          metadata: Json
          redeemed_at: string
          source: string
          user_id: string
        }
        Insert: {
          app_key?: string
          campaign_id: string
          credit_applied?: number
          id?: string
          metadata?: Json
          redeemed_at?: string
          source?: string
          user_id: string
        }
        Update: {
          app_key?: string
          campaign_id?: string
          credit_applied?: number
          id?: string
          metadata?: Json
          redeemed_at?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_redemptions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotional_campaigns"
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
      client_testimonial_requests: {
        Row: {
          active_job_id: string | null
          app_key: string
          created_at: string
          customer_id: string
          google_review_url: string | null
          id: string
          job_id: string | null
          last_sent_at: string
          metadata: Json
          monthly_reminder_count: number
          provider_id: string
          recipient_email: string | null
          recipient_name: string | null
          request_source: string
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          active_job_id?: string | null
          app_key?: string
          created_at?: string
          customer_id: string
          google_review_url?: string | null
          id?: string
          job_id?: string | null
          last_sent_at?: string
          metadata?: Json
          monthly_reminder_count?: number
          provider_id: string
          recipient_email?: string | null
          recipient_name?: string | null
          request_source?: string
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          active_job_id?: string | null
          app_key?: string
          created_at?: string
          customer_id?: string
          google_review_url?: string | null
          id?: string
          job_id?: string | null
          last_sent_at?: string
          metadata?: Json
          monthly_reminder_count?: number
          provider_id?: string
          recipient_email?: string | null
          recipient_name?: string | null
          request_source?: string
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_testimonial_requests_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_testimonial_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_marketplace_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_testimonial_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_testimonial_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_testimonial_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      client_testimonial_rewards: {
        Row: {
          active_job_id: string | null
          amount_brl: number
          app_key: string
          approved_at: string | null
          approved_by: string | null
          client_id: string | null
          created_at: string
          credited_at: string | null
          customer_id: string
          id: string
          job_id: string | null
          metadata: Json
          provider_id: string
          referral_code: string | null
          rejection_reason: string | null
          request_id: string | null
          reward_type: string
          status: string
          updated_at: string
        }
        Insert: {
          active_job_id?: string | null
          amount_brl: number
          app_key?: string
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string | null
          created_at?: string
          credited_at?: string | null
          customer_id: string
          id?: string
          job_id?: string | null
          metadata?: Json
          provider_id: string
          referral_code?: string | null
          rejection_reason?: string | null
          request_id?: string | null
          reward_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          active_job_id?: string | null
          amount_brl?: number
          app_key?: string
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string | null
          created_at?: string
          credited_at?: string | null
          customer_id?: string
          id?: string
          job_id?: string | null
          metadata?: Json
          provider_id?: string
          referral_code?: string | null
          rejection_reason?: string | null
          request_id?: string | null
          reward_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_testimonial_rewards_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_testimonial_rewards_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_marketplace_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_testimonial_rewards_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_testimonial_rewards_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_testimonial_rewards_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_testimonial_rewards_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "client_testimonial_requests"
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
            referencedRelation: "jobs_marketplace_public"
            referencedColumns: ["id"]
          },
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
      insurance_verifications: {
        Row: {
          card_back_url: string | null
          card_front_url: string | null
          coverage_details: Json | null
          created_at: string
          eligibility_data: Json | null
          expires_at: string | null
          group_number: string | null
          id: string
          insurance_provider: string
          member_id: string | null
          patient_id: string
          policy_number: string
          provider_id: string | null
          updated_at: string
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          card_back_url?: string | null
          card_front_url?: string | null
          coverage_details?: Json | null
          created_at?: string
          eligibility_data?: Json | null
          expires_at?: string | null
          group_number?: string | null
          id?: string
          insurance_provider: string
          member_id?: string | null
          patient_id: string
          policy_number: string
          provider_id?: string | null
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          card_back_url?: string | null
          card_front_url?: string | null
          coverage_details?: Json | null
          created_at?: string
          eligibility_data?: Json | null
          expires_at?: string | null
          group_number?: string | null
          id?: string
          insurance_provider?: string
          member_id?: string | null
          patient_id?: string
          policy_number?: string
          provider_id?: string | null
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_verifications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_verifications_provider_id_fkey"
            columns: ["provider_id"]
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
            referencedRelation: "jobs_marketplace_public"
            referencedColumns: ["id"]
          },
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
          platform: Database["public"]["Enums"]["baise_platform"]
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
          platform?: Database["public"]["Enums"]["baise_platform"]
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
          platform?: Database["public"]["Enums"]["baise_platform"]
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
      live_streams: {
        Row: {
          channel_name: string
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          is_live: boolean
          location: string | null
          provider_id: string
          specialty: string | null
          started_at: string
          title: string
          viewer_count: number | null
        }
        Insert: {
          channel_name: string
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean
          location?: string | null
          provider_id: string
          specialty?: string | null
          started_at?: string
          title: string
          viewer_count?: number | null
        }
        Update: {
          channel_name?: string
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean
          location?: string | null
          provider_id?: string
          specialty?: string | null
          started_at?: string
          title?: string
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_streams_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          created_at: string
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_confidential: boolean | null
          metadata: Json | null
          mime_type: string | null
          patient_id: string
          provider_id: string | null
          record_date: string | null
          record_type: string
          title: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_confidential?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          patient_id: string
          provider_id?: string | null
          record_date?: string | null
          record_type: string
          title: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_confidential?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          patient_id?: string
          provider_id?: string | null
          record_date?: string | null
          record_type?: string
          title?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      member_lifecycle_events: {
        Row: {
          actor_id: string | null
          app_key: string
          contact_id: string | null
          conversion_reason: string | null
          created_at: string
          empire_hub_sync_status: string
          event_type: string
          id: string
          lifecycle_stage: string
          member_user_id: string | null
          metadata: Json
          notes: string | null
          projected_ltv: number
          provider_id: string
        }
        Insert: {
          actor_id?: string | null
          app_key?: string
          contact_id?: string | null
          conversion_reason?: string | null
          created_at?: string
          empire_hub_sync_status?: string
          event_type?: string
          id?: string
          lifecycle_stage?: string
          member_user_id?: string | null
          metadata?: Json
          notes?: string | null
          projected_ltv?: number
          provider_id: string
        }
        Update: {
          actor_id?: string | null
          app_key?: string
          contact_id?: string | null
          conversion_reason?: string | null
          created_at?: string
          empire_hub_sync_status?: string
          event_type?: string
          id?: string
          lifecycle_stage?: string
          member_user_id?: string | null
          metadata?: Json
          notes?: string | null
          projected_ltv?: number
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_lifecycle_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_lifecycle_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_lifecycle_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
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
          last_channel_preferences_acknowledged_at: string | null
          marketing_email_enabled: boolean
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_lead_time: number
          sms_enabled: boolean
          transactional_email_required: boolean
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          last_channel_preferences_acknowledged_at?: string | null
          marketing_email_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_lead_time?: number
          sms_enabled?: boolean
          transactional_email_required?: boolean
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          last_channel_preferences_acknowledged_at?: string | null
          marketing_email_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_lead_time?: number
          sms_enabled?: boolean
          transactional_email_required?: boolean
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean
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
      onboarding_progress: {
        Row: {
          lane: string
          percent: number
          steps: Json
          tour_completed_at: string | null
          updated_at: string
          user_id: string
          welcome_dismissed_at: string | null
        }
        Insert: {
          lane: string
          percent?: number
          steps?: Json
          tour_completed_at?: string | null
          updated_at?: string
          user_id: string
          welcome_dismissed_at?: string | null
        }
        Update: {
          lane?: string
          percent?: number
          steps?: Json
          tour_completed_at?: string | null
          updated_at?: string
          user_id?: string
          welcome_dismissed_at?: string | null
        }
        Relationships: []
      }
      partner_application_reviews: {
        Row: {
          application_id: string
          created_at: string
          decision: string
          id: string
          notes: string | null
          reviewed_by: string
        }
        Insert: {
          application_id: string
          created_at?: string
          decision: string
          id?: string
          notes?: string | null
          reviewed_by: string
        }
        Update: {
          application_id?: string
          created_at?: string
          decision?: string
          id?: string
          notes?: string | null
          reviewed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_application_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_influencer_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_campaign_events: {
        Row: {
          campaign_id: string
          created_at: string
          event_type: string
          id: string
          lead_email: string | null
          lead_label: string | null
          membership_id: string
          metadata: Json
          occurred_at: string
          partner_user_id: string
          profit_amount: number
          revenue_amount: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          event_type: string
          id?: string
          lead_email?: string | null
          lead_label?: string | null
          membership_id: string
          metadata?: Json
          occurred_at?: string
          partner_user_id: string
          profit_amount?: number
          revenue_amount?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          event_type?: string
          id?: string
          lead_email?: string | null
          lead_label?: string | null
          membership_id?: string
          metadata?: Json
          occurred_at?: string
          partner_user_id?: string
          profit_amount?: number
          revenue_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "partner_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_campaign_events_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "partner_campaign_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_campaign_memberships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          campaign_id: string
          conversions_count: number
          created_at: string
          custom_code: string | null
          gross_revenue: number
          id: string
          landing_path: string
          last_conversion_at: string | null
          last_lead_at: string | null
          leads_count: number
          metadata: Json
          partner_code: string
          partner_profit: number
          partner_user_id: string
          qr_payload: string | null
          status: string
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id: string
          conversions_count?: number
          created_at?: string
          custom_code?: string | null
          gross_revenue?: number
          id?: string
          landing_path?: string
          last_conversion_at?: string | null
          last_lead_at?: string | null
          leads_count?: number
          metadata?: Json
          partner_code?: string
          partner_profit?: number
          partner_user_id: string
          qr_payload?: string | null
          status?: string
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id?: string
          conversions_count?: number
          created_at?: string
          custom_code?: string | null
          gross_revenue?: number
          id?: string
          landing_path?: string
          last_conversion_at?: string | null
          last_lead_at?: string | null
          leads_count?: number
          metadata?: Json
          partner_code?: string
          partner_profit?: number
          partner_user_id?: string
          qr_payload?: string | null
          status?: string
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_campaign_memberships_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "partner_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_campaign_payouts: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string
          currency: string
          id: string
          membership_id: string | null
          metadata: Json
          paid_at: string | null
          partner_user_id: string
          payment_reference: string | null
          payout_method: string | null
          payout_period_end: string
          payout_period_start: string
          receipt_number: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          campaign_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          membership_id?: string | null
          metadata?: Json
          paid_at?: string | null
          partner_user_id: string
          payment_reference?: string | null
          payout_method?: string | null
          payout_period_end: string
          payout_period_start: string
          receipt_number?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          membership_id?: string | null
          metadata?: Json
          paid_at?: string | null
          partner_user_id?: string
          payment_reference?: string | null
          payout_method?: string | null
          payout_period_end?: string
          payout_period_start?: string
          receipt_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_campaign_payouts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "partner_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_campaign_payouts_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "partner_campaign_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_campaigns: {
        Row: {
          app_key: string
          approval_required: boolean
          campaign_type: string
          commission_type: string
          commission_value: number
          content_guidelines: Json
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          ends_at: string | null
          id: string
          metadata: Json
          name: string
          payout_rules: Json
          rules: Json
          slug: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          app_key?: string
          approval_required?: boolean
          campaign_type?: string
          commission_type?: string
          commission_value?: number
          content_guidelines?: Json
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json
          name: string
          payout_rules?: Json
          rules?: Json
          slug: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          app_key?: string
          approval_required?: boolean
          campaign_type?: string
          commission_type?: string
          commission_value?: number
          content_guidelines?: Json
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json
          name?: string
          payout_rules?: Json
          rules?: Json
          slug?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_influencer_applications: {
        Row: {
          app_key: string
          application_payload: Json
          application_submitted_at: string | null
          application_token: string
          audience_languages: string[]
          audience_locations: string[]
          audience_summary: string | null
          basic_opt_in_at: string
          campaign_id: string | null
          campaign_interests: string[]
          city: string | null
          content_examples: Json
          content_niche: string | null
          country: string | null
          created_at: string
          creator_bio: string | null
          creator_name: string | null
          email: string
          full_name: string
          id: string
          main_demographic: string | null
          metadata: Json
          metrics: Json
          payout_preferences: Json
          phone: string | null
          platforms: Json
          primary_handle: string | null
          primary_platform: string | null
          primary_profile_url: string | null
          review_due_at: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          total_followers: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          app_key?: string
          application_payload?: Json
          application_submitted_at?: string | null
          application_token?: string
          audience_languages?: string[]
          audience_locations?: string[]
          audience_summary?: string | null
          basic_opt_in_at?: string
          campaign_id?: string | null
          campaign_interests?: string[]
          city?: string | null
          content_examples?: Json
          content_niche?: string | null
          country?: string | null
          created_at?: string
          creator_bio?: string | null
          creator_name?: string | null
          email: string
          full_name: string
          id?: string
          main_demographic?: string | null
          metadata?: Json
          metrics?: Json
          payout_preferences?: Json
          phone?: string | null
          platforms?: Json
          primary_handle?: string | null
          primary_platform?: string | null
          primary_profile_url?: string | null
          review_due_at?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          total_followers?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          app_key?: string
          application_payload?: Json
          application_submitted_at?: string | null
          application_token?: string
          audience_languages?: string[]
          audience_locations?: string[]
          audience_summary?: string | null
          basic_opt_in_at?: string
          campaign_id?: string | null
          campaign_interests?: string[]
          city?: string | null
          content_examples?: Json
          content_niche?: string | null
          country?: string | null
          created_at?: string
          creator_bio?: string | null
          creator_name?: string | null
          email?: string
          full_name?: string
          id?: string
          main_demographic?: string | null
          metadata?: Json
          metrics?: Json
          payout_preferences?: Json
          phone?: string | null
          platforms?: Json
          primary_handle?: string | null
          primary_platform?: string | null
          primary_profile_url?: string | null
          review_due_at?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          total_followers?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_influencer_applications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "partner_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payout_receipts: {
        Row: {
          created_at: string
          currency: string
          generated_at: string
          id: string
          metadata: Json
          partner_user_id: string
          payout_ids: string[]
          period_end: string
          period_start: string
          period_type: string
          receipt_number: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          generated_at?: string
          id?: string
          metadata?: Json
          partner_user_id: string
          payout_ids?: string[]
          period_end: string
          period_start: string
          period_type: string
          receipt_number?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          generated_at?: string
          id?: string
          metadata?: Json
          partner_user_id?: string
          payout_ids?: string[]
          period_end?: string
          period_start?: string
          period_type?: string
          receipt_number?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      patient_consents: {
        Row: {
          consent_text: string
          consent_type: string
          created_at: string
          expires_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          patient_id: string
          provider_id: string | null
          signature_data: string | null
          signed_at: string | null
          updated_at: string
        }
        Insert: {
          consent_text: string
          consent_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          patient_id: string
          provider_id?: string | null
          signature_data?: string | null
          signed_at?: string | null
          updated_at?: string
        }
        Update: {
          consent_text?: string
          consent_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          patient_id?: string
          provider_id?: string | null
          signature_data?: string | null
          signed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_consents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
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
      pilot_applications: {
        Row: {
          app_key: string
          city: string | null
          consent_lgpd: boolean
          consent_terms: boolean
          consent_version: string
          consented_at: string | null
          created_at: string
          device: string | null
          email: string
          full_name: string
          id: string
          intended_role: string
          invite_id: string | null
          metadata: Json
          motivation: string | null
          notes: string | null
          phone: string | null
          platform: Database["public"]["Enums"]["baise_platform"]
          profession: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          app_key: string
          city?: string | null
          consent_lgpd?: boolean
          consent_terms?: boolean
          consent_version: string
          consented_at?: string | null
          created_at?: string
          device?: string | null
          email: string
          full_name: string
          id?: string
          intended_role: string
          invite_id?: string | null
          metadata?: Json
          motivation?: string | null
          notes?: string | null
          phone?: string | null
          platform: Database["public"]["Enums"]["baise_platform"]
          profession?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          app_key?: string
          city?: string | null
          consent_lgpd?: boolean
          consent_terms?: boolean
          consent_version?: string
          consented_at?: string | null
          created_at?: string
          device?: string | null
          email?: string
          full_name?: string
          id?: string
          intended_role?: string
          invite_id?: string | null
          metadata?: Json
          motivation?: string | null
          notes?: string | null
          phone?: string | null
          platform?: Database["public"]["Enums"]["baise_platform"]
          profession?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pilot_applications_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "test_cohort_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_message_templates: {
        Row: {
          action_label: string | null
          app_key: string
          audience: string
          body: string
          channel: string
          created_at: string
          event_type: string
          id: string
          is_active: boolean
          is_transactional: boolean
          locale: string
          metadata: Json
          subject: string
          updated_at: string
        }
        Insert: {
          action_label?: string | null
          app_key?: string
          audience?: string
          body: string
          channel: string
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean
          is_transactional?: boolean
          locale?: string
          metadata?: Json
          subject: string
          updated_at?: string
        }
        Update: {
          action_label?: string | null
          app_key?: string
          audience?: string
          body?: string
          channel?: string
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          is_transactional?: boolean
          locale?: string
          metadata?: Json
          subject?: string
          updated_at?: string
        }
        Relationships: []
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
      prescriptions: {
        Row: {
          created_at: string
          dosage: string
          duration: string | null
          expires_at: string | null
          frequency: string
          id: string
          instructions: string | null
          job_id: string | null
          medication_name: string
          patient_id: string
          pharmacy_notes: string | null
          prescribed_at: string
          provider_id: string
          refills_allowed: number | null
          refills_used: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          duration?: string | null
          expires_at?: string | null
          frequency: string
          id?: string
          instructions?: string | null
          job_id?: string | null
          medication_name: string
          patient_id: string
          pharmacy_notes?: string | null
          prescribed_at?: string
          provider_id: string
          refills_allowed?: number | null
          refills_used?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          duration?: string | null
          expires_at?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          job_id?: string | null
          medication_name?: string
          patient_id?: string
          pharmacy_notes?: string | null
          prescribed_at?: string
          provider_id?: string
          refills_allowed?: number | null
          refills_used?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_marketplace_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
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
          address_cep: string | null
          address_complement: string | null
          address_lat: number | null
          address_lng: number | null
          address_neighborhood: string | null
          address_number: string | null
          address_street: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          client_id: string | null
          created_at: string | null
          credits_balance: number | null
          email: string | null
          face_descriptor: string | null
          first_name: string | null
          handle: string | null
          id: string
          is_provider: boolean | null
          is_test_account: boolean
          languages: string[] | null
          last_name: string | null
          phone: string | null
          platforms: Database["public"]["Enums"]["baise_platform"][]
          referral_code: string | null
          referral_slug: string | null
          signup_app_key: string
          state: string | null
          status: string | null
          test_cohort_app_key: string | null
          updated_at: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          address_cep?: string | null
          address_complement?: string | null
          address_lat?: number | null
          address_lng?: number | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string | null
          credits_balance?: number | null
          email?: string | null
          face_descriptor?: string | null
          first_name?: string | null
          handle?: string | null
          id?: string
          is_provider?: boolean | null
          is_test_account?: boolean
          languages?: string[] | null
          last_name?: string | null
          phone?: string | null
          platforms?: Database["public"]["Enums"]["baise_platform"][]
          referral_code?: string | null
          referral_slug?: string | null
          signup_app_key?: string
          state?: string | null
          status?: string | null
          test_cohort_app_key?: string | null
          updated_at?: string | null
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          address_cep?: string | null
          address_complement?: string | null
          address_lat?: number | null
          address_lng?: number | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string | null
          credits_balance?: number | null
          email?: string | null
          face_descriptor?: string | null
          first_name?: string | null
          handle?: string | null
          id?: string
          is_provider?: boolean | null
          is_test_account?: boolean
          languages?: string[] | null
          last_name?: string | null
          phone?: string | null
          platforms?: Database["public"]["Enums"]["baise_platform"][]
          referral_code?: string | null
          referral_slug?: string | null
          signup_app_key?: string
          state?: string | null
          status?: string | null
          test_cohort_app_key?: string | null
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
      promotional_campaigns: {
        Row: {
          app_key: string
          campaign_type: string
          created_at: string
          created_by: string
          credit_amount: number
          current_redemptions: number
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          metadata: Json
          name: string
          promo_code: string | null
          source: string
          starts_at: string
          subscription_days: number
          target_audience: string
          tier_override: string | null
          updated_at: string
        }
        Insert: {
          app_key?: string
          campaign_type?: string
          created_at?: string
          created_by: string
          credit_amount?: number
          current_redemptions?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          metadata?: Json
          name: string
          promo_code?: string | null
          source?: string
          starts_at?: string
          subscription_days?: number
          target_audience?: string
          tier_override?: string | null
          updated_at?: string
        }
        Update: {
          app_key?: string
          campaign_type?: string
          created_at?: string
          created_by?: string
          credit_amount?: number
          current_redemptions?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          metadata?: Json
          name?: string
          promo_code?: string | null
          source?: string
          starts_at?: string
          subscription_days?: number
          target_audience?: string
          tier_override?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_access_entitlements: {
        Row: {
          access_level: string
          access_source: string
          client_user_id: string | null
          contact_id: string | null
          created_at: string
          expires_at: string | null
          granted_by: string
          id: string
          last_accessed_at: string | null
          metadata: Json
          provider_id: string
          revoked_at: string | null
          starts_at: string
          status: string
          updated_at: string
          upgraded_at: string | null
        }
        Insert: {
          access_level?: string
          access_source?: string
          client_user_id?: string | null
          contact_id?: string | null
          created_at?: string
          expires_at?: string | null
          granted_by: string
          id?: string
          last_accessed_at?: string | null
          metadata?: Json
          provider_id: string
          revoked_at?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          upgraded_at?: string | null
        }
        Update: {
          access_level?: string
          access_source?: string
          client_user_id?: string | null
          contact_id?: string | null
          created_at?: string
          expires_at?: string | null
          granted_by?: string
          id?: string
          last_accessed_at?: string | null
          metadata?: Json
          provider_id?: string
          revoked_at?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          upgraded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_access_entitlements_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_access_entitlements_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_access_entitlements_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_account_balances: {
        Row: {
          available_balance: number
          created_at: string
          currency: string
          id: string
          internal_credit_balance: number
          pending_balance: number
          provider_id: string
          updated_at: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          currency?: string
          id?: string
          internal_credit_balance?: number
          pending_balance?: number
          provider_id: string
          updated_at?: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          currency?: string
          id?: string
          internal_credit_balance?: number
          pending_balance?: number
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_account_balances_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_account_balances_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
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
      provider_ai_api_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          key_hash: string
          key_last_four: string
          key_name: string
          key_prefix: string
          last_used_at: string | null
          metadata: Json
          provider_id: string
          revoked_at: string | null
          scopes: string[]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_last_four: string
          key_name: string
          key_prefix?: string
          last_used_at?: string | null
          metadata?: Json
          provider_id: string
          revoked_at?: string | null
          scopes?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_last_four?: string
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          metadata?: Json
          provider_id?: string
          revoked_at?: string | null
          scopes?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_ai_api_keys_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_ai_api_keys_provider_id_fkey"
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
      provider_calendar_events: {
        Row: {
          active_job_id: string | null
          campaign_id: string | null
          channel_preferences: string[]
          created_at: string
          created_by: string
          customer_id: string | null
          description: string | null
          end_at: string | null
          event_type: string
          id: string
          metadata: Json
          notification_offsets_minutes: number[]
          payment_plan_id: string | null
          portal_first: boolean
          provider_id: string
          scheduled_service_id: string | null
          start_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          active_job_id?: string | null
          campaign_id?: string | null
          channel_preferences?: string[]
          created_at?: string
          created_by: string
          customer_id?: string | null
          description?: string | null
          end_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          notification_offsets_minutes?: number[]
          payment_plan_id?: string | null
          portal_first?: boolean
          provider_id: string
          scheduled_service_id?: string | null
          start_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          active_job_id?: string | null
          campaign_id?: string | null
          channel_preferences?: string[]
          created_at?: string
          created_by?: string
          customer_id?: string | null
          description?: string | null
          end_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          notification_offsets_minutes?: number[]
          payment_plan_id?: string | null
          portal_first?: boolean
          provider_id?: string
          scheduled_service_id?: string | null
          start_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_calendar_events_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_calendar_events_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "provider_payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_calendar_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_calendar_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_calendar_events_scheduled_service_id_fkey"
            columns: ["scheduled_service_id"]
            isOneToOne: false
            referencedRelation: "scheduled_services"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_client_portal_invites: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          customer_id: string | null
          email: string
          expires_at: string
          id: string
          invite_type: string
          invited_by: string
          metadata: Json
          provider_id: string
          resource_id: string | null
          resource_type: string
          status: string
          token_hash: string | null
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          customer_id?: string | null
          email: string
          expires_at?: string
          id?: string
          invite_type?: string
          invited_by: string
          metadata?: Json
          provider_id: string
          resource_id?: string | null
          resource_type?: string
          status?: string
          token_hash?: string | null
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string
          expires_at?: string
          id?: string
          invite_type?: string
          invited_by?: string
          metadata?: Json
          provider_id?: string
          resource_id?: string | null
          resource_type?: string
          status?: string
          token_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_client_portal_invites_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_client_portal_invites_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_communication_campaigns: {
        Row: {
          audience: string
          campaign_type: string
          created_at: string
          created_by: string
          id: string
          message_body: string
          metadata: Json
          name: string
          portal_first: boolean
          primary_channel: string
          provider_id: string
          scheduled_at: string | null
          secondary_channels: string[]
          status: string
          subject: string | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          audience?: string
          campaign_type?: string
          created_at?: string
          created_by: string
          id?: string
          message_body: string
          metadata?: Json
          name: string
          portal_first?: boolean
          primary_channel?: string
          provider_id: string
          scheduled_at?: string | null
          secondary_channels?: string[]
          status?: string
          subject?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          campaign_type?: string
          created_at?: string
          created_by?: string
          id?: string
          message_body?: string
          metadata?: Json
          name?: string
          portal_first?: boolean
          primary_channel?: string
          provider_id?: string
          scheduled_at?: string | null
          secondary_channels?: string[]
          status?: string
          subject?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_communication_campaigns_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_communication_campaigns_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_communication_events: {
        Row: {
          app_key: string
          campaign_id: string | null
          channel: string
          created_at: string
          created_by: string
          customer_id: string | null
          delivered_via: string | null
          delivery_attempts: number
          delivery_error: string | null
          delivery_policy: string
          event_type: string
          external_message_id: string | null
          id: string
          is_transactional: boolean
          last_attempt_at: string | null
          locale: string
          message_body: string
          metadata: Json
          next_attempt_at: string | null
          provider_calendar_event_id: string | null
          provider_id: string
          purpose: string
          recipient_email: string | null
          recipient_phone: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string | null
          template_key: string | null
          updated_at: string
        }
        Insert: {
          app_key?: string
          campaign_id?: string | null
          channel?: string
          created_at?: string
          created_by: string
          customer_id?: string | null
          delivered_via?: string | null
          delivery_attempts?: number
          delivery_error?: string | null
          delivery_policy?: string
          event_type?: string
          external_message_id?: string | null
          id?: string
          is_transactional?: boolean
          last_attempt_at?: string | null
          locale?: string
          message_body: string
          metadata?: Json
          next_attempt_at?: string | null
          provider_calendar_event_id?: string | null
          provider_id: string
          purpose?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_key?: string | null
          updated_at?: string
        }
        Update: {
          app_key?: string
          campaign_id?: string | null
          channel?: string
          created_at?: string
          created_by?: string
          customer_id?: string | null
          delivered_via?: string | null
          delivery_attempts?: number
          delivery_error?: string | null
          delivery_policy?: string
          event_type?: string
          external_message_id?: string | null
          id?: string
          is_transactional?: boolean
          last_attempt_at?: string | null
          locale?: string
          message_body?: string
          metadata?: Json
          next_attempt_at?: string | null
          provider_calendar_event_id?: string | null
          provider_id?: string
          purpose?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_communication_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "provider_communication_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_communication_events_provider_calendar_event_id_fkey"
            columns: ["provider_calendar_event_id"]
            isOneToOne: false
            referencedRelation: "provider_calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_communication_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_communication_events_provider_id_fkey"
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
      provider_crm_activities: {
        Row: {
          activity_type: string
          body: string | null
          channel: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          due_at: string | null
          id: string
          metadata: Json
          opportunity_id: string | null
          project_id: string | null
          provider_id: string
          quote_id: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          activity_type?: string
          body?: string | null
          channel?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          due_at?: string | null
          id?: string
          metadata?: Json
          opportunity_id?: string | null
          project_id?: string | null
          provider_id: string
          quote_id?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          body?: string | null
          channel?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          due_at?: string | null
          id?: string
          metadata?: Json
          opportunity_id?: string | null
          project_id?: string | null
          provider_id?: string
          quote_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_crm_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_crm_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "provider_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_crm_activities_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_crm_activities_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_crm_activities_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "provider_quote_records"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_crm_contacts: {
        Row: {
          company_name: string | null
          created_at: string
          created_by: string
          customer_id: string | null
          email: string | null
          estimated_value: number
          full_name: string
          id: string
          last_contact_at: string | null
          lifetime_value: number
          metadata: Json
          next_follow_up_at: string | null
          notes: string | null
          phone: string | null
          preferred_channel: string
          priority: string
          provider_id: string
          relationship_type: string
          source: string
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          created_by: string
          customer_id?: string | null
          email?: string | null
          estimated_value?: number
          full_name: string
          id?: string
          last_contact_at?: string | null
          lifetime_value?: number
          metadata?: Json
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          preferred_channel?: string
          priority?: string
          provider_id: string
          relationship_type?: string
          source?: string
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          email?: string | null
          estimated_value?: number
          full_name?: string
          id?: string
          last_contact_at?: string | null
          lifetime_value?: number
          metadata?: Json
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          preferred_channel?: string
          priority?: string
          provider_id?: string
          relationship_type?: string
          source?: string
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_crm_contacts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_crm_contacts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_crm_opportunities: {
        Row: {
          contact_id: string | null
          created_at: string
          created_by: string
          estimated_value: number
          expected_close_date: string | null
          id: string
          metadata: Json
          next_step: string | null
          probability: number
          provider_id: string
          stage: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          created_by: string
          estimated_value?: number
          expected_close_date?: string | null
          id?: string
          metadata?: Json
          next_step?: string | null
          probability?: number
          provider_id: string
          stage?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          created_by?: string
          estimated_value?: number
          expected_close_date?: string | null
          id?: string
          metadata?: Json
          next_step?: string | null
          probability?: number
          provider_id?: string
          stage?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_crm_opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_crm_opportunities_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_crm_opportunities_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_document_vault_items: {
        Row: {
          bucket_id: string
          category: string
          client_user_id: string | null
          contact_id: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          metadata: Json
          mime_type: string | null
          parser_status: string
          provider_id: string
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          signed_off_by_client_at: string | null
          signed_off_by_staff_at: string | null
          signoff_status: string
          source_resource_id: string | null
          source_resource_type: string | null
          title: string
          updated_at: string
          uploaded_by: string
          visibility: string
        }
        Insert: {
          bucket_id?: string
          category?: string
          client_user_id?: string | null
          contact_id?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          parser_status?: string
          provider_id: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          signed_off_by_client_at?: string | null
          signed_off_by_staff_at?: string | null
          signoff_status?: string
          source_resource_id?: string | null
          source_resource_type?: string | null
          title: string
          updated_at?: string
          uploaded_by: string
          visibility?: string
        }
        Update: {
          bucket_id?: string
          category?: string
          client_user_id?: string | null
          contact_id?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          parser_status?: string
          provider_id?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          signed_off_by_client_at?: string | null
          signed_off_by_staff_at?: string | null
          signoff_status?: string
          source_resource_id?: string | null
          source_resource_type?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_document_vault_items_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_document_vault_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_document_vault_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_email_campaign_sends: {
        Row: {
          body: string
          contact_id: string | null
          created_at: string
          error_message: string | null
          failed_at: string | null
          id: string
          metadata: Json
          provider_communication_event_id: string | null
          provider_id: string
          queued_at: string
          recipient_email: string | null
          recipient_phone: string | null
          recipient_user_id: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
        }
        Insert: {
          body: string
          contact_id?: string | null
          created_at?: string
          error_message?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json
          provider_communication_event_id?: string | null
          provider_id: string
          queued_at?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_user_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
        }
        Update: {
          body?: string
          contact_id?: string | null
          created_at?: string
          error_message?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json
          provider_communication_event_id?: string | null
          provider_id?: string
          queued_at?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_user_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_email_campaign_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_email_campaign_sends_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_email_campaign_sends_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_email_campaign_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "provider_email_campaign_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_email_campaign_templates: {
        Row: {
          app_key: string
          audience: string
          body: string
          campaign_type: string
          created_at: string
          cta_label: string | null
          cta_path: string | null
          id: string
          is_active: boolean
          is_system_template: boolean
          locale: string
          metadata: Json
          provider_id: string | null
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          app_key?: string
          audience?: string
          body: string
          campaign_type: string
          created_at?: string
          cta_label?: string | null
          cta_path?: string | null
          id?: string
          is_active?: boolean
          is_system_template?: boolean
          locale?: string
          metadata?: Json
          provider_id?: string | null
          subject: string
          template_key: string
          updated_at?: string
        }
        Update: {
          app_key?: string
          audience?: string
          body?: string
          campaign_type?: string
          created_at?: string
          cta_label?: string | null
          cta_path?: string | null
          id?: string
          is_active?: boolean
          is_system_template?: boolean
          locale?: string
          metadata?: Json
          provider_id?: string | null
          subject?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_email_campaign_templates_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_email_campaign_templates_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_email_campaigns: {
        Row: {
          cost_per_email: number
          created_at: string
          emails_failed: number
          emails_sent: number
          html_content: string
          id: string
          provider_id: string
          recipient_type: string
          sent_at: string | null
          status: string
          subject: string
          total_cost: number
          total_recipients: number
          updated_at: string
        }
        Insert: {
          cost_per_email?: number
          created_at?: string
          emails_failed?: number
          emails_sent?: number
          html_content: string
          id?: string
          provider_id: string
          recipient_type?: string
          sent_at?: string | null
          status?: string
          subject: string
          total_cost?: number
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          cost_per_email?: number
          created_at?: string
          emails_failed?: number
          emails_sent?: number
          html_content?: string
          id?: string
          provider_id?: string
          recipient_type?: string
          sent_at?: string | null
          status?: string
          subject?: string
          total_cost?: number
          total_recipients?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_email_campaigns_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_email_campaigns_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_engagement_gates: {
        Row: {
          client_message: string | null
          client_user_id: string | null
          contact_id: string | null
          created_at: string
          gate_type: string
          id: string
          metadata: Json
          paused_at: string | null
          provider_id: string
          required_action: string | null
          resource_id: string | null
          resource_type: string | null
          satisfied_at: string | null
          staff_note: string | null
          status: string
          updated_at: string
          visible_to_client: boolean
        }
        Insert: {
          client_message?: string | null
          client_user_id?: string | null
          contact_id?: string | null
          created_at?: string
          gate_type: string
          id?: string
          metadata?: Json
          paused_at?: string | null
          provider_id: string
          required_action?: string | null
          resource_id?: string | null
          resource_type?: string | null
          satisfied_at?: string | null
          staff_note?: string | null
          status?: string
          updated_at?: string
          visible_to_client?: boolean
        }
        Update: {
          client_message?: string | null
          client_user_id?: string | null
          contact_id?: string | null
          created_at?: string
          gate_type?: string
          id?: string
          metadata?: Json
          paused_at?: string | null
          provider_id?: string
          required_action?: string | null
          resource_id?: string | null
          resource_type?: string | null
          satisfied_at?: string | null
          staff_note?: string | null
          status?: string
          updated_at?: string
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "provider_engagement_gates_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_engagement_gates_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_engagement_gates_provider_id_fkey"
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
      provider_integration_sync_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          integration_id: string | null
          integration_key: string
          job_type: string
          metadata: Json
          next_attempt_at: string | null
          provider_id: string
          scheduled_at: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          integration_id?: string | null
          integration_key: string
          job_type?: string
          metadata?: Json
          next_attempt_at?: string | null
          provider_id: string
          scheduled_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          integration_id?: string | null
          integration_key?: string
          job_type?: string
          metadata?: Json
          next_attempt_at?: string | null
          provider_id?: string
          scheduled_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_integration_sync_jobs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "provider_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_integration_sync_jobs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_integration_sync_jobs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_integrations: {
        Row: {
          category: string
          config: Json
          connection_health: string
          created_at: string
          created_by: string
          display_name: string
          id: string
          integration_key: string
          last_error: string | null
          last_sync_at: string | null
          metadata: Json
          next_sync_at: string | null
          oauth_state: string | null
          provider_id: string
          scopes: string[]
          status: string
          sync_cursor: Json
          sync_frequency_minutes: number
          sync_status: string
          token_expires_at: string | null
          token_reference: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          config?: Json
          connection_health?: string
          created_at?: string
          created_by: string
          display_name: string
          id?: string
          integration_key: string
          last_error?: string | null
          last_sync_at?: string | null
          metadata?: Json
          next_sync_at?: string | null
          oauth_state?: string | null
          provider_id: string
          scopes?: string[]
          status?: string
          sync_cursor?: Json
          sync_frequency_minutes?: number
          sync_status?: string
          token_expires_at?: string | null
          token_reference?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json
          connection_health?: string
          created_at?: string
          created_by?: string
          display_name?: string
          id?: string
          integration_key?: string
          last_error?: string | null
          last_sync_at?: string | null
          metadata?: Json
          next_sync_at?: string | null
          oauth_state?: string | null
          provider_id?: string
          scopes?: string[]
          status?: string
          sync_cursor?: Json
          sync_frequency_minutes?: number
          sync_status?: string
          token_expires_at?: string | null
          token_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_integrations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_integrations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_invoices: {
        Row: {
          active_job_id: string | null
          baise_branding: boolean
          client_action_status: string
          client_display_id: string | null
          company_logo_url: string | null
          created_at: string
          created_by: string
          currency: string
          customer_id: string | null
          discount_amount: number
          due_at: string | null
          id: string
          invoice_number: string | null
          invoice_type: string
          issued_at: string
          last_sent_at: string | null
          last_viewed_at: string | null
          metadata: Json
          paid_at: string | null
          payment_plan_id: string | null
          payment_status: string
          pdf_url: string | null
          provider_id: string
          receipt_url: string | null
          service_description: string
          subcontractor_id: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          active_job_id?: string | null
          baise_branding?: boolean
          client_action_status?: string
          client_display_id?: string | null
          company_logo_url?: string | null
          created_at?: string
          created_by: string
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          due_at?: string | null
          id?: string
          invoice_number?: string | null
          invoice_type?: string
          issued_at?: string
          last_sent_at?: string | null
          last_viewed_at?: string | null
          metadata?: Json
          paid_at?: string | null
          payment_plan_id?: string | null
          payment_status?: string
          pdf_url?: string | null
          provider_id: string
          receipt_url?: string | null
          service_description: string
          subcontractor_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          active_job_id?: string | null
          baise_branding?: boolean
          client_action_status?: string
          client_display_id?: string | null
          company_logo_url?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          due_at?: string | null
          id?: string
          invoice_number?: string | null
          invoice_type?: string
          issued_at?: string
          last_sent_at?: string | null
          last_viewed_at?: string | null
          metadata?: Json
          paid_at?: string | null
          payment_plan_id?: string | null
          payment_status?: string
          pdf_url?: string | null
          provider_id?: string
          receipt_url?: string | null
          service_description?: string
          subcontractor_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_invoices_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_invoices_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "provider_payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_invoices_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "provider_subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_ledger_entries: {
        Row: {
          amount: number
          created_at: string
          currency: string
          direction: string
          entry_type: string
          id: string
          invoice_id: string | null
          memo: string | null
          metadata: Json
          provider_id: string
          rail: string
          related_transaction_id: string | null
          subcontractor_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          direction: string
          entry_type: string
          id?: string
          invoice_id?: string | null
          memo?: string | null
          metadata?: Json
          provider_id: string
          rail?: string
          related_transaction_id?: string | null
          subcontractor_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          direction?: string
          entry_type?: string
          id?: string
          invoice_id?: string | null
          memo?: string | null
          metadata?: Json
          provider_id?: string
          rail?: string
          related_transaction_id?: string | null
          subcontractor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_ledger_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "provider_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_ledger_entries_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_ledger_entries_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_ledger_entries_related_transaction_id_fkey"
            columns: ["related_transaction_id"]
            isOneToOne: false
            referencedRelation: "provider_payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_ledger_entries_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "provider_subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_operational_audit_events: {
        Row: {
          action: string
          actor_role: string
          actor_user_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json
          provider_id: string
          resource_id: string | null
          resource_type: string
          severity: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_role?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          provider_id: string
          resource_id?: string | null
          resource_type: string
          severity?: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_role?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          provider_id?: string
          resource_id?: string | null
          resource_type?: string
          severity?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_operational_audit_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_operational_audit_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_payment_plan_items: {
        Row: {
          amount: number
          attempt_count: number
          checkout_expires_at: string | null
          checkout_url: string | null
          client_action_required: boolean
          created_at: string
          currency: string
          due_at: string
          id: string
          invoice_id: string | null
          label: string
          last_attempt_at: string | null
          last_payment_error: string | null
          metadata: Json
          next_attempt_at: string | null
          paid_at: string | null
          payment_plan_id: string
          payment_transaction_id: string | null
          processor: string
          provider_id: string
          release_benchmark: string | null
          sequence_number: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          attempt_count?: number
          checkout_expires_at?: string | null
          checkout_url?: string | null
          client_action_required?: boolean
          created_at?: string
          currency?: string
          due_at: string
          id?: string
          invoice_id?: string | null
          label: string
          last_attempt_at?: string | null
          last_payment_error?: string | null
          metadata?: Json
          next_attempt_at?: string | null
          paid_at?: string | null
          payment_plan_id: string
          payment_transaction_id?: string | null
          processor?: string
          provider_id: string
          release_benchmark?: string | null
          sequence_number?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          attempt_count?: number
          checkout_expires_at?: string | null
          checkout_url?: string | null
          client_action_required?: boolean
          created_at?: string
          currency?: string
          due_at?: string
          id?: string
          invoice_id?: string | null
          label?: string
          last_attempt_at?: string | null
          last_payment_error?: string | null
          metadata?: Json
          next_attempt_at?: string | null
          paid_at?: string | null
          payment_plan_id?: string
          payment_transaction_id?: string | null
          processor?: string
          provider_id?: string
          release_benchmark?: string | null
          sequence_number?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_payment_plan_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "provider_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_plan_items_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "provider_payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_plan_items_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "provider_payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_plan_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_plan_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_payment_plans: {
        Row: {
          active_job_id: string | null
          autopay_enabled: boolean
          billing_mode: string
          cadence: string
          created_at: string
          created_by: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          customer_id: string | null
          deposit_amount: number
          description: string | null
          end_date: string | null
          failure_count: number
          id: string
          installment_count: number
          invoice_id: string | null
          last_billed_at: string | null
          last_payment_error: string | null
          metadata: Json
          next_bill_at: string | null
          payment_method: string
          plan_type: string
          provider_id: string
          start_date: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subcontractor_id: string | null
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          active_job_id?: string | null
          autopay_enabled?: boolean
          billing_mode?: string
          cadence?: string
          created_at?: string
          created_by: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          deposit_amount?: number
          description?: string | null
          end_date?: string | null
          failure_count?: number
          id?: string
          installment_count?: number
          invoice_id?: string | null
          last_billed_at?: string | null
          last_payment_error?: string | null
          metadata?: Json
          next_bill_at?: string | null
          payment_method?: string
          plan_type?: string
          provider_id: string
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subcontractor_id?: string | null
          title: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          active_job_id?: string | null
          autopay_enabled?: boolean
          billing_mode?: string
          cadence?: string
          created_at?: string
          created_by?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          deposit_amount?: number
          description?: string | null
          end_date?: string | null
          failure_count?: number
          id?: string
          installment_count?: number
          invoice_id?: string | null
          last_billed_at?: string | null
          last_payment_error?: string | null
          metadata?: Json
          next_bill_at?: string | null
          payment_method?: string
          plan_type?: string
          provider_id?: string
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subcontractor_id?: string | null
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_payment_plans_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_plans_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "provider_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_plans_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_plans_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_plans_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "provider_subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_payment_transactions: {
        Row: {
          active_job_id: string | null
          amount: number
          collected_by_subcontractor: boolean
          created_at: string
          created_by: string
          currency: string
          id: string
          invoice_id: string | null
          metadata: Json
          payment_method: string
          processed_at: string | null
          provider_id: string
          rail: string
          refund_destination: string | null
          release_benchmark: string | null
          service_credit_amount: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subcontractor_id: string | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          active_job_id?: string | null
          amount: number
          collected_by_subcontractor?: boolean
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          payment_method?: string
          processed_at?: string | null
          provider_id: string
          rail?: string
          refund_destination?: string | null
          release_benchmark?: string | null
          service_credit_amount?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subcontractor_id?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Update: {
          active_job_id?: string | null
          amount?: number
          collected_by_subcontractor?: boolean
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          payment_method?: string
          processed_at?: string | null
          provider_id?: string
          rail?: string
          refund_destination?: string | null
          release_benchmark?: string | null
          service_credit_amount?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subcontractor_id?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_payment_transactions_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "provider_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_transactions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_transactions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_transactions_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "provider_subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_project_tasks: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          id: string
          metadata: Json
          priority: string
          project_id: string | null
          provider_id: string
          task_status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json
          priority?: string
          project_id?: string | null
          provider_id: string
          task_status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json
          priority?: string
          project_id?: string | null
          provider_id?: string
          task_status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_project_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "provider_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_project_tasks_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_project_tasks_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_projects: {
        Row: {
          active_job_id: string | null
          budget: number
          completion_percent: number
          contact_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json
          next_milestone: string | null
          priority: string
          project_name: string
          project_status: string
          provider_id: string
          quote_id: string | null
          risk_level: string
          spent_amount: number
          start_date: string | null
          updated_at: string
        }
        Insert: {
          active_job_id?: string | null
          budget?: number
          completion_percent?: number
          contact_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          next_milestone?: string | null
          priority?: string
          project_name: string
          project_status?: string
          provider_id: string
          quote_id?: string | null
          risk_level?: string
          spent_amount?: number
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          active_job_id?: string | null
          budget?: number
          completion_percent?: number
          contact_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          next_milestone?: string | null
          priority?: string
          project_name?: string
          project_status?: string
          provider_id?: string
          quote_id?: string | null
          risk_level?: string
          spent_amount?: number
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_projects_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_projects_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_projects_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_projects_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_projects_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "provider_quote_records"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_quote_records: {
        Row: {
          accepted_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string
          discount_amount: number
          id: string
          metadata: Json
          opportunity_id: string | null
          provider_id: string
          quote_number: string | null
          sent_at: string | null
          service_scope: string
          status: string
          subtotal: number
          tax_amount: number
          title: string
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          discount_amount?: number
          id?: string
          metadata?: Json
          opportunity_id?: string | null
          provider_id: string
          quote_number?: string | null
          sent_at?: string | null
          service_scope: string
          status?: string
          subtotal?: number
          tax_amount?: number
          title: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          discount_amount?: number
          id?: string
          metadata?: Json
          opportunity_id?: string | null
          provider_id?: string
          quote_number?: string | null
          sent_at?: string | null
          service_scope?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          title?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_quote_records_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_quote_records_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_quote_records_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_quote_records_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_recurring_payment_runs: {
        Row: {
          attempt_number: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json
          payment_plan_id: string | null
          payment_plan_item_id: string | null
          processor: string
          processor_reference: string | null
          provider_id: string
          scheduled_at: string
          started_at: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          payment_plan_id?: string | null
          payment_plan_item_id?: string | null
          processor?: string
          processor_reference?: string | null
          provider_id: string
          scheduled_at?: string
          started_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          payment_plan_id?: string | null
          payment_plan_item_id?: string | null
          processor?: string
          processor_reference?: string | null
          provider_id?: string
          scheduled_at?: string
          started_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_recurring_payment_runs_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "provider_payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_recurring_payment_runs_payment_plan_item_id_fkey"
            columns: ["payment_plan_item_id"]
            isOneToOne: false
            referencedRelation: "provider_payment_plan_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_recurring_payment_runs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_recurring_payment_runs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_recurring_payment_runs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "provider_payment_transactions"
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
      provider_skills: {
        Row: {
          created_at: string | null
          id: string
          provider_id: string
          skill_tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          provider_id: string
          skill_tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          provider_id?: string
          skill_tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_skills_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_skills_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_skills_skill_tag_id_fkey"
            columns: ["skill_tag_id"]
            isOneToOne: false
            referencedRelation: "skill_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_subcontractors: {
        Row: {
          contractor_provider_id: string
          created_at: string
          display_name: string
          email: string | null
          id: string
          metadata: Json
          payment_terms: string
          phone: string | null
          public_collection_alias: string | null
          status: string
          subcontractor_user_id: string | null
          updated_at: string
        }
        Insert: {
          contractor_provider_id: string
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          metadata?: Json
          payment_terms?: string
          phone?: string | null
          public_collection_alias?: string | null
          status?: string
          subcontractor_user_id?: string | null
          updated_at?: string
        }
        Update: {
          contractor_provider_id?: string
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          metadata?: Json
          payment_terms?: string
          phone?: string | null
          public_collection_alias?: string | null
          status?: string
          subcontractor_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_subcontractors_contractor_provider_id_fkey"
            columns: ["contractor_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_subcontractors_contractor_provider_id_fkey"
            columns: ["contractor_provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_transaction_exports: {
        Row: {
          created_at: string
          created_by: string
          date_from: string | null
          date_to: string | null
          export_type: string
          filters: Json
          id: string
          provider_id: string
          row_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          date_from?: string | null
          date_to?: string | null
          export_type?: string
          filters?: Json
          id?: string
          provider_id: string
          row_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          date_from?: string | null
          date_to?: string | null
          export_type?: string
          filters?: Json
          id?: string
          provider_id?: string
          row_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_transaction_exports_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_transaction_exports_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_visibility_qa_checks: {
        Row: {
          app_key: string
          check_type: string
          checked_at: string
          checked_by: string | null
          created_at: string
          detail: string | null
          evidence: Json
          id: string
          provider_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          app_key?: string
          check_type: string
          checked_at?: string
          checked_by?: string | null
          created_at?: string
          detail?: string | null
          evidence?: Json
          id?: string
          provider_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          app_key?: string
          check_type?: string
          checked_at?: string
          checked_by?: string | null
          created_at?: string
          detail?: string | null
          evidence?: Json
          id?: string
          provider_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_visibility_qa_checks_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_visibility_qa_checks_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_work_attachments: {
        Row: {
          active_job_id: string | null
          attachment_type: string
          bucket_id: string
          caption: string | null
          contact_id: string | null
          created_at: string
          customer_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          metadata: Json
          mime_type: string | null
          project_id: string | null
          provider_id: string
          quote_id: string | null
          signoff_id: string | null
          status: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          active_job_id?: string | null
          attachment_type?: string
          bucket_id?: string
          caption?: string | null
          contact_id?: string | null
          created_at?: string
          customer_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          project_id?: string | null
          provider_id: string
          quote_id?: string | null
          signoff_id?: string | null
          status?: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          active_job_id?: string | null
          attachment_type?: string
          bucket_id?: string
          caption?: string | null
          contact_id?: string | null
          created_at?: string
          customer_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          project_id?: string | null
          provider_id?: string
          quote_id?: string | null
          signoff_id?: string | null
          status?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_work_attachments_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_work_attachments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_work_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "provider_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_work_attachments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_work_attachments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_work_attachments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "provider_quote_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_work_attachments_signoff_id_fkey"
            columns: ["signoff_id"]
            isOneToOne: false
            referencedRelation: "provider_work_signoffs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_work_signoffs: {
        Row: {
          active_job_id: string | null
          contact_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          metadata: Json
          notes: string | null
          project_id: string | null
          provider_id: string
          quote_id: string | null
          requested_by: string
          signature_data_url: string | null
          signature_method: string
          signature_text: string | null
          signed_at: string | null
          signed_by: string | null
          signed_ip: unknown
          signed_user_agent: string | null
          signer_email: string | null
          signer_name: string | null
          signoff_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          active_job_id?: string | null
          contact_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          project_id?: string | null
          provider_id: string
          quote_id?: string | null
          requested_by: string
          signature_data_url?: string | null
          signature_method?: string
          signature_text?: string | null
          signed_at?: string | null
          signed_by?: string | null
          signed_ip?: unknown
          signed_user_agent?: string | null
          signer_email?: string | null
          signer_name?: string | null
          signoff_type?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          active_job_id?: string | null
          contact_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          project_id?: string | null
          provider_id?: string
          quote_id?: string | null
          requested_by?: string
          signature_data_url?: string | null
          signature_method?: string
          signature_text?: string | null
          signed_at?: string | null
          signed_by?: string | null
          signed_ip?: unknown
          signed_user_agent?: string | null
          signer_email?: string | null
          signer_name?: string | null
          signoff_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_work_signoffs_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_work_signoffs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "provider_crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_work_signoffs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "provider_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_work_signoffs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_work_signoffs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_work_signoffs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "provider_quote_records"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          accepted_insurance: string[] | null
          accepts_new_patients: boolean | null
          address: string | null
          avatar_url: string | null
          avg_rating: number | null
          bids_remaining_this_month: number | null
          bio: string | null
          business_name: string
          business_type: string | null
          category_id: string | null
          city: string | null
          consultation_duration_minutes: number | null
          consultation_fee: number | null
          consultation_types: string[] | null
          contact_email: string | null
          contact_phone: string | null
          cpf_cnpj: string | null
          created_at: string | null
          crm_number: string | null
          emergency_available: boolean | null
          google_analytics_id: string | null
          guarantee_info: string | null
          hospital_affiliations: string[] | null
          id: string
          id_type: string | null
          insurance_accepted: string[] | null
          is_active: boolean | null
          is_background_checked: boolean | null
          is_insured: boolean | null
          is_licensed: boolean | null
          is_test_account: boolean
          is_verified: boolean | null
          languages: string[] | null
          languages_spoken: string[] | null
          location_lat: number | null
          location_lng: number | null
          meta_pixel_id: string | null
          passport_number: string | null
          platform: Database["public"]["Enums"]["baise_platform"]
          provider_type: string | null
          requires_background_check: boolean | null
          response_time_hours: number | null
          service_radius_km: number | null
          specialty_id: string | null
          state: string | null
          stripe_customer_id: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tagline: string | null
          teleconsultation_available: boolean | null
          tier_before_grant:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tier_grant_expires_at: string | null
          tier_grant_source: string | null
          total_jobs: number | null
          total_patients: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          warranty_info: string | null
          years_experience: number | null
        }
        Insert: {
          accepted_insurance?: string[] | null
          accepts_new_patients?: boolean | null
          address?: string | null
          avatar_url?: string | null
          avg_rating?: number | null
          bids_remaining_this_month?: number | null
          bio?: string | null
          business_name: string
          business_type?: string | null
          category_id?: string | null
          city?: string | null
          consultation_duration_minutes?: number | null
          consultation_fee?: number | null
          consultation_types?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          crm_number?: string | null
          emergency_available?: boolean | null
          google_analytics_id?: string | null
          guarantee_info?: string | null
          hospital_affiliations?: string[] | null
          id?: string
          id_type?: string | null
          insurance_accepted?: string[] | null
          is_active?: boolean | null
          is_background_checked?: boolean | null
          is_insured?: boolean | null
          is_licensed?: boolean | null
          is_test_account?: boolean
          is_verified?: boolean | null
          languages?: string[] | null
          languages_spoken?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          meta_pixel_id?: string | null
          passport_number?: string | null
          platform?: Database["public"]["Enums"]["baise_platform"]
          provider_type?: string | null
          requires_background_check?: boolean | null
          response_time_hours?: number | null
          service_radius_km?: number | null
          specialty_id?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tagline?: string | null
          teleconsultation_available?: boolean | null
          tier_before_grant?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tier_grant_expires_at?: string | null
          tier_grant_source?: string | null
          total_jobs?: number | null
          total_patients?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          warranty_info?: string | null
          years_experience?: number | null
        }
        Update: {
          accepted_insurance?: string[] | null
          accepts_new_patients?: boolean | null
          address?: string | null
          avatar_url?: string | null
          avg_rating?: number | null
          bids_remaining_this_month?: number | null
          bio?: string | null
          business_name?: string
          business_type?: string | null
          category_id?: string | null
          city?: string | null
          consultation_duration_minutes?: number | null
          consultation_fee?: number | null
          consultation_types?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          crm_number?: string | null
          emergency_available?: boolean | null
          google_analytics_id?: string | null
          guarantee_info?: string | null
          hospital_affiliations?: string[] | null
          id?: string
          id_type?: string | null
          insurance_accepted?: string[] | null
          is_active?: boolean | null
          is_background_checked?: boolean | null
          is_insured?: boolean | null
          is_licensed?: boolean | null
          is_test_account?: boolean
          is_verified?: boolean | null
          languages?: string[] | null
          languages_spoken?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          meta_pixel_id?: string | null
          passport_number?: string | null
          platform?: Database["public"]["Enums"]["baise_platform"]
          provider_type?: string | null
          requires_background_check?: boolean | null
          response_time_hours?: number | null
          service_radius_km?: number | null
          specialty_id?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tagline?: string | null
          teleconsultation_available?: boolean | null
          tier_before_grant?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tier_grant_expires_at?: string | null
          tier_grant_source?: string | null
          total_jobs?: number | null
          total_patients?: number | null
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
      push_notification_deliveries: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json
          notification_id: string | null
          sent_at: string | null
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          notification_id?: string | null
          sent_at?: string | null
          status?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          notification_id?: string | null
          sent_at?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notification_deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "web_push_subscriptions"
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
      referral_tracking_events: {
        Row: {
          app_key: string
          client_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          partner_campaign_id: string | null
          partner_campaign_membership_id: string | null
          referral_code: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_id: string | null
        }
        Insert: {
          app_key?: string
          client_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          partner_campaign_id?: string | null
          partner_campaign_membership_id?: string | null
          referral_code: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
        }
        Update: {
          app_key?: string
          client_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          partner_campaign_id?: string | null
          partner_campaign_membership_id?: string | null
          referral_code?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_tracking_events_partner_campaign_id_fkey"
            columns: ["partner_campaign_id"]
            isOneToOne: false
            referencedRelation: "partner_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_tracking_events_partner_campaign_membership_id_fkey"
            columns: ["partner_campaign_membership_id"]
            isOneToOne: false
            referencedRelation: "partner_campaign_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          activated_at: string | null
          app_key: string
          bonus_credit: number | null
          client_id: string | null
          created_at: string | null
          credit_amount: number | null
          credited_at: string | null
          id: string
          metadata: Json
          partner_campaign_id: string | null
          partner_campaign_membership_id: string | null
          referral_code: string
          referral_type: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          activated_at?: string | null
          app_key?: string
          bonus_credit?: number | null
          client_id?: string | null
          created_at?: string | null
          credit_amount?: number | null
          credited_at?: string | null
          id?: string
          metadata?: Json
          partner_campaign_id?: string | null
          partner_campaign_membership_id?: string | null
          referral_code: string
          referral_type?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          activated_at?: string | null
          app_key?: string
          bonus_credit?: number | null
          client_id?: string | null
          created_at?: string | null
          credit_amount?: number | null
          credited_at?: string | null
          id?: string
          metadata?: Json
          partner_campaign_id?: string | null
          partner_campaign_membership_id?: string | null
          referral_code?: string
          referral_type?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_partner_campaign_id_fkey"
            columns: ["partner_campaign_id"]
            isOneToOne: false
            referencedRelation: "partner_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_partner_campaign_membership_id_fkey"
            columns: ["partner_campaign_membership_id"]
            isOneToOne: false
            referencedRelation: "partner_campaign_memberships"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "jobs_marketplace_public"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "jobs_marketplace_public"
            referencedColumns: ["id"]
          },
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
          platform: Database["public"]["Enums"]["baise_platform"]
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name_en: string
          name_pt: string
          order_index?: number | null
          platform?: Database["public"]["Enums"]["baise_platform"]
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name_en?: string
          name_pt?: string
          order_index?: number | null
          platform?: Database["public"]["Enums"]["baise_platform"]
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
      skill_tags: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          name_en: string
          name_pt: string
          platform: Database["public"]["Enums"]["baise_platform"]
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          name_en: string
          name_pt: string
          platform: Database["public"]["Enums"]["baise_platform"]
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          name_en?: string
          name_pt?: string
          platform?: Database["public"]["Enums"]["baise_platform"]
        }
        Relationships: [
          {
            foreignKeyName: "skill_tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
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
      stories: {
        Row: {
          background_gradient: string | null
          created_at: string
          duration_seconds: number
          expires_at: string
          filter: string | null
          id: string
          media_type: string
          media_url: string
          overlays: Json | null
          thumbnail_url: string | null
          user_id: string
          view_count: number
        }
        Insert: {
          background_gradient?: string | null
          created_at?: string
          duration_seconds?: number
          expires_at?: string
          filter?: string | null
          id?: string
          media_type?: string
          media_url: string
          overlays?: Json | null
          thumbnail_url?: string | null
          user_id: string
          view_count?: number
        }
        Update: {
          background_gradient?: string | null
          created_at?: string
          duration_seconds?: number
          expires_at?: string
          filter?: string | null
          id?: string
          media_type?: string
          media_url?: string
          overlays?: Json | null
          thumbnail_url?: string | null
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_assignments: {
        Row: {
          active_job_id: string | null
          agreed_amount: number
          contractor_provider_id: string
          created_at: string
          id: string
          metadata: Json
          release_benchmark: string | null
          scope_description: string
          status: string
          subcontractor_id: string
          updated_at: string
        }
        Insert: {
          active_job_id?: string | null
          agreed_amount?: number
          contractor_provider_id: string
          created_at?: string
          id?: string
          metadata?: Json
          release_benchmark?: string | null
          scope_description: string
          status?: string
          subcontractor_id: string
          updated_at?: string
        }
        Update: {
          active_job_id?: string | null
          agreed_amount?: number
          contractor_provider_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          release_benchmark?: string | null
          scope_description?: string
          status?: string
          subcontractor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_assignments_active_job_id_fkey"
            columns: ["active_job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_assignments_contractor_provider_id_fkey"
            columns: ["contractor_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_assignments_contractor_provider_id_fkey"
            columns: ["contractor_provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_assignments_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "provider_subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          permissions: string[] | null
          provider_id: string
          role: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          permissions?: string[] | null
          provider_id: string
          role?: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          permissions?: string[] | null
          provider_id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string | null
          joined_at: string | null
          permissions: string[] | null
          provider_id: string
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: string[] | null
          provider_id: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: string[] | null
          provider_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cohort_invites: {
        Row: {
          app_key: string
          campaign_id: string
          claimed_at: string | null
          claimed_by: string | null
          code_hash: string
          code_last4: string | null
          created_at: string
          created_by: string
          expires_at: string
          grant_days: number
          grant_expires_at: string | null
          granted_tier: Database["public"]["Enums"]["subscription_tier"] | null
          id: string
          intended_role: string
          label: string
          metadata: Json
          platform: Database["public"]["Enums"]["baise_platform"]
          revoked_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          app_key: string
          campaign_id: string
          claimed_at?: string | null
          claimed_by?: string | null
          code_hash: string
          code_last4?: string | null
          created_at?: string
          created_by: string
          expires_at?: string
          grant_days?: number
          grant_expires_at?: string | null
          granted_tier?: Database["public"]["Enums"]["subscription_tier"] | null
          id?: string
          intended_role: string
          label: string
          metadata?: Json
          platform: Database["public"]["Enums"]["baise_platform"]
          revoked_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          app_key?: string
          campaign_id?: string
          claimed_at?: string | null
          claimed_by?: string | null
          code_hash?: string
          code_last4?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          grant_days?: number
          grant_expires_at?: string | null
          granted_tier?: Database["public"]["Enums"]["subscription_tier"] | null
          id?: string
          intended_role?: string
          label?: string
          metadata?: Json
          platform?: Database["public"]["Enums"]["baise_platform"]
          revoked_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_cohort_invites_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotional_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cohort_redeem_attempts: {
        Row: {
          app_key: string | null
          code_prefix: string | null
          created_at: string
          id: string
          outcome: string
          user_id: string
        }
        Insert: {
          app_key?: string | null
          code_prefix?: string | null
          created_at?: string
          id?: string
          outcome: string
          user_id: string
        }
        Update: {
          app_key?: string | null
          code_prefix?: string | null
          created_at?: string
          id?: string
          outcome?: string
          user_id?: string
        }
        Relationships: []
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
            referencedRelation: "jobs_marketplace_public"
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
      video_sessions: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          created_at: string
          id: string
          job_id: string | null
          patient_id: string
          provider_id: string
          recording_consent: boolean | null
          recording_url: string | null
          scheduled_end: string | null
          scheduled_start: string
          session_notes: string | null
          status: string | null
          technical_quality_rating: number | null
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          patient_id: string
          provider_id: string
          recording_consent?: boolean | null
          recording_url?: string | null
          scheduled_end?: string | null
          scheduled_start: string
          session_notes?: string | null
          status?: string | null
          technical_quality_rating?: number | null
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          patient_id?: string
          provider_id?: string
          recording_consent?: boolean | null
          recording_url?: string | null
          scheduled_end?: string | null
          scheduled_start?: string
          session_notes?: string | null
          status?: string | null
          technical_quality_rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_marketplace_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_posted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
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
            referencedRelation: "jobs_marketplace_public"
            referencedColumns: ["id"]
          },
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
      web_push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_label: string | null
          endpoint: string
          failure_count: number
          id: string
          is_active: boolean
          last_failure_at: string | null
          last_success_at: string | null
          p256dh: string
          subscription_json: Json
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_label?: string | null
          endpoint: string
          failure_count?: number
          id?: string
          is_active?: boolean
          last_failure_at?: string | null
          last_success_at?: string | null
          p256dh: string
          subscription_json: Json
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_label?: string | null
          endpoint?: string
          failure_count?: number
          id?: string
          is_active?: boolean
          last_failure_at?: string | null
          last_success_at?: string | null
          p256dh?: string
          subscription_json?: Json
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
      jobs_marketplace_public: {
        Row: {
          appointment_type: string | null
          bid_deadline: string | null
          budget_disclosed: boolean | null
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          created_at: string | null
          customer_id: string | null
          description: string | null
          id: string | null
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
          platform: Database["public"]["Enums"]["baise_platform"] | null
          preferred_end_date: string | null
          preferred_start_date: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string | null
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
          customer_id?: string | null
          description?: string | null
          id?: string | null
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
          platform?: Database["public"]["Enums"]["baise_platform"] | null
          preferred_end_date?: string | null
          preferred_start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title?: string | null
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
          customer_id?: string | null
          description?: string | null
          id?: string | null
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
          platform?: Database["public"]["Enums"]["baise_platform"] | null
          preferred_end_date?: string | null
          preferred_start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title?: string | null
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
          accepts_new_patients: boolean | null
          avatar_url: string | null
          avg_rating: number | null
          bio: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          consultation_fee: number | null
          consultation_types: string[] | null
          created_at: string | null
          crm_number: string | null
          emergency_available: boolean | null
          guarantee_info: string | null
          hospital_affiliations: string[] | null
          id: string | null
          is_background_checked: boolean | null
          is_insured: boolean | null
          is_licensed: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          platform: Database["public"]["Enums"]["baise_platform"] | null
          response_time_hours: number | null
          service_radius_km: number | null
          specialty_id: string | null
          state: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tagline: string | null
          teleconsultation_available: boolean | null
          total_jobs: number | null
          total_patients: number | null
          total_reviews: number | null
          user_id: string | null
          warranty_info: string | null
          years_experience: number | null
        }
        Insert: {
          accepts_new_patients?: boolean | null
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_types?: string[] | null
          created_at?: string | null
          crm_number?: string | null
          emergency_available?: boolean | null
          guarantee_info?: string | null
          hospital_affiliations?: string[] | null
          id?: string | null
          is_background_checked?: boolean | null
          is_insured?: boolean | null
          is_licensed?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          platform?: Database["public"]["Enums"]["baise_platform"] | null
          response_time_hours?: number | null
          service_radius_km?: number | null
          specialty_id?: string | null
          state?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tagline?: string | null
          teleconsultation_available?: boolean | null
          total_jobs?: number | null
          total_patients?: number | null
          total_reviews?: number | null
          user_id?: string | null
          warranty_info?: string | null
          years_experience?: number | null
        }
        Update: {
          accepts_new_patients?: boolean | null
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_types?: string[] | null
          created_at?: string | null
          crm_number?: string | null
          emergency_available?: boolean | null
          guarantee_info?: string | null
          hospital_affiliations?: string[] | null
          id?: string | null
          is_background_checked?: boolean | null
          is_insured?: boolean | null
          is_licensed?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          platform?: Database["public"]["Enums"]["baise_platform"] | null
          response_time_hours?: number | null
          service_radius_km?: number | null
          specialty_id?: string | null
          state?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tagline?: string | null
          teleconsultation_available?: boolean | null
          total_jobs?: number | null
          total_patients?: number | null
          total_reviews?: number | null
          user_id?: string | null
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
    }
    Functions: {
      activate_partner_applications_for_user: {
        Args: { target_email?: string; target_user_id: string }
        Returns: number
      }
      app_key_to_platform: {
        Args: { p_app_key: string }
        Returns: Database["public"]["Enums"]["baise_platform"]
      }
      apply_provider_balance_delta: {
        Args: {
          balance_bucket: string
          balance_currency?: string
          delta_amount: number
          target_provider_id: string
        }
        Returns: undefined
      }
      approve_client_testimonial_reward: {
        Args: { target_reward_id: string }
        Returns: {
          active_job_id: string | null
          amount_brl: number
          app_key: string
          approved_at: string | null
          approved_by: string | null
          client_id: string | null
          created_at: string
          credited_at: string | null
          customer_id: string
          id: string
          job_id: string | null
          metadata: Json
          provider_id: string
          referral_code: string | null
          rejection_reason: string | null
          request_id: string | null
          reward_type: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "client_testimonial_rewards"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      build_partner_campaign_url: {
        Args: {
          target_app_key: string
          target_code: string
          target_path?: string
        }
        Returns: string
      }
      build_referral_url: {
        Args: { target_app_key: string; target_code: string }
        Returns: string
      }
      create_document_vault_item: {
        Args: {
          item_bucket_id?: string
          item_category?: string
          item_file_name?: string
          item_file_path?: string
          item_metadata?: Json
          item_title?: string
          item_visibility?: string
          target_client_user_id?: string
          target_contact_id?: string
          target_provider_id: string
        }
        Returns: string
      }
      current_user_is_test_account: { Args: never; Returns: boolean }
      current_user_is_test_cohort_peer: {
        Args: { target_platform: Database["public"]["Enums"]["baise_platform"] }
        Returns: boolean
      }
      current_user_test_cohort_app_key: { Args: never; Returns: string }
      ensure_profile_referral_identity: {
        Args: { target_app_key?: string; target_user_id: string }
        Returns: {
          client_id: string
          referral_code: string
          referral_slug: string
          referral_url: string
        }[]
      }
      expire_tier_grants: { Args: never; Returns: Json }
      generate_partner_payout_receipt: {
        Args: {
          target_period_end?: string
          target_period_start: string
          target_period_type: string
        }
        Returns: {
          currency: string
          generated_at: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          receipt_number: string
          total_amount: number
        }[]
      }
      grant_client_access: {
        Args: {
          access_level_value?: string
          access_metadata?: Json
          access_source_value?: string
          target_client_user_id?: string
          target_contact_id?: string
          target_provider_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_cohort_code: { Args: { p_code: string }; Returns: string }
      increment_user_credits_balance: {
        Args: { credit_amount: number; target_user_id: string }
        Returns: undefined
      }
      is_admin_or_moderator: { Args: never; Returns: boolean }
      issue_test_cohort_codes: {
        Args: { p_campaign_id: string; p_specs: Json }
        Returns: Json
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
      log_member_lifecycle_event: {
        Args: {
          conversion_reason_text?: string
          event_metadata?: Json
          event_notes?: string
          lifecycle_event_type?: string
          lifecycle_stage_value?: string
          projected_ltv_value?: number
          target_app_key?: string
          target_contact_id?: string
          target_member_user_id?: string
          target_provider_id: string
        }
        Returns: string
      }
      log_provider_audit_event: {
        Args: {
          actor_id: string
          actor_kind: string
          event_action: string
          event_metadata?: Json
          event_resource_id?: string
          event_resource_type: string
          event_severity?: string
          target_provider_id: string
        }
        Returns: string
      }
      normalize_cohort_code: { Args: { p_code: string }; Returns: string }
      normalize_partner_campaign_code: {
        Args: { input_code: string }
        Returns: string
      }
      normalize_referral_code: { Args: { input_code: string }; Returns: string }
      preview_test_cohort_code: {
        Args: { p_app_key: string; p_code: string }
        Returns: Json
      }
      promote_current_user_to_provider: { Args: never; Returns: Json }
      provider_owned_by_current_user: {
        Args: { target_provider_id: string }
        Returns: boolean
      }
      queue_provider_campaign_template_send: {
        Args: {
          send_metadata?: Json
          target_contact_id?: string
          target_provider_id: string
          target_recipient_email?: string
          target_recipient_user_id?: string
          target_template_id: string
        }
        Returns: string
      }
      queue_provider_update_notifications: {
        Args: {
          action_path?: string
          actor_id: string
          event_key: string
          event_message?: string
          event_metadata?: Json
          event_subject?: string
          resource_kind?: string
          resource_uuid?: string
          target_app_key?: string
          target_audience?: string
          target_email?: string
          target_locale?: string
          target_phone?: string
          target_provider_id: string
          target_user_id: string
        }
        Returns: number
      }
      record_signup_attribution: {
        Args: {
          raw_metadata?: Json
          target_email: string
          target_user_id: string
        }
        Returns: undefined
      }
      record_visibility_qa_check: {
        Args: {
          qa_check_type: string
          qa_detail?: string
          qa_evidence?: Json
          qa_status: string
          qa_title: string
          target_app_key: string
          target_provider_id: string
        }
        Returns: string
      }
      redeem_test_cohort_code: {
        Args: { p_app_key: string; p_business_name?: string; p_code: string }
        Returns: Json
      }
      refresh_partner_campaign_membership_metrics: {
        Args: { target_membership_id: string }
        Returns: undefined
      }
      resolve_referral_identity: {
        Args: { target_code: string }
        Returns: {
          app_key: string
          client_id: string
          referral_code: string
          referral_slug: string
          referral_url: string
          referrer_id: string
          referrer_label: string
          user_type: string
        }[]
      }
      review_partner_influencer_application: {
        Args: {
          review_decision: string
          review_note?: string
          target_application_id: string
        }
        Returns: {
          application_id: string
          application_status: string
          membership_id: string
          partner_user_id: string
        }[]
      }
      revoke_test_cohort_invite: {
        Args: { p_invite_id: string }
        Returns: Json
      }
      safe_partner_integer: { Args: { raw_value: string }; Returns: number }
      seed_provider_lifecycle_campaign_templates: {
        Args: { target_app_key?: string; target_provider_id: string }
        Returns: number
      }
      simulate_provider_payment: {
        Args: {
          p_amount?: number
          p_currency?: string
          p_invoice_id: string
          p_payment_plan_item_id?: string
          p_provider_id: string
          p_scenario?: string
        }
        Returns: Json
      }
      submit_influencer_partner_application: {
        Args: {
          application_payload: Json
          application_stage: string
          existing_application_id?: string
          existing_application_token?: string
          target_app_key: string
        }
        Returns: {
          application_id: string
          application_status: string
          application_token: string
          review_due_at: string
        }[]
      }
      submit_pilot_application: {
        Args: {
          p_app_key: string
          p_city?: string
          p_consent_lgpd: boolean
          p_consent_terms: boolean
          p_consent_version: string
          p_device?: string
          p_email: string
          p_full_name: string
          p_intended_role: string
          p_motivation?: string
          p_phone?: string
          p_profession?: string
          p_years_experience?: number
        }
        Returns: Json
      }
      tier_grant_is_active: {
        Args: { p_provider_id: string }
        Returns: boolean
      }
      track_partner_campaign_click: {
        Args: {
          event_metadata?: Json
          target_event_type?: string
          target_tracking_code: string
        }
        Returns: string
      }
      track_referral_event: {
        Args: {
          event_metadata?: Json
          target_app_key?: string
          target_code: string
          target_event_type?: string
        }
        Returns: string
      }
      track_referral_invite: {
        Args: {
          target_metadata?: Json
          target_referral_code: string
          target_referral_type?: string
          target_referred_email: string
          target_referrer_id: string
        }
        Returns: string
      }
      update_partner_campaign_code: {
        Args: { requested_code: string; target_membership_id: string }
        Returns: {
          custom_code: string
          membership_id: string
          qr_payload: string
          tracking_url: string
        }[]
      }
      update_provider_engagement_gate: {
        Args: {
          client_message_text?: string
          gate_metadata?: Json
          gate_status_value?: string
          gate_type_value?: string
          required_action_text?: string
          resource_type_value?: string
          resource_uuid?: string
          target_client_user_id?: string
          target_contact_id?: string
          target_provider_id: string
        }
        Returns: string
      }
      upgrade_member_to_client: {
        Args: {
          conversion_metadata?: Json
          conversion_reason_text?: string
          projected_ltv_value?: number
          target_contact_id: string
          target_member_user_id?: string
          target_provider_id: string
        }
        Returns: string
      }
      user_is_test_account: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      baise_platform: "casa_baise" | "medical_baise" | "legal_baise"
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
      baise_platform: ["casa_baise", "medical_baise", "legal_baise"],
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
