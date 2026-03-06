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
      forms: {
        Row: {
          id: string
          owner_id: string
          form_type: 'agency' | 'customer'
          title: string
          description: string
          website_url: string | null
          business_context: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          form_type: 'agency' | 'customer'
          title: string
          description?: string
          website_url?: string | null
          business_context?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          form_type?: 'agency' | 'customer'
          title?: string
          description?: string
          website_url?: string | null
          business_context?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          form_id: string
          question_text: string
          question_type: 'text' | 'textarea' | 'select' | 'multiselect' | 'file' | 'email' | 'phone' | 'number'
          options: Json | null
          is_required: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          form_id: string
          question_text: string
          question_type: 'text' | 'textarea' | 'select' | 'multiselect' | 'file' | 'email' | 'phone' | 'number'
          options?: Json | null
          is_required?: boolean
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          question_text?: string
          question_type?: 'text' | 'textarea' | 'select' | 'multiselect' | 'file' | 'email' | 'phone' | 'number'
          options?: Json | null
          is_required?: boolean
          order_index?: number
          created_at?: string
        }
      }
      responses: {
        Row: {
          id: string
          form_id: string
          submitted_at: string
          respondent_email: string | null
        }
        Insert: {
          id?: string
          form_id: string
          submitted_at?: string
          respondent_email?: string | null
        }
        Update: {
          id?: string
          form_id?: string
          submitted_at?: string
          respondent_email?: string | null
        }
      }
      answers: {
        Row: {
          id: string
          response_id: string
          question_id: string
          answer_text: string
          created_at: string
        }
        Insert: {
          id?: string
          response_id: string
          question_id: string
          answer_text: string
          created_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          question_id?: string
          answer_text?: string
          created_at?: string
        }
      }
    }
  }
}
