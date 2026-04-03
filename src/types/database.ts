export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      banners: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          cta_label: string | null;
          cta_href: string | null;
          image_url: string | null;
          gradient: string | null;
          accent_color: string | null;
          position: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          cta_label?: string | null;
          cta_href?: string | null;
          image_url?: string | null;
          gradient?: string | null;
          accent_color?: string | null;
          position?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          cta_label?: string | null;
          cta_href?: string | null;
          image_url?: string | null;
          gradient?: string | null;
          accent_color?: string | null;
          position?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      answers: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          is_official: boolean;
          question_id: string;
          user_id: string | null;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          is_official?: boolean;
          question_id: string;
          user_id?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          is_official?: boolean;
          question_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_queue: {
        Row: {
          created_at: string;
          error: string | null;
          id: string;
          payload: Json;
          processed_at: string | null;
          retry_count: number;
          scheduled_at: string;
          status: Database["public"]["Enums"]["automation_status"];
          type: Database["public"]["Enums"]["automation_type"];
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          id?: string;
          payload?: Json;
          processed_at?: string | null;
          retry_count?: number;
          scheduled_at?: string;
          status?: Database["public"]["Enums"]["automation_status"];
          type: Database["public"]["Enums"]["automation_type"];
        };
        Update: {
          created_at?: string;
          error?: string | null;
          id?: string;
          payload?: Json;
          processed_at?: string | null;
          retry_count?: number;
          scheduled_at?: string;
          status?: Database["public"]["Enums"]["automation_status"];
          type?: Database["public"]["Enums"]["automation_type"];
        };
        Relationships: [];
      };
      bikes: {
        Row: {
          category: string | null;
          id: string;
          make: string;
          model: string;
          year: number;
        };
        Insert: {
          category?: string | null;
          id?: string;
          make: string;
          model: string;
          year: number;
        };
        Update: {
          category?: string | null;
          id?: string;
          make?: string;
          model?: string;
          year?: number;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          cart_id: string;
          color: string | null;
          id: string;
          product_id: string;
          quantity: number;
          size: string | null;
          unit_price: number;
        };
        Insert: {
          cart_id: string;
          color?: string | null;
          id?: string;
          product_id: string;
          quantity?: number;
          size?: string | null;
          unit_price: number;
        };
        Update: {
          cart_id?: string;
          color?: string | null;
          id?: string;
          product_id?: string;
          quantity?: number;
          size?: string | null;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      carts: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          session_id: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          session_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          session_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          parent_id: string | null;
          position: number;
          seo_intro: string | null;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          parent_id?: string | null;
          position?: number;
          seo_intro?: string | null;
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          parent_id?: string | null;
          position?: number;
          seo_intro?: string | null;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_sessions: {
        Row: {
          created_at: string;
          id: string;
          messages: Json;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          messages?: Json;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          messages?: Json;
          user_id?: string | null;
        };
        Relationships: [];
      };
      competitor_prices: {
        Row: {
          competitor: string;
          id: string;
          price: number;
          product_id: string;
          scraped_at: string;
          url: string | null;
        };
        Insert: {
          competitor: string;
          id?: string;
          price: number;
          product_id: string;
          scraped_at?: string;
          url?: string | null;
        };
        Update: {
          competitor?: string;
          id?: string;
          price?: number;
          product_id?: string;
          scraped_at?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "competitor_prices_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_metrics: {
        Row: {
          conversion_rate: number;
          date: string;
          total_orders: number;
          total_revenue: number;
          unique_visitors: number;
        };
        Insert: {
          conversion_rate?: number;
          date: string;
          total_orders?: number;
          total_revenue?: number;
          unique_visitors?: number;
        };
        Update: {
          conversion_rate?: number;
          date?: string;
          total_orders?: number;
          total_revenue?: number;
          unique_visitors?: number;
        };
        Relationships: [];
      };
      email_preferences: {
        Row: {
          email_type: Database["public"]["Enums"]["email_type"];
          id: string;
          is_opted_in: boolean;
          user_id: string;
        };
        Insert: {
          email_type: Database["public"]["Enums"]["email_type"];
          id?: string;
          is_opted_in?: boolean;
          user_id: string;
        };
        Update: {
          email_type?: Database["public"]["Enums"]["email_type"];
          id?: string;
          is_opted_in?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      loyalty_points: {
        Row: {
          created_at: string;
          id: string;
          points: number;
          reference_id: string | null;
          type: Database["public"]["Enums"]["loyalty_event"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          points: number;
          reference_id?: string | null;
          type: Database["public"]["Enums"]["loyalty_event"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          points?: number;
          reference_id?: string | null;
          type?: Database["public"]["Enums"]["loyalty_event"];
          user_id?: string;
        };
        Relationships: [];
      };
      order_events: {
        Row: {
          created_at: string;
          id: string;
          note: string | null;
          order_id: string;
          status: Database["public"]["Enums"]["order_status"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          note?: string | null;
          order_id: string;
          status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          created_at?: string;
          id?: string;
          note?: string | null;
          order_id?: string;
          status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          quantity: number;
          total: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          quantity: number;
          total: number;
          unit_price: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          quantity?: number;
          total?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          billing_address: Json;
          created_at: string;
          discount: number;
          erp_order_id: string | null;
          id: string;
          order_number: string;
          shipping_address: Json;
          shipping_cost: number;
          status: Database["public"]["Enums"]["order_status"];
          stripe_payment_intent_id: string | null;
          subtotal: number;
          total: number;
          user_id: string | null;
        };
        Insert: {
          billing_address: Json;
          created_at?: string;
          discount?: number;
          erp_order_id?: string | null;
          id?: string;
          order_number: string;
          shipping_address: Json;
          shipping_cost?: number;
          status?: Database["public"]["Enums"]["order_status"];
          stripe_payment_intent_id?: string | null;
          subtotal: number;
          total: number;
          user_id?: string | null;
        };
        Update: {
          billing_address?: Json;
          created_at?: string;
          discount?: number;
          erp_order_id?: string | null;
          id?: string;
          order_number?: string;
          shipping_address?: Json;
          shipping_cost?: number;
          status?: Database["public"]["Enums"]["order_status"];
          stripe_payment_intent_id?: string | null;
          subtotal?: number;
          total?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };
      price_alerts: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          is_active: boolean;
          product_id: string;
          target_price: number;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          is_active?: boolean;
          product_id: string;
          target_price: number;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          is_active?: boolean;
          product_id?: string;
          target_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "price_alerts_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      price_negotiations: {
        Row: {
          counter_price: number | null;
          coupon_code: string | null;
          created_at: string;
          id: string;
          offered_price: number;
          product_id: string;
          status: Database["public"]["Enums"]["negotiation_status"];
          user_id: string | null;
        };
        Insert: {
          counter_price?: number | null;
          coupon_code?: string | null;
          created_at?: string;
          id?: string;
          offered_price: number;
          product_id: string;
          status?: Database["public"]["Enums"]["negotiation_status"];
          user_id?: string | null;
        };
        Update: {
          counter_price?: number | null;
          coupon_code?: string | null;
          created_at?: string;
          id?: string;
          offered_price?: number;
          product_id?: string;
          status?: Database["public"]["Enums"]["negotiation_status"];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "price_negotiations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_compatibility: {
        Row: {
          bike_id: string;
          id: string;
          product_id: string;
        };
        Insert: {
          bike_id: string;
          id?: string;
          product_id: string;
        };
        Update: {
          bike_id?: string;
          id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_compatibility_bike_id_fkey";
            columns: ["bike_id"];
            isOneToOne: false;
            referencedRelation: "bikes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_compatibility_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_embeddings: {
        Row: {
          created_at: string;
          embedding: string;
          id: string;
          product_id: string;
        };
        Insert: {
          created_at?: string;
          embedding: string;
          id?: string;
          product_id: string;
        };
        Update: {
          created_at?: string;
          embedding?: string;
          id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_embeddings_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_translations: {
        Row: {
          description: string | null;
          id: string;
          locale: string;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          product_id: string;
          status: Database["public"]["Enums"]["product_status"];
        };
        Insert: {
          description?: string | null;
          id?: string;
          locale: string;
          meta_description?: string | null;
          meta_title?: string | null;
          name: string;
          product_id: string;
          status?: Database["public"]["Enums"]["product_status"];
        };
        Update: {
          description?: string | null;
          id?: string;
          locale?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          name?: string;
          product_id?: string;
          status?: Database["public"]["Enums"]["product_status"];
        };
        Relationships: [
          {
            foreignKeyName: "product_translations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          average_rating: number | null;
          brand_id: string | null;
          category_id: string | null;
          ce_level: Database["public"]["Enums"]["ce_level"] | null;
          certification: string | null;
          colors: string[];
          compare_at_price: number | null;
          cost_price: number | null;
          created_at: string;
          description: string | null;
          ean: string | null;
          erp_id: string | null;
          id: string;
          images: Json;
          is_featured: boolean;
          name: string;
          price: number;
          review_count: number;
          rider_type: Database["public"]["Enums"]["rider_type"] | null;
          sizes: string[];
          sku: string | null;
          slug: string;
          specs: Json;
          status: Database["public"]["Enums"]["product_status"];
          stock: number;
          tags: string[];
          updated_at: string;
          view_count: number;
          weight: number | null;
        };
        Insert: {
          average_rating?: number | null;
          brand_id?: string | null;
          category_id?: string | null;
          ce_level?: Database["public"]["Enums"]["ce_level"] | null;
          certification?: string | null;
          colors?: string[];
          compare_at_price?: number | null;
          cost_price?: number | null;
          created_at?: string;
          description?: string | null;
          ean?: string | null;
          erp_id?: string | null;
          id?: string;
          images?: Json;
          is_featured?: boolean;
          name: string;
          price: number;
          review_count?: number;
          rider_type?: Database["public"]["Enums"]["rider_type"] | null;
          sizes?: string[];
          sku?: string | null;
          slug: string;
          specs?: Json;
          status?: Database["public"]["Enums"]["product_status"];
          stock?: number;
          tags?: string[];
          updated_at?: string;
          view_count?: number;
          weight?: number | null;
        };
        Update: {
          average_rating?: number | null;
          brand_id?: string | null;
          category_id?: string | null;
          ce_level?: Database["public"]["Enums"]["ce_level"] | null;
          certification?: string | null;
          colors?: string[];
          compare_at_price?: number | null;
          cost_price?: number | null;
          created_at?: string;
          description?: string | null;
          ean?: string | null;
          erp_id?: string | null;
          id?: string;
          images?: Json;
          is_featured?: boolean;
          name?: string;
          price?: number;
          review_count?: number;
          rider_type?: Database["public"]["Enums"]["rider_type"] | null;
          sizes?: string[];
          sku?: string | null;
          slug?: string;
          specs?: Json;
          status?: Database["public"]["Enums"]["product_status"];
          stock?: number;
          tags?: string[];
          updated_at?: string;
          view_count?: number;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          product_id: string;
          user_id: string | null;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          product_id: string;
          user_id?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          product_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "questions_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      referral_codes: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          created_at: string;
          id: string;
          order_id: string | null;
          referee_id: string;
          referrer_id: string;
          status: Database["public"]["Enums"]["referral_status"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_id?: string | null;
          referee_id: string;
          referrer_id: string;
          status?: Database["public"]["Enums"]["referral_status"];
        };
        Update: {
          created_at?: string;
          id?: string;
          order_id?: string | null;
          referee_id?: string;
          referrer_id?: string;
          status?: Database["public"]["Enums"]["referral_status"];
        };
        Relationships: [
          {
            foreignKeyName: "referrals_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      review_votes: {
        Row: {
          id: string;
          is_helpful: boolean;
          review_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          is_helpful: boolean;
          review_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          is_helpful?: boolean;
          review_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          bike_make: string | null;
          bike_model: string | null;
          body: string;
          created_at: string;
          id: string;
          is_verified: boolean;
          product_id: string;
          rating: number;
          rider_height: number | null;
          rider_weight: number | null;
          riding_experience:
            | Database["public"]["Enums"]["experience_level"]
            | null;
          status: Database["public"]["Enums"]["review_status"];
          title: string | null;
          user_id: string | null;
        };
        Insert: {
          bike_make?: string | null;
          bike_model?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          is_verified?: boolean;
          product_id: string;
          rating: number;
          rider_height?: number | null;
          rider_weight?: number | null;
          riding_experience?:
            | Database["public"]["Enums"]["experience_level"]
            | null;
          status?: Database["public"]["Enums"]["review_status"];
          title?: string | null;
          user_id?: string | null;
        };
        Update: {
          bike_make?: string | null;
          bike_model?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          is_verified?: boolean;
          product_id?: string;
          rating?: number;
          rider_height?: number | null;
          rider_weight?: number | null;
          riding_experience?:
            | Database["public"]["Enums"]["experience_level"]
            | null;
          status?: Database["public"]["Enums"]["review_status"];
          title?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      user_behavior: {
        Row: {
          created_at: string;
          event_type: Database["public"]["Enums"]["behavior_event"];
          id: string;
          product_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: Database["public"]["Enums"]["behavior_event"];
          id?: string;
          product_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: Database["public"]["Enums"]["behavior_event"];
          id?: string;
          product_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_behavior_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      user_bikes: {
        Row: {
          bike_id: string;
          created_at: string;
          id: string;
          is_primary: boolean;
          user_id: string;
        };
        Insert: {
          bike_id: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          user_id: string;
        };
        Update: {
          bike_id?: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_bikes_bike_id_fkey";
            columns: ["bike_id"];
            isOneToOne: false;
            referencedRelation: "bikes";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          created_at: string;
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null;
          first_name: string | null;
          height_cm: number | null;
          id: string;
          last_name: string | null;
          phone: string | null;
          rfm_segment: Database["public"]["Enums"]["rfm_segment"] | null;
          rider_type: Database["public"]["Enums"]["rider_type"] | null;
          role: string;
          updated_at: string;
          weight_kg: number | null;
        };
        Insert: {
          created_at?: string;
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null;
          first_name?: string | null;
          height_cm?: number | null;
          id: string;
          last_name?: string | null;
          phone?: string | null;
          rfm_segment?: Database["public"]["Enums"]["rfm_segment"] | null;
          rider_type?: Database["public"]["Enums"]["rider_type"] | null;
          role?: string;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Update: {
          created_at?: string;
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null;
          first_name?: string | null;
          height_cm?: number | null;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          rfm_segment?: Database["public"]["Enums"]["rfm_segment"] | null;
          rider_type?: Database["public"]["Enums"]["rider_type"] | null;
          role?: string;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      wishlists: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
    };
    Enums: {
      automation_status: "pending" | "processing" | "done" | "failed";
      automation_type:
        | "welcome_email"
        | "order_confirmation"
        | "abandoned_cart"
        | "price_alert"
        | "review_request"
        | "loyalty_reward"
        | "erp_sync"
        | "price_negotiation_response";
      behavior_event:
        | "view"
        | "add_to_cart"
        | "remove_from_cart"
        | "wishlist"
        | "purchase"
        | "review"
        | "search";
      ce_level: "CE1" | "CE2";
      email_type:
        | "marketing"
        | "order_updates"
        | "price_alerts"
        | "review_requests"
        | "loyalty_updates"
        | "newsletters";
      experience_level: "beginner" | "intermediate" | "expert";
      loyalty_event:
        | "purchase"
        | "referral"
        | "review"
        | "signup"
        | "redemption"
        | "adjustment";
      negotiation_status:
        | "pending"
        | "countered"
        | "accepted"
        | "rejected"
        | "expired";
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded";
      product_status: "draft" | "active" | "archived";
      referral_status: "pending" | "qualified" | "rewarded" | "rejected";
      review_status: "pending" | "approved" | "rejected";
      rfm_segment: "champion" | "loyal" | "at_risk" | "new" | "hibernating";
      rider_type: "beginner" | "intermediate" | "advanced" | "professional";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      automation_status: ["pending", "processing", "done", "failed"],
      automation_type: [
        "welcome_email",
        "order_confirmation",
        "abandoned_cart",
        "price_alert",
        "review_request",
        "loyalty_reward",
        "erp_sync",
        "price_negotiation_response",
      ],
      behavior_event: [
        "view",
        "add_to_cart",
        "remove_from_cart",
        "wishlist",
        "purchase",
        "review",
        "search",
      ],
      ce_level: ["CE1", "CE2"],
      email_type: [
        "marketing",
        "order_updates",
        "price_alerts",
        "review_requests",
        "loyalty_updates",
        "newsletters",
      ],
      experience_level: ["beginner", "intermediate", "expert"],
      loyalty_event: [
        "purchase",
        "referral",
        "review",
        "signup",
        "redemption",
        "adjustment",
      ],
      negotiation_status: [
        "pending",
        "countered",
        "accepted",
        "rejected",
        "expired",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      product_status: ["draft", "active", "archived"],
      referral_status: ["pending", "qualified", "rewarded", "rejected"],
      review_status: ["pending", "approved", "rejected"],
      rfm_segment: ["champion", "loyal", "at_risk", "new", "hibernating"],
      rider_type: ["beginner", "intermediate", "advanced", "professional"],
    },
  },
} as const;
