import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          organization_id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string | null
          email: string
          full_name: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id?: string | null
          email: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          email?: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          organization_id: string
          employee_id: string | null
          name: string
          email: string | null
          department_id: string | null
          manager_name: string | null
          title: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          employee_id?: string | null
          name: string
          email?: string | null
          department_id?: string | null
          manager_name?: string | null
          title?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          employee_id?: string | null
          name?: string
          email?: string | null
          department_id?: string | null
          manager_name?: string | null
          title?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          organization_id: string
          employee_id: string
          performance: string | null
          potential: string | null
          box_key: string | null
          note: string | null
          assessed_by: string | null
          assessed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          employee_id: string
          performance?: string | null
          potential?: string | null
          box_key?: string | null
          note?: string | null
          assessed_by?: string | null
          assessed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          employee_id?: string
          performance?: string | null
          potential?: string | null
          box_key?: string | null
          note?: string | null
          assessed_by?: string | null
          assessed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      box_definitions: {
        Row: {
          id: string
          organization_id: string | null
          key: string
          label: string
          description: string | null
          action_hint: string | null
          color: string
          grid_x: number
          grid_y: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          key: string
          label: string
          description?: string | null
          action_hint?: string | null
          color?: string
          grid_x: number
          grid_y: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          key?: string
          label?: string
          description?: string | null
          action_hint?: string | null
          color?: string
          grid_x?: number
          grid_y?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}