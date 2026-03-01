export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface Database {
  public: {
    Tables: {
      designers: {
        Row: {
          id: string;
          designer_code: string;
          phone: string;
          full_name: string | null;
          email: string | null;
          business_name: string | null;
          business_type: string | null;
          company_id: string | null;
          business_address: string | null;
          city: string | null;
          design_type: string | null;
          specialization: string | null;
          experience_years: string | null;
          how_heard: string | null;
          date_of_birth: string | null;
          marketing_consent: boolean;
          commission_rate: number | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["designers"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["designers"]["Insert"]>;
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string | null;
          image_url: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["announcements"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
      };
      project_photos: {
        Row: {
          id: string;
          designer_code: string;
          image_url: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_photos"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["project_photos"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          designer_code: string;
          type: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };
  };
}

export type Designer = Database["public"]["Tables"]["designers"]["Row"];
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];
export type ProjectPhoto = Database["public"]["Tables"]["project_photos"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
