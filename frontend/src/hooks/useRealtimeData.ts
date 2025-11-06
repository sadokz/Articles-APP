
import { useState, useEffect, useCallback } from 'react';
import { SupabaseService } from '../services/SupabaseService';
import { Article, Categorie, SousCategorie } from '../types/Article';

interface RealtimeDataState {
  articles: Article[];
  categories: Categorie[];
  sousCategories: SousCategorie[];
  loading: boolean;
  error: string | null;
}

export const useRealtimeData = () => {
  const [state, setState] = useState<RealtimeDataState>({
    articles: [],
    categories: [],
    sousCategories: [],
    loading: true,
    error: null
  });

  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [articlesData, categoriesData, sousCategoriesData] = await Promise.all([
        SupabaseService.getArticles(),
        SupabaseService.getCategories(),
        SupabaseService.getSousCategories()
      ]);
      
      setState({
        articles: articlesData,
        categories: categoriesData,
        sousCategories: sousCategoriesData,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erreur lors du chargement des données'
      }));
    }
  }, []);

  const handleArticleChange = useCallback((event: any) => {
    console.log('Article change event:', event.detail);
    loadData(); // Recharger toutes les données pour la simplification
  }, [loadData]);

  const handleCategoryChange = useCallback((event: any) => {
    console.log('Category change event:', event.detail);
    loadData(); // Recharger toutes les données pour la simplification
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Écouter les événements de changement en temps réel
    window.addEventListener('supabase-article-change', handleArticleChange);
    window.addEventListener('supabase-category-change', handleCategoryChange);

    return () => {
      window.removeEventListener('supabase-article-change', handleArticleChange);
      window.removeEventListener('supabase-category-change', handleCategoryChange);
    };
  }, [handleArticleChange, handleCategoryChange]);

  return {
    ...state,
    refetch: loadData
  };
};
