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
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dashboards: {
        Row: {
          id: string
          name: string
          description: string
          owner_id: string
          is_default: boolean
          widgets: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          owner_id: string
          is_default?: boolean
          widgets?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          owner_id?: string
          is_default?: boolean
          widgets?: Json
          created_at?: string
          updated_at?: string
        }
      }
      dashboard_collaborators: {
        Row: {
          id: string
          dashboard_id: string
          user_id: string
          role: 'viewer' | 'editor' | 'admin'
          invited_by: string
          created_at: string
        }
        Insert: {
          id?: string
          dashboard_id: string
          user_id: string
          role?: 'viewer' | 'editor' | 'admin'
          invited_by: string
          created_at?: string
        }
        Update: {
          id?: string
          dashboard_id?: string
          user_id?: string
          role?: 'viewer' | 'editor' | 'admin'
          invited_by?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          title: string
          owner_id: string
          is_collaborative: boolean
          dashboard_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          owner_id: string
          is_collaborative?: boolean
          dashboard_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          owner_id?: string
          is_collaborative?: boolean
          dashboard_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string | null
          role: 'user' | 'assistant'
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id?: string | null
          role: 'user' | 'assistant'
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string | null
          role?: 'user' | 'assistant'
          content?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          is_online: boolean
          last_seen_at: string
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          is_online?: boolean
          last_seen_at?: string
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          is_online?: boolean
          last_seen_at?: string
          joined_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      collaborator_role: 'viewer' | 'editor' | 'admin'
      message_role: 'user' | 'assistant'
    }
  }
}

// Types utilitaires
export type User = Database['public']['Tables']['users']['Row']
export type Dashboard = Database['public']['Tables']['dashboards']['Row']
export type DashboardCollaborator = Database['public']['Tables']['dashboard_collaborators']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row']

