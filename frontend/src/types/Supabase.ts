
export interface Database {
  public: {
    Tables: {
      articles: {
        Row: {
          id: number;
          titre: string;
          prix: number;
          unite: string;
          description: string;
          categorie: string;
          sous_categorie: string;
          dernier_modifie_par: string;
          date_modification: string;
          ordre: number;
          tags: string | null;
          date_rappel: string | null;
          pieces_jointes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          titre: string;
          prix: number;
          unite: string;
          description: string;
          categorie: string;
          sous_categorie: string;
          dernier_modifie_par: string;
          date_modification: string;
          ordre?: number;
          tags?: string | null;
          date_rappel?: string | null;
          pieces_jointes?: string | null;
        };
        Update: {
          titre?: string;
          prix?: number;
          unite?: string;
          description?: string;
          categorie?: string;
          sous_categorie?: string;
          dernier_modifie_par?: string;
          date_modification?: string;
          ordre?: number;
          tags?: string | null;
          date_rappel?: string | null;
          pieces_jointes?: string | null;
        };
      };
      categories: {
        Row: {
          id: number;
          nom: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          nom: string;
          description: string;
        };
        Update: {
          nom?: string;
          description?: string;
        };
      };
      sous_categories: {
        Row: {
          id: number;
          nom: string;
          description: string;
          categorie: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          nom: string;
          description: string;
          categorie: string;
        };
        Update: {
          nom?: string;
          description?: string;
          categorie?: string;
        };
      };
      user_profiles: {
        Row: {
          id: number;
          user_id: string;
          username: string;
          nom_complet: string;
          nom: string | null;
          prenom: string | null;
          email: string | null;
          telephone: string | null;
          niveau_acces: 'lecture_seule' | 'lecture_modification' | 'inactif';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          username: string;
          nom_complet: string;
          nom?: string | null;
          prenom?: string | null;
          email?: string | null;
          telephone?: string | null;
          niveau_acces?: 'lecture_seule' | 'lecture_modification' | 'inactif';
        };
        Update: {
          username?: string;
          nom_complet?: string;
          nom?: string | null;
          prenom?: string | null;
          email?: string | null;
          telephone?: string | null;
          niveau_acces?: 'lecture_seule' | 'lecture_modification' | 'inactif';
        };
      };
      modification_history: {
        Row: {
          id: number;
          table_name: string;
          record_id: number;
          field_name: string;
          old_value: string | null;
          new_value: string | null;
          modified_by: string;
          modified_at: string;
          action: 'INSERT' | 'UPDATE' | 'DELETE';
          created_at: string;
        };
        Insert: {
          table_name: string;
          record_id: number;
          field_name: string;
          old_value?: string | null;
          new_value?: string | null;
          modified_by: string;
          modified_at: string;
          action: 'INSERT' | 'UPDATE' | 'DELETE';
        };
        Update: {
          table_name?: string;
          record_id?: number;
          field_name?: string;
          old_value?: string | null;
          new_value?: string | null;
          modified_by?: string;
          modified_at?: string;
          action?: 'INSERT' | 'UPDATE' | 'DELETE';
        };
      };
      notification_reminders: {
        Row: {
          id: number;
          article_id: number;
          reminder_date: string;
          message: string;
          is_sent: boolean;
          user_id: string;
          created_at: string;
        };
        Insert: {
          article_id: number;
          reminder_date: string;
          message: string;
          is_sent?: boolean;
          user_id: string;
        };
        Update: {
          article_id?: number;
          reminder_date?: string;
          message?: string;
          is_sent?: boolean;
          user_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export interface ModificationHistoryView {
  id: number;
  table_name: string;
  record_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  modified_by: string;
  modified_at: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  article_title?: string;
  category_name?: string;
}

export interface NotificationReminderView {
  id: number;
  article_id: number;
  article_title: string;
  reminder_date: string;
  message: string;
  is_sent: boolean;
  user_email: string;
  created_at: string;
}
