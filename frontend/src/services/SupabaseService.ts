
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Article, Categorie, SousCategorie } from '../types/Article';
import { ExtendedUser } from '../types/User';

// Types pour Supabase
interface SupabaseArticle {
  id?: number;
  titre: string;
  prix: number;
  unite: string;
  description: string;
  categorie: string;
  sous_categorie: string;
  dernier_modifie_par: string;
  date_modification: string;
  ordre?: number;
  tags?: string;
  date_rappel?: string;
  pieces_jointes?: string;
}

interface ModificationHistory {
  id: number;
  table_name: string;
  record_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  modified_by: string;
  modified_at: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
}

interface NotificationReminder {
  id?: number;
  article_id: number;
  reminder_date: string;
  message: string;
  is_sent: boolean;
  user_id: string;
  created_at: string;
}

class SupabaseServiceClass {
  private supabase: SupabaseClient | null = null;
  private currentUser: User | null = null;
  private realtimeChannel: any = null;

  async initialize() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL et clé manquantes dans les variables d\'environnement');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Vérifier l'utilisateur connecté
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUser = user;

    if (user) {
      this.setupRealtimeSubscription();
    }
  }

  private setupRealtimeSubscription() {
    if (!this.supabase) return;

    this.realtimeChannel = this.supabase
      .channel('article-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'articles' },
        (payload) => {
          console.log('Article change detected:', payload);
          this.notifyArticleChange(payload);
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          console.log('Category change detected:', payload);
          this.notifyCategoryChange(payload);
        }
      )
      .subscribe();
  }

  private notifyArticleChange(payload: any) {
    window.dispatchEvent(new CustomEvent('supabase-article-change', { detail: payload }));
  }

  private notifyCategoryChange(payload: any) {
    window.dispatchEvent(new CustomEvent('supabase-category-change', { detail: payload }));
  }

  // Authentication avec Supabase Auth
  async signUp(email: string, password: string, userData: Partial<ExtendedUser>) {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nom_complet: userData.nom_complet,
          nom: userData.nom,
          prenom: userData.prenom,
          telephone: userData.telephone,
          niveau_acces: userData.niveau_acces || 'lecture_modification'
        }
      }
    });

    if (error) throw error;
    return data.user;
  }

  async signIn(email: string, password: string): Promise<ExtendedUser | null> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    
    this.currentUser = data.user;
    this.setupRealtimeSubscription();

    // Récupérer les données utilisateur complètes
    const { data: userData, error: userError } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (userError) {
      // Créer un profil si il n'existe pas
      const profileData = {
        user_id: data.user.id,
        username: data.user.email,
        nom_complet: data.user.user_metadata?.nom_complet || data.user.email,
        nom: data.user.user_metadata?.nom || '',
        prenom: data.user.user_metadata?.prenom || '',
        email: data.user.email,
        telephone: data.user.user_metadata?.telephone || '',
        niveau_acces: data.user.user_metadata?.niveau_acces || 'lecture_modification'
      };

      await this.supabase.from('user_profiles').insert(profileData);
      
      return {
        id: 0,
        username: profileData.username,
        nom_complet: profileData.nom_complet,
        ...profileData
      };
    }

    return {
      id: userData.id,
      username: userData.username,
      nom_complet: userData.nom_complet,
      nom: userData.nom,
      prenom: userData.prenom,
      email: userData.email,
      telephone: userData.telephone,
      niveau_acces: userData.niveau_acces
    };
  }

  async signOut() {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    
    this.currentUser = null;
  }

  async getCurrentUser(): Promise<ExtendedUser | null> {
    if (!this.supabase) return null;

    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!userData) return null;

    return {
      id: userData.id,
      username: userData.username,
      nom_complet: userData.nom_complet,
      nom: userData.nom,
      prenom: userData.prenom,
      email: userData.email,
      telephone: userData.telephone,
      niveau_acces: userData.niveau_acces
    };
  }

  // Articles avec historique automatique
  async getArticles(): Promise<Article[]> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .order('ordre', { ascending: true })
      .order('id', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : [],
      pieces_jointes: item.pieces_jointes ? JSON.parse(item.pieces_jointes) : []
    }));
  }

  async addArticle(article: Omit<Article, 'id'>): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const articleData: SupabaseArticle = {
      ...article,
      tags: article.tags ? JSON.stringify(article.tags) : null,
      pieces_jointes: article.pieces_jointes ? JSON.stringify(article.pieces_jointes) : null
    };

    const { data, error } = await this.supabase
      .from('articles')
      .insert(articleData)
      .select()
      .single();

    if (error) throw error;

    // Enregistrer dans l'historique
    await this.addToHistory('articles', data.id, 'CREATE', 'Création de l\'article');
  }

  async updateArticle(article: Article): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    // Récupérer l'ancien article pour l'historique
    const { data: oldData } = await this.supabase
      .from('articles')
      .select('*')
      .eq('id', article.id)
      .single();

    const articleData: SupabaseArticle = {
      ...article,
      tags: article.tags ? JSON.stringify(article.tags) : null,
      pieces_jointes: article.pieces_jointes ? JSON.stringify(article.pieces_jointes) : null
    };

    const { error } = await this.supabase
      .from('articles')
      .update(articleData)
      .eq('id', article.id);

    if (error) throw error;

    // Comparer et enregistrer les changements
    if (oldData) {
      await this.recordFieldChanges('articles', article.id!, oldData, articleData);
    }
  }

  async deleteArticle(id: number): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { error } = await this.supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.addToHistory('articles', id, 'DELETE', 'Suppression de l\'article');
  }

  // Catégories
  async getCategories(): Promise<Categorie[]> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('nom');

    if (error) throw error;
    return data;
  }

  async addCategory(category: Omit<Categorie, 'id'>): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { data, error } = await this.supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;

    await this.addToHistory('categories', data.id, 'CREATE', 'Création de la catégorie');
  }

  async updateCategory(category: Categorie): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { error } = await this.supabase
      .from('categories')
      .update(category)
      .eq('id', category.id);

    if (error) throw error;

    await this.addToHistory('categories', category.id!, 'UPDATE', 'Modification de la catégorie');
  }

  async deleteCategory(id: number): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.addToHistory('categories', id, 'DELETE', 'Suppression de la catégorie');
  }

  // Sous-catégories
  async getSousCategories(categorie?: string): Promise<SousCategorie[]> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    let query = this.supabase
      .from('sous_categories')
      .select('*')
      .order('nom');

    if (categorie) {
      query = query.eq('categorie', categorie);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async addSousCategory(sousCategory: Omit<SousCategorie, 'id'>): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { data, error } = await this.supabase
      .from('sous_categories')
      .insert(sousCategory)
      .select()
      .single();

    if (error) throw error;

    await this.addToHistory('sous_categories', data.id, 'CREATE', 'Création de la sous-catégorie');
  }

  async updateSousCategory(sousCategory: SousCategorie): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { error } = await this.supabase
      .from('sous_categories')
      .update(sousCategory)
      .eq('id', sousCategory.id);

    if (error) throw error;

    await this.addToHistory('sous_categories', sousCategory.id!, 'UPDATE', 'Modification de la sous-catégorie');
  }

  async deleteSousCategory(id: number): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { error } = await this.supabase
      .from('sous_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.addToHistory('sous_categories', id, 'DELETE', 'Suppression de la sous-catégorie');
  }

  // Gestion des utilisateurs
  async getUsers(): Promise<ExtendedUser[]> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .order('username');

    if (error) throw error;
    return data;
  }

  async updateUser(user: ExtendedUser): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { error } = await this.supabase
      .from('user_profiles')
      .update({
        username: user.username,
        nom_complet: user.nom_complet,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        niveau_acces: user.niveau_acces
      })
      .eq('id', user.id);

    if (error) throw error;
  }

  async deleteUser(id: number): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { error } = await this.supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Historique des modifications
  private async addToHistory(table: string, recordId: number, action: 'CREATE' | 'UPDATE' | 'DELETE', description: string) {
    if (!this.supabase || !this.currentUser) return;

    const { error } = await this.supabase
      .from('modification_history')
      .insert({
        table_name: table,
        record_id: recordId,
        field_name: 'general',
        old_value: null,
        new_value: description,
        modified_by: this.currentUser.email,
        modified_at: new Date().toISOString(),
        action
      });

    if (error) console.error('Erreur historique:', error);
  }

  private async recordFieldChanges(table: string, recordId: number, oldData: any, newData: any) {
    if (!this.supabase || !this.currentUser) return;

    const changes = [];
    
    for (const [key, newValue] of Object.entries(newData)) {
      const oldValue = oldData[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          table_name: table,
          record_id: recordId,
          field_name: key,
          old_value: oldValue ? JSON.stringify(oldValue) : null,
          new_value: newValue ? JSON.stringify(newValue) : null,
          modified_by: this.currentUser.email,
          modified_at: new Date().toISOString(),
          action: 'UPDATE' as const
        });
      }
    }

    if (changes.length > 0) {
      const { error } = await this.supabase
        .from('modification_history')
        .insert(changes);

      if (error) console.error('Erreur enregistrement changements:', error);
    }
  }

  async getModificationHistory(table?: string, recordId?: number): Promise<ModificationHistory[]> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    let query = this.supabase
      .from('modification_history')
      .select('*')
      .order('modified_at', { ascending: false });

    if (table) query = query.eq('table_name', table);
    if (recordId) query = query.eq('record_id', recordId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Stockage de fichiers
  async uploadFile(file: File, folder: string = 'attachments'): Promise<string> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from('article-files')
      .upload(filePath, file);

    if (error) throw error;

    const { data: urlData } = this.supabase.storage
      .from('article-files')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { error } = await this.supabase.storage
      .from('article-files')
      .remove([filePath]);

    if (error) throw error;
  }

  // Notifications et rappels
  async addReminder(articleId: number, reminderDate: string, message: string): Promise<void> {
    if (!this.supabase || !this.currentUser) throw new Error('Supabase non initialisé');

    const { error } = await this.supabase
      .from('notification_reminders')
      .insert({
        article_id: articleId,
        reminder_date: reminderDate,
        message,
        is_sent: false,
        user_id: this.currentUser.id,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async getActiveReminders(): Promise<NotificationReminder[]> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { data, error } = await this.supabase
      .from('notification_reminders')
      .select('*')
      .lte('reminder_date', new Date().toISOString())
      .eq('is_sent', false);

    if (error) throw error;
    return data;
  }

  async markReminderAsSent(id: number): Promise<void> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const { error } = await this.supabase
      .from('notification_reminders')
      .update({ is_sent: true })
      .eq('id', id);

    if (error) throw error;
  }

  // Export complet avec données temps réel
  async exportAllData(): Promise<any> {
    if (!this.supabase) throw new Error('Supabase non initialisé');

    const [articles, categories, sousCategories, history] = await Promise.all([
      this.getArticles(),
      this.getCategories(),
      this.getSousCategories(),
      this.getModificationHistory()
    ]);

    return {
      articles,
      categories,
      sousCategories,
      history,
      exportDate: new Date().toISOString(),
      exportedBy: this.currentUser?.email || 'unknown'
    };
  }

  // Nettoyage
  cleanup() {
    if (this.realtimeChannel && this.supabase) {
      this.supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }
}

export const SupabaseService = new SupabaseServiceClass();
