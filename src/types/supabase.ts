/**
 * Supabase Database Types
 * These types map to the tables defined in supabase/schema.sql
 * Replace with auto-generated types using: npm run db:types
 */

export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_yearly';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete';
export type ProductType = 'digital' | 'course' | 'coaching';
export type TemplateCategory = 'minimal' | 'bold' | 'elegant' | 'creative' | 'professional';
export type OrderStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type StripeAccountStatus = 'not_connected' | 'pending' | 'complete';
export type PayPalAccountStatus = 'not_connected' | 'pending' | 'connected';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled_by_creator' | 'cancelled_by_buyer' | 'completed' | 'no_show';
export type CancellationPolicy = 'full_refund' | 'no_refund' | 'refund_if_24hrs';
export type VideoPlatform = 'whereby' | 'zoom' | 'google_meet' | 'custom';
export type CourseStatus = 'draft' | 'published';
export type CourseCategory = 'business' | 'marketing' | 'health' | 'tech' | 'creative' | 'lifestyle' | 'other';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type LessonType = 'video' | 'text' | 'file';
export type CommissionLedgerSaleType = 'order' | 'booking' | 'course_enrollment';
export type UpgradeNudgeType = 'first_sale' | 'third_sale' | 'fourth_product_attempt' | 'email_limit_warning';

