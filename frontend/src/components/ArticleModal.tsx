
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Article, Categorie, SousCategorie } from '../types/Article';
import { FileAttachments } from './FileAttachments';
import { NotificationManager } from './NotificationManager';
import { ModificationHistory } from './ModificationHistory';
import { 
  Clock, 
  Paperclip, 
  History, 
  Bell,
  Tag,
  X
} from 'lucide-react';

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (article: Omit<Article, 'id'> | Article) => void;
  article: Article | null;
  categories: Categorie[];
  sousCategories: SousCategorie[];
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  article,
  categories,
  sousCategories
}) => {
  const [formData, setFormData] = useState<Partial<Article>>({
    titre: '',
    prix: 0,
    unite: '',
    description: '',
    categorie: '',
    sous_categorie: '',
    tags: [],
    date_rappel: '',
    pieces_jointes: []
  });

  const [filteredSousCategories, setFilteredSousCategories] = useState<SousCategorie[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (article) {
      setFormData({
        ...article,
        tags: article.tags || [],
        pieces_jointes: article.pieces_jointes || []
      });
    } else {
      setFormData({
        titre: '',
        prix: 0,
        unite: '',
        description: '',
        categorie: '',
        sous_categorie: '',
        tags: [],
        date_rappel: '',
        pieces_jointes: []
      });
    }
  }, [article, isOpen]);

  useEffect(() => {
    if (formData.categorie) {
      setFilteredSousCategories(
        sousCategories.filter(sc => 
          sc.nom && sc.nom.trim() !== '' && sc.categorie === formData.categorie
        )
      );
    } else {
      setFilteredSousCategories([]);
    }
  }, [formData.categorie, sousCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titre || !formData.prix || !formData.unite || !formData.categorie || !formData.sous_categorie) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    onSave({
      ...formData,
      titre: formData.titre!,
      prix: formData.prix!,
      unite: formData.unite!,
      description: formData.description || '',
      categorie: formData.categorie!,
      sous_categorie: formData.sous_categorie!,
      dernier_modifie_par: '',
      date_modification: '',
      tags: formData.tags || [],
      date_rappel: formData.date_rappel || '',
      pieces_jointes: formData.pieces_jointes || [],
      ...(article && { id: article.id })
    } as Article);
  };

  const handleInputChange = (field: keyof Article, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategorieChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      categorie: value,
      sous_categorie: '' // Reset sous-catégorie quand on change de catégorie
    }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags?.includes(currentTag.trim())) {
      const newTags = [...(formData.tags || []), currentTag.trim()];
      handleInputChange('tags', newTags);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = (formData.tags || []).filter(tag => tag !== tagToRemove);
    handleInputChange('tags', newTags);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Enhanced filtering - ensure nom exists, is not empty, and has valid content after trimming
  const validCategories = categories.filter(cat => 
    cat && 
    cat.nom && 
    typeof cat.nom === 'string' && 
    cat.nom.trim() !== '' && 
    cat.nom.trim().length > 0
  );

  // Enhanced filtering for subcategories with the same robust validation
  const validSousCategories = filteredSousCategories.filter(sc => 
    sc && 
    sc.nom && 
    typeof sc.nom === 'string' && 
    sc.nom.trim() !== '' && 
    sc.nom.trim().length > 0
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {article ? 'Modifier l\'article' : 'Nouvel article'}
              {article && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNotifications(true)}
                    className="flex items-center gap-1"
                  >
                    <Bell className="h-4 w-4" />
                    Rappels
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-1"
                  >
                    <History className="h-4 w-4" />
                    Historique
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Informations générales</TabsTrigger>
              <TabsTrigger value="attachments" className="flex items-center gap-1">
                <Paperclip className="h-4 w-4" />
                Pièces jointes
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Avancé
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="titre" className="text-sm font-medium">
                      Titre *
                    </Label>
                    <Input
                      id="titre"
                      value={formData.titre || ''}
                      onChange={(e) => handleInputChange('titre', e.target.value)}
                      placeholder="Nom de l'article"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="prix" className="text-sm font-medium">
                      Prix *
                    </Label>
                    <Input
                      id="prix"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.prix || ''}
                      onChange={(e) => handleInputChange('prix', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unite" className="text-sm font-medium">
                      Unité *
                    </Label>
                    <Input
                      id="unite"
                      value={formData.unite || ''}
                      onChange={(e) => handleInputChange('unite', e.target.value)}
                      placeholder="kg, unité, litre..."
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Description de l'article"
                    rows={3}
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categorie" className="text-sm font-medium">
                      Catégorie *
                    </Label>
                    <Select 
                      value={formData.categorie || ''} 
                      onValueChange={handleCategorieChange}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {validCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.nom.trim()}>
                            {cat.nom.trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="sous_categorie" className="text-sm font-medium">
                      Sous-catégorie *
                    </Label>
                    <Select 
                      value={formData.sous_categorie || ''} 
                      onValueChange={(value) => handleInputChange('sous_categorie', value)}
                      disabled={!formData.categorie}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner une sous-catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {validSousCategories.map((sc) => (
                          <SelectItem key={sc.id} value={sc.nom.trim()}>
                            {sc.nom.trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="mt-4">
                <FileAttachments
                  attachments={formData.pieces_jointes || []}
                  onAttachmentsChange={(attachments) => handleInputChange('pieces_jointes', attachments)}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                {/* Tags */}
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ajouter un tag"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddTag} variant="outline">
                        Ajouter
                      </Button>
                    </div>
                    
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 hover:bg-transparent"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Date de rappel */}
                <div>
                  <Label htmlFor="date_rappel" className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Date de rappel
                  </Label>
                  <Input
                    id="date_rappel"
                    type="datetime-local"
                    value={formData.date_rappel || ''}
                    onChange={(e) => handleInputChange('date_rappel', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optionnel : Définir une date pour recevoir un rappel concernant cet article
                  </p>
                </div>
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {article ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modales pour les fonctionnalités avancées */}
      {article && (
        <>
          <NotificationManager
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            articleId={article.id}
            articleTitle={article.titre}
          />
          
          <ModificationHistory
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            articleId={article.id}
            tableName="articles"
          />
        </>
      )}
    </>
  );
};
