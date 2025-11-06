import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getCategories, getSousCategories } from '../api';
import { Categorie, SousCategorie } from '../types/Article';
import { useAuth } from '../contexts/AuthContext';
import { Info } from 'lucide-react';

interface CategoryDescriptionProps {
  selectedCategory: string;
  selectedSousCategory: string;
}

export const CategoryDescription: React.FC<CategoryDescriptionProps> = ({
  selectedCategory,
  selectedSousCategory
}) => {
  const { token } = useAuth();
  const [categoryInfo, setCategoryInfo] = useState<Categorie | null>(null);
  const [sousCategoryInfo, setSousCategoryInfo] = useState<SousCategorie | null>(null);

  useEffect(() => {
    if (token) {
      loadCategoryInfo();
    }
  }, [selectedCategory, selectedSousCategory, token]);

  const loadCategoryInfo = async () => {
    if (!token) return;

    try {
      if (selectedCategory && selectedCategory !== 'all') {
        const categories = await getCategories(token);
        const category = categories.find(cat => cat.nom === selectedCategory);
        setCategoryInfo(category || null);

        if (selectedSousCategory && selectedSousCategory !== 'all') {
          const sousCategories = await getSousCategories(token);
          const sousCategory = sousCategories.find(sc => sc.nom === selectedSousCategory);
          setSousCategoryInfo(sousCategory || null);
        } else {
          setSousCategoryInfo(null);
        }
      } else {
        setCategoryInfo(null);
        setSousCategoryInfo(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des informations de catégorie:', error);
    }
  };

  // Ne rien afficher si aucun filtre n'est sélectionné
  if (!categoryInfo && !sousCategoryInfo) {
    return null;
  }

  return (
    <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            {categoryInfo && (
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Catégorie : {categoryInfo.nom}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {categoryInfo.description}
                </p>
              </div>
            )}

            {sousCategoryInfo && (
              <div className="border-t border-blue-200 dark:border-blue-700 pt-2">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  Sous-catégorie : {sousCategoryInfo.nom}
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {sousCategoryInfo.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