export interface DaySchedule {
  enabled: boolean;
  start: string; // "HH:MM" format
  end: string;
  break_start: string | null;
  break_end: string | null;
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface IntakeQuestion {
  id: string;
  question: string;
  required: boolean;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          banner_url: string | null;
          page_background_type: 'none' | 'color' | 'gradient' | 'image';
          page_background_value: string | null;
          website: string | null;
          subscription_tier: SubscriptionTier;
          stripe_account_id: string | null;
          stripe_account_status: StripeAccountStatus | null;
          paypal_account_id: string | null;
          paypal_account_status: PayPalAccountStatus;
          paypal_email: string | null;
          stripe_customer_id: string | null;
          custom_domain: string | null;
          domain_verified: boolean;
          template_id: string | null;
          template_slug: string | null;
          onboarding_completed: boolean;
          testimonials_enabled: boolean;
          show_avatar_on_banner: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          page_background_type?: 'none' | 'color' | 'gradient' | 'image';
          page_background_value?: string | null;
          website?: string | null;
          subscription_tier?: SubscriptionTier;
          stripe_account_id?: string | null;
          stripe_account_status?: StripeAccountStatus | null;
          paypal_account_id?: string | null;
          paypal_account_status?: PayPalAccountStatus;
          paypal_email?: string | null;
          stripe_customer_id?: string | null;
          custom_domain?: string | null;
          domain_verified?: boolean;
          template_id?: string | null;
          template_slug?: string | null;
          onboarding_completed?: boolean;
          testimonials_enabled?: boolean;
          show_avatar_on_banner?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          page_background_type?: 'none' | 'color' | 'gradient' | 'image';
          page_background_value?: string | null;
          website?: string | null;
          subscription_tier?: SubscriptionTier;
          stripe_account_id?: string | null;
          stripe_account_status?: StripeAccountStatus | null;
          paypal_account_id?: string | null;
          paypal_account_status?: PayPalAccountStatus;
          paypal_email?: string | null;
          stripe_customer_id?: string | null;
          custom_domain?: string | null;
          domain_verified?: boolean;
          template_id?: string | null;
          template_slug?: string | null;
          onboarding_completed?: boolean;
          testimonials_enabled?: boolean;
          show_avatar_on_banner?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      templates: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category: TemplateCategory;
          preview_image_url: string | null;
          thumbnail_url: string | null;
          is_active: boolean;
          is_premium: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          category: TemplateCategory;
          preview_image_url?: string | null;
          thumbnail_url?: string | null;
          is_active?: boolean;
          is_premium?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          category?: TemplateCategory;
          preview_image_url?: string | null;
          thumbnail_url?: string | null;
          is_active?: boolean;
          is_premium?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          subtitle: string | null;
          description: string | null;
          price: number;
          currency: string;
          type: ProductType;
          cover_image_url: string | null;
          header_banner_url: string | null;
          file_url: string | null;
          offer_enabled: boolean;
          offer_discount_price_cents: number | null;
          offer_limit_type: 'none' | 'time' | 'claims' | 'both';
          offer_expires_at: string | null;
          offer_max_claims: number | null;
          offer_claims_used: number;
          offer_bonus_product_id: string | null;
          is_published: boolean;
          sort_order: number;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          subtitle?: string | null;
          description?: string | null;
          price?: number;
          currency?: string;
          type: ProductType;
          cover_image_url?: string | null;
          header_banner_url?: string | null;
          file_url?: string | null;
          offer_enabled?: boolean;
          offer_discount_price_cents?: number | null;
          offer_limit_type?: 'none' | 'time' | 'claims' | 'both';
          offer_expires_at?: string | null;
          offer_max_claims?: number | null;
          offer_claims_used?: number;
          offer_bonus_product_id?: string | null;
          is_published?: boolean;
          sort_order?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          subtitle?: string | null;
          description?: string | null;
          price?: number;
          currency?: string;
          type?: ProductType;
          cover_image_url?: string | null;
          header_banner_url?: string | null;
          file_url?: string | null;
          offer_enabled?: boolean;
          offer_discount_price_cents?: number | null;
          offer_limit_type?: 'none' | 'time' | 'claims' | 'both';
          offer_expires_at?: string | null;
          offer_max_claims?: number | null;
          offer_claims_used?: number;
          offer_bonus_product_id?: string | null;
          is_published?: boolean;
          sort_order?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          stripe_price_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: SubscriptionPlan;
          status?: SubscriptionStatus;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          product_id: string;
          creator_id: string;
          buyer_email: string;
          amount_cents: number;
          platform_fee_cents: number;
          net_amount_cents: number;
          stripe_payment_intent_id: string | null;
          offer_applied: boolean;
          offer_discount_cents: number;
          offer_bonus_product_id: string | null;
          bonus_from_order_id: string | null;
          status: OrderStatus;
          delivery_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          creator_id: string;
          buyer_email: string;
          amount_cents: number;
          platform_fee_cents?: number;
          stripe_payment_intent_id?: string | null;
          offer_applied?: boolean;
          offer_discount_cents?: number;
          offer_bonus_product_id?: string | null;
          bonus_from_order_id?: string | null;
          status?: OrderStatus;
          delivery_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          creator_id?: string;
          buyer_email?: string;
          amount_cents?: number;
          platform_fee_cents?: number;
          stripe_payment_intent_id?: string | null;
          offer_applied?: boolean;
          offer_discount_cents?: number;
          offer_bonus_product_id?: string | null;
          bonus_from_order_id?: string | null;
          status?: OrderStatus;
          delivery_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_downloads: {
        Row: {
          id: string;
          order_id: string;
          downloaded_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          downloaded_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          downloaded_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      availability_schedules: {
        Row: {
          id: string;
          creator_id: string;
          timezone: string;
          weekly_schedule: WeeklySchedule;
          buffer_minutes: number;
          max_bookings_per_day: number;
          min_notice_hours: number;
          cancellation_policy: CancellationPolicy;
          custom_confirmation_message: string | null;
          video_platform: VideoPlatform;
          custom_video_url: string | null;
          intake_questions: IntakeQuestion[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          timezone?: string;
          weekly_schedule?: WeeklySchedule;
          buffer_minutes?: number;
          max_bookings_per_day?: number;
          min_notice_hours?: number;
          cancellation_policy?: CancellationPolicy;
          custom_confirmation_message?: string | null;
          video_platform?: VideoPlatform;
          custom_video_url?: string | null;
          intake_questions?: IntakeQuestion[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          timezone?: string;
          weekly_schedule?: WeeklySchedule;
          buffer_minutes?: number;
          max_bookings_per_day?: number;
          min_notice_hours?: number;
          cancellation_policy?: CancellationPolicy;
          custom_confirmation_message?: string | null;
          video_platform?: VideoPlatform;
          custom_video_url?: string | null;
          intake_questions?: IntakeQuestion[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blocked_dates: {
        Row: {
          id: string;
          creator_id: string;
          blocked_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          blocked_date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          blocked_date?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          product_id: string | null;
          creator_id: string;
          buyer_name: string;
          buyer_email: string;
          buyer_phone: string | null;
          buyer_notes: string | null;
          intake_answers: Record<string, string>;
          scheduled_at: string;
          duration_minutes: number;
          timezone: string;
          amount_cents: number;
          platform_fee_cents: number;
          net_amount_cents: number;
          stripe_payment_intent_id: string | null;
          video_call_url: string | null;
          status: BookingStatus;
          cancellation_token: string;
          reschedule_token: string;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          creator_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          creator_id: string;
          buyer_name: string;
          buyer_email: string;
          buyer_phone?: string | null;
          buyer_notes?: string | null;
          intake_answers?: Record<string, string>;
          scheduled_at: string;
          duration_minutes: number;
          timezone?: string;
          amount_cents: number;
          platform_fee_cents?: number;
          stripe_payment_intent_id?: string | null;
          video_call_url?: string | null;
          status?: BookingStatus;
          cancellation_token?: string;
          reschedule_token?: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          creator_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          creator_id?: string;
          buyer_name?: string;
          buyer_email?: string;
          buyer_phone?: string | null;
          buyer_notes?: string | null;
          intake_answers?: Record<string, string>;
          scheduled_at?: string;
          duration_minutes?: number;
          timezone?: string;
          amount_cents?: number;
          platform_fee_cents?: number;
          stripe_payment_intent_id?: string | null;
          video_call_url?: string | null;
          status?: BookingStatus;
          cancellation_token?: string;
          reschedule_token?: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          creator_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // Phase 5: Courses
      courses: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          slug: string;
          subtitle: string | null;
          description: string | null;
          cover_image_url: string | null;
          promo_video_url: string | null;
          category: CourseCategory;
          difficulty: CourseDifficulty;
          price_cents: number;
          status: CourseStatus;
          student_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          slug: string;
          subtitle?: string | null;
          description?: string | null;
          cover_image_url?: string | null;
          promo_video_url?: string | null;
          category?: CourseCategory;
          difficulty?: CourseDifficulty;
          price_cents: number;
          status?: CourseStatus;
          student_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          slug?: string;
          subtitle?: string | null;
          description?: string | null;
          cover_image_url?: string | null;
          promo_video_url?: string | null;
          category?: CourseCategory;
          difficulty?: CourseDifficulty;
          price_cents?: number;
          status?: CourseStatus;
          student_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_sections: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      course_lessons: {
        Row: {
          id: string;
          section_id: string;
          course_id: string;
          title: string;
          type: LessonType;
          position: number;
          video_url: string | null;
          video_duration_seconds: number | null;
          content: string | null;
          file_url: string | null;
          is_free_preview: boolean;
          estimated_duration_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          course_id: string;
          title: string;
          type: LessonType;
          position: number;
          video_url?: string | null;
          video_duration_seconds?: number | null;
          content?: string | null;
          file_url?: string | null;
          is_free_preview?: boolean;
          estimated_duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section_id?: string;
          course_id?: string;
          title?: string;
          type?: LessonType;
          position?: number;
          video_url?: string | null;
          video_duration_seconds?: number | null;
          content?: string | null;
          file_url?: string | null;
          is_free_preview?: boolean;
          estimated_duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lesson_attachments: {
        Row: {
          id: string;
          lesson_id: string;
          file_name: string;
          file_url: string;
          file_size_bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          file_name: string;
          file_url: string;
          file_size_bytes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          file_name?: string;
          file_url?: string;
          file_size_bytes?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          course_id: string;
          creator_id: string;
          student_email: string;
          student_user_id: string | null;
          amount_cents: number;
          platform_fee_cents: number;
          net_amount_cents: number;
          stripe_payment_intent_id: string | null;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          creator_id: string;
          student_email: string;
          student_user_id?: string | null;
          amount_cents: number;
          platform_fee_cents?: number;
          net_amount_cents?: number;
          stripe_payment_intent_id?: string | null;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          creator_id?: string;
          student_email?: string;
          student_user_id?: string | null;
          amount_cents?: number;
          platform_fee_cents?: number;
          net_amount_cents?: number;
          stripe_payment_intent_id?: string | null;
          enrolled_at?: string;
        };
        Relationships: [];
      };
      lesson_progress: {
        Row: {
          id: string;
          enrollment_id: string;
          lesson_id: string;
          student_user_id: string | null;
          is_completed: boolean;
          watch_position_seconds: number;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          lesson_id: string;
          student_user_id?: string | null;
          is_completed?: boolean;
          watch_position_seconds?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          lesson_id?: string;
          student_user_id?: string | null;
          is_completed?: boolean;
          watch_position_seconds?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      commission_ledger: {
        Row: {
          id: string;
          creator_id: string | null;
          order_id: string | null;
          sale_type: CommissionLedgerSaleType;
          sale_reference_id: string | null;
          stripe_payment_intent_id: string | null;
          sale_amount_cents: number;
          commission_rate: number;
          commission_amount_cents: number;
          stripe_transfer_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id?: string | null;
          order_id?: string | null;
          sale_type?: CommissionLedgerSaleType;
          sale_reference_id?: string | null;
          stripe_payment_intent_id?: string | null;
          sale_amount_cents: number;
          commission_rate?: number;
          commission_amount_cents: number;
          stripe_transfer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string | null;
          order_id?: string | null;
          sale_type?: CommissionLedgerSaleType;
          sale_reference_id?: string | null;
          stripe_payment_intent_id?: string | null;
          sale_amount_cents?: number;
          commission_rate?: number;
          commission_amount_cents?: number;
          stripe_transfer_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      upgrade_nudges: {
        Row: {
          id: string;
          user_id: string | null;
          nudge_type: UpgradeNudgeType;
          shown_at: string;
          clicked: boolean;
          converted: boolean;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          nudge_type: UpgradeNudgeType;
          shown_at?: string;
          clicked?: boolean;
          converted?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          nudge_type?: UpgradeNudgeType;
          shown_at?: string;
          clicked?: boolean;
          converted?: boolean;
        };
        Relationships: [];
      };
      email_subscribers: {
        Row: {
          id: string;
          creator_id: string;
          email: string;
          name: string | null;
          source: string | null;
          created_at: string;
          first_name: string | null;
          tags: string[] | null;
          is_active: boolean | null;
          subscribed_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          email: string;
          name?: string | null;
          source?: string | null;
          created_at?: string;
          first_name?: string | null;
          tags?: string[] | null;
          is_active?: boolean | null;
          subscribed_at?: string | null;
        };
        Update: {
          id?: string;
          creator_id?: string;
          email?: string;
          name?: string | null;
          source?: string | null;
          created_at?: string;
          first_name?: string | null;
          tags?: string[] | null;
          is_active?: boolean | null;
          subscribed_at?: string | null;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          creator_id: string | null;
          event_type: string;
          product_id: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          country: string | null;
          device: string | null;
          metadata: Record<string, string> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id?: string | null;
          event_type: string;
          product_id?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          country?: string | null;
          device?: string | null;
          metadata?: Record<string, string> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string | null;
          event_type?: string;
          product_id?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          country?: string | null;
          device?: string | null;
          metadata?: Record<string, string> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      email_broadcasts: {
        Row: {
          id: string;
          creator_id: string | null;
          subject: string;
          preview_text: string | null;
          body_html: string;
          segment: Record<string, string> | null;
          status: string;
          scheduled_at: string | null;
          sent_at: string | null;
          recipient_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id?: string | null;
          subject: string;
          preview_text?: string | null;
          body_html: string;
          segment?: Record<string, string> | null;
          status?: string;
          scheduled_at?: string | null;
          sent_at?: string | null;
          recipient_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string | null;
          subject?: string;
          preview_text?: string | null;
          body_html?: string;
          segment?: Record<string, string> | null;
          status?: string;
          scheduled_at?: string | null;
          sent_at?: string | null;
          recipient_count?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      email_sends: {
        Row: {
          id: string;
          broadcast_id: string | null;
          subscriber_id: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          broadcast_id?: string | null;
          subscriber_id?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          broadcast_id?: string | null;
          subscriber_id?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      email_sequences: {
        Row: {
          id: string;
          creator_id: string | null;
          name: string;
          trigger: string;
          trigger_product_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id?: string | null;
          name: string;
          trigger: string;
          trigger_product_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string | null;
          name?: string;
          trigger?: string;
          trigger_product_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      email_sequence_steps: {
        Row: {
          id: string;
          sequence_id: string | null;
          position: number;
          delay_days: number;
          subject: string;
          body_html: string;
        };
        Insert: {
          id?: string;
          sequence_id?: string | null;
          position: number;
          delay_days?: number;
          subject: string;
          body_html: string;
        };
        Update: {
          id?: string;
          sequence_id?: string | null;
          position?: number;
          delay_days?: number;
          subject?: string;
          body_html?: string;
        };
        Relationships: [];
      };
      email_sequence_enrollments: {
        Row: {
          id: string;
          sequence_id: string | null;
          subscriber_id: string | null;
          current_step: number;
          next_send_at: string | null;
          completed: boolean;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          sequence_id?: string | null;
          subscriber_id?: string | null;
          current_step?: number;
          next_send_at?: string | null;
          completed?: boolean;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          sequence_id?: string | null;
          subscriber_id?: string | null;
          current_step?: number;
          next_send_at?: string | null;
          completed?: boolean;
          enrolled_at?: string;
        };
        Relationships: [];
      };
      bundles: {
        Row: {
          id: string;
          creator_id: string | null;
          title: string;
          description: string | null;
          cover_image_url: string | null;
          price_cents: number;
          original_value_cents: number;
          is_published: boolean;
          show_on_storefront: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id?: string | null;
          title: string;
          description?: string | null;
          cover_image_url?: string | null;
          price_cents: number;
          original_value_cents: number;
          is_published?: boolean;
          show_on_storefront?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string | null;
          title?: string;
          description?: string | null;
          cover_image_url?: string | null;
          price_cents?: number;
          original_value_cents?: number;
          is_published?: boolean;
          show_on_storefront?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      bundle_products: {
        Row: {
          id: string;
          bundle_id: string | null;
          product_id: string | null;
          position: number;
        };
        Insert: {
          id?: string;
          bundle_id?: string | null;
          product_id?: string | null;
          position: number;
        };
        Update: {
          id?: string;
          bundle_id?: string | null;
          product_id?: string | null;
          position?: number;
        };
        Relationships: [];
      };
      affiliates: {
        Row: {
          id: string;
          creator_id: string | null;
          affiliate_email: string;
          affiliate_name: string;
          affiliate_code: string;
          commission_rate: number;
          status: string;
          total_referred_sales_cents: number;
          total_commission_earned_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id?: string | null;
          affiliate_email: string;
          affiliate_name: string;
          affiliate_code: string;
          commission_rate: number;
          status?: string;
          total_referred_sales_cents?: number;
          total_commission_earned_cents?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string | null;
          affiliate_email?: string;
          affiliate_name?: string;
          affiliate_code?: string;
          commission_rate?: number;
          status?: string;
          total_referred_sales_cents?: number;
          total_commission_earned_cents?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      affiliate_conversions: {
        Row: {
          id: string;
          affiliate_id: string | null;
          order_id: string | null;
          sale_amount_cents: number;
          commission_amount_cents: number;
          status: string;
          release_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          affiliate_id?: string | null;
          order_id?: string | null;
          sale_amount_cents: number;
          commission_amount_cents: number;
          status?: string;
          release_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          affiliate_id?: string | null;
          order_id?: string | null;
          sale_amount_cents?: number;
          commission_amount_cents?: number;
          status?: string;
          release_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          metadata: Record<string, string> | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          metadata?: Record<string, string> | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          metadata?: Record<string, string> | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      commission_monthly_totals: {
        Row: {
          month: string | null;
          total_commission_cents: number | null;
          sales_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Template = Database['public']['Tables']['templates']['Row'];
export type TemplateInsert = Database['public']['Tables']['templates']['Insert'];

export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export type OrderDownload = Database['public']['Tables']['order_downloads']['Row'];
export type OrderDownloadInsert = Database['public']['Tables']['order_downloads']['Insert'];

export type AvailabilitySchedule = Database['public']['Tables']['availability_schedules']['Row'];
export type AvailabilityScheduleInsert = Database['public']['Tables']['availability_schedules']['Insert'];
export type AvailabilityScheduleUpdate = Database['public']['Tables']['availability_schedules']['Update'];

export type BlockedDate = Database['public']['Tables']['blocked_dates']['Row'];
export type BlockedDateInsert = Database['public']['Tables']['blocked_dates']['Insert'];

export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

export type Course = Database['public']['Tables']['courses']['Row'];
export type CourseInsert = Database['public']['Tables']['courses']['Insert'];
export type CourseUpdate = Database['public']['Tables']['courses']['Update'];

export type CourseSection = Database['public']['Tables']['course_sections']['Row'];
export type CourseSectionInsert = Database['public']['Tables']['course_sections']['Insert'];
export type CourseSectionUpdate = Database['public']['Tables']['course_sections']['Update'];

export type CourseLesson = Database['public']['Tables']['course_lessons']['Row'];
export type CourseLessonInsert = Database['public']['Tables']['course_lessons']['Insert'];
export type CourseLessonUpdate = Database['public']['Tables']['course_lessons']['Update'];

export type LessonAttachment = Database['public']['Tables']['lesson_attachments']['Row'];
export type LessonAttachmentInsert = Database['public']['Tables']['lesson_attachments']['Insert'];

export type Enrollment = Database['public']['Tables']['enrollments']['Row'];
export type EnrollmentInsert = Database['public']['Tables']['enrollments']['Insert'];

export type LessonProgress = Database['public']['Tables']['lesson_progress']['Row'];
export type LessonProgressInsert = Database['public']['Tables']['lesson_progress']['Insert'];
export type LessonProgressUpdate = Database['public']['Tables']['lesson_progress']['Update'];

export type CommissionLedger = Database['public']['Tables']['commission_ledger']['Row'];
export type CommissionLedgerInsert = Database['public']['Tables']['commission_ledger']['Insert'];

export type UpgradeNudge = Database['public']['Tables']['upgrade_nudges']['Row'];
export type UpgradeNudgeInsert = Database['public']['Tables']['upgrade_nudges']['Insert'];
export type UpgradeNudgeUpdate = Database['public']['Tables']['upgrade_nudges']['Update'];

export type EmailSubscriber = Database['public']['Tables']['email_subscribers']['Row'];
export type EmailSubscriberInsert = Database['public']['Tables']['email_subscribers']['Insert'];
export type EmailSubscriberUpdate = Database['public']['Tables']['email_subscribers']['Update'];

export type CommissionMonthlyTotal = Database['public']['Views']['commission_monthly_totals']['Row'];
