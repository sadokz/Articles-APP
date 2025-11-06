import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getCategories, getSousCategories, createCategory, updateCategory, deleteCategory, createSousCategorie, updateSousCategorie, deleteSousCategorie } from '../api';
import { Categorie, SousCategorie } from '../types/Article';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Folder, FolderOpen } from 'lucide-react';

interface CategoryManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated: () => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  isOpen,
  onClose,
  onCategoriesUpdated
}) => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [sousCategories, setSousCategories] = useState<SousCategorie[]>([]);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingSousCategory, setIsEditingSousCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categorie | null>(null);
  const [editingSousCategory, setEditingSousCategory] = useState<SousCategorie | null>(null);

  const [categoryForm, setCategoryForm] = useState({ nom: '', description: '' });
  const [sousCategoryForm, setSousCategoryForm] = useState({
    nom: '',
    description: '',
    categorie: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && token) {
      loadData();
    }
  }, [isOpen, token]);

  const loadData = async () => {
    if (!token) return;

    try {
      const [categoriesData, sousCategoriesData] = await Promise.all([
        getCategories(token),
        getSousCategories(token)
      ]);
      setCategories(categoriesData);
      setSousCategories(sousCategoriesData);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ nom: '', description: '' });
    setIsEditingCategory(true);
  };

  const handleEditCategory = (category: Categorie) => {
    setEditingCategory(category);
    setCategoryForm({ nom: category.nom, description: category.description });
    setIsEditingCategory(true);
  };

  const handleSaveCategory = async () => {
    if (!token) return;

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id!, categoryForm.nom, categoryForm.description, token);
        toast({
          title: "Catégorie modifiée",
          description: "La catégorie a été modifiée avec succès",
        });
      } else {
        await createCategory(categoryForm.nom, categoryForm.description, token);
        toast({
          title: "Catégorie ajoutée",
          description: "La catégorie a été ajoutée avec succès",
        });
      }
      setIsEditingCategory(false);
      await loadData();
      onCategoriesUpdated();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la catégorie",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (category: Categorie) => {
    if (!token || !category.id) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.nom}" ?`)) {
      try {
        await deleteCategory(category.id, token);
        toast({
          title: "Catégorie supprimée",
          description: "La catégorie a été supprimée avec succès",
        });
        await loadData();
        onCategoriesUpdated();
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la catégorie",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddSousCategory = () => {
    setEditingSousCategory(null);
    setSousCategoryForm({ nom: '', description: '', categorie: '' });
    setIsEditingSousCategory(true);
  };

  const handleEditSousCategory = (sousCategory: SousCategorie) => {
    setEditingSousCategory(sousCategory);
    setSousCategoryForm({
      nom: sousCategory.nom,
      description: sousCategory.description,
      categorie: sousCategory.categorie
    });
    setIsEditingSousCategory(true);
  };

  const handleSaveSousCategory = async () => {
    if (!token) return;

    try {
      if (editingSousCategory) {
        await updateSousCategorie(editingSousCategory.id!, sousCategoryForm.nom, sousCategoryForm.categorie, sousCategoryForm.description, token);
        toast({
          title: "Sous-catégorie modifiée",
          description: "La sous-catégorie a été modifiée avec succès",
        });
      } else {
        await createSousCategorie(sousCategoryForm.nom, sousCategoryForm.categorie, sousCategoryForm.description, token);
        toast({
          title: "Sous-catégorie ajoutée",
          description: "La sous-catégorie a été ajoutée avec succès",
        });
      }
      setIsEditingSousCategory(false);
      await loadData();
      onCategoriesUpdated();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la sous-catégorie",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSousCategory = async (sousCategory: SousCategorie) => {
    if (!token || !sousCategory.id) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la sous-catégorie "${sousCategory.nom}" ?`)) {
      try {
        await deleteSousCategorie(sousCategory.id, token);
        toast({
          title: "Sous-catégorie supprimée",
          description: "La sous-catégorie a été supprimée avec succès",
        });
        await loadData();
        onCategoriesUpdated();
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la sous-catégorie",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion des Catégories et Sous-catégories</DialogTitle>
          <DialogDescription>
            Gérez les catégories et sous-catégories de vos articles
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section Catégories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Catégories
              </CardTitle>
              <CardDescription>
                Gérez les catégories principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={handleAddCategory} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une catégorie
                </Button>

                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{category.nom}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {category.description}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Sous-catégories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Sous-catégories
              </CardTitle>
              <CardDescription>
                Gérez les sous-catégories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={handleAddSousCategory} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une sous-catégorie
                </Button>

                <div className="space-y-2">
                  {sousCategories.map((sousCategory) => (
                    <div key={sousCategory.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{sousCategory.nom}</h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {sousCategory.categorie}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {sousCategory.description}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSousCategory(sousCategory)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSousCategory(sousCategory)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal pour éditer une catégorie */}
        <Dialog open={isEditingCategory} onOpenChange={setIsEditingCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category-name">Nom</Label>
                <Input
                  id="category-name"
                  value={categoryForm.nom}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nom: e.target.value })}
                  placeholder="Nom de la catégorie"
                />
              </div>
              <div>
                <Label htmlFor="category-description">Description</Label>
                <Textarea
                  id="category-description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Description de la catégorie"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingCategory(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveCategory}>
                {editingCategory ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal pour éditer une sous-catégorie */}
        <Dialog open={isEditingSousCategory} onOpenChange={setIsEditingSousCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSousCategory ? 'Modifier la sous-catégorie' : 'Ajouter une sous-catégorie'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sous-category-name">Nom</Label>
                <Input
                  id="sous-category-name"
                  value={sousCategoryForm.nom}
                  onChange={(e) => setSousCategoryForm({ ...sousCategoryForm, nom: e.target.value })}
                  placeholder="Nom de la sous-catégorie"
                />
              </div>
              <div>
                <Label htmlFor="sous-category-category">Catégorie parente</Label>
                <Select
                  value={sousCategoryForm.categorie}
                  onValueChange={(value) => setSousCategoryForm({ ...sousCategoryForm, categorie: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.nom}>
                        {cat.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sous-category-description">Description</Label>
                <Textarea
                  id="sous-category-description"
                  value={sousCategoryForm.description}
                  onChange={(e) => setSousCategoryForm({ ...sousCategoryForm, description: e.target.value })}
                  placeholder="Description de la sous-catégorie"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingSousCategory(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveSousCategory}>
                {editingSousCategory ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
