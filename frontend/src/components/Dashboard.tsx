import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArticleModal } from './ArticleModal';
import { CategoryManagement } from './CategoryManagement';
import { CategoryDescription } from './CategoryDescription';
import { UserManagement } from './UserManagement';
import { TableView } from './TableView';
import { AdvancedSearch } from './AdvancedSearch';
import { StatisticsDashboard } from './StatisticsDashboard';
import { ExportModal } from './ExportModal';
import { Article, Categorie, SousCategorie, Statistiques, RechercheAvancee } from '../types/Article';
import { User } from '../types/User';
import { useAuth } from '../contexts/AuthContext';
import { getArticles, getCategories, getSousCategories, createArticle, updateArticle, deleteArticle } from '../api';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  LogOut,
  Edit,
  Trash2,
  Moon,
  Sun,
  Save,
  Settings,
  Users,
  FolderTree,
  Grid3X3,
  List,
  FileText,
  Calendar,
  Shield,
  Package
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const Dashboard: React.FC = () => {
  const { user, logout, hasPermission, hasRole, token } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [sousCategories, setSousCategories] = useState<SousCategorie[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState<string>('all');
  const [filterSousCategorie, setFilterSousCategorie] = useState<string>('all');
  const [rechercheAvancee, setRechercheAvancee] = useState<RechercheAvancee | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Mode d'affichage
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    return (localStorage.getItem('viewMode') as 'card' | 'table') || 'card';
  });

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Mode sombre
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Statistiques
  const [statistics, setStatistics] = useState<Statistiques>({
    totalArticles: 0,
    totalCategories: 0,
    totalSousCategories: 0,
    articlesModifiesCeMois: 0,
    utilisateurLePlusActif: ''
  });

  const { toast } = useToast();

  // Determine permissions based on role
  const canViewArticles = hasPermission('articles.read') || hasRole('viewer');
  const canModifyArticles = hasPermission('articles.update') || hasPermission('articles.create');
  const canDeleteArticles = hasPermission('articles.delete');
  const canManageCategories = hasPermission('categories.create') || hasPermission('categories.update');
  const canManageUsers = hasPermission('users.read') || hasRole('admin') || hasRole('super_admin');

  useEffect(() => {
    if (canViewArticles) {
      loadData();
    }
  }, [canViewArticles]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    filterArticles();
  }, [articles, searchTerm, filterCategorie, filterSousCategorie, rechercheAvancee]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    calculateStatistics();
  }, [articles, categories, sousCategories]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [articlesData, categoriesData, sousCategoriesData] = await Promise.all([
        getArticles(token || undefined),
        getCategories(token || undefined),
        getSousCategories(token || undefined)
      ]);

      setArticles(articlesData);
      setCategories(categoriesData);
      setSousCategories(sousCategoriesData);

      console.log('Loaded data from API:', {
        articles: articlesData.length,
        categories: categoriesData.length,
        sousCategories: sousCategoriesData.length
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de charger les données depuis le serveur. Vérifiez que le backend FastAPI est démarré sur http://localhost:8000",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = () => {
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

    const articlesModifiesCeMois = articles.filter(article =>
      article.date_modification && new Date(article.date_modification) >= debutMois
    ).length;

    // Compter les modifications par utilisateur
    const modifications = articles.reduce((acc, article) => {
      const user = article.dernier_modifie_par || 'Inconnu';
      acc[user] = (acc[user] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const utilisateurLePlusActif = Object.entries(modifications)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    setStatistics({
      totalArticles: articles.length,
      totalCategories: categories.length,
      totalSousCategories: sousCategories.length,
      articlesModifiesCeMois,
      utilisateurLePlusActif
    });
  };

  const filterArticles = () => {
    let filtered = articles;

    // Recherche simple
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtres catégories
    if (filterCategorie !== 'all') {
      filtered = filtered.filter(article => article.categorie === filterCategorie);
    }

    if (filterSousCategorie !== 'all') {
      filtered = filtered.filter(article => article.sous_categorie === filterSousCategorie);
    }

    // Recherche avancée
    if (rechercheAvancee) {
      if (rechercheAvancee.motCle) {
        filtered = filtered.filter(article =>
          article.titre.toLowerCase().includes(rechercheAvancee.motCle.toLowerCase()) ||
          (article.description || '').toLowerCase().includes(rechercheAvancee.motCle.toLowerCase())
        );
      }

      if (rechercheAvancee.prixMin !== null) {
        filtered = filtered.filter(article => article.prix >= rechercheAvancee.prixMin!);
      }

      if (rechercheAvancee.prixMax !== null) {
        filtered = filtered.filter(article => article.prix <= rechercheAvancee.prixMax!);
      }

      if (rechercheAvancee.utilisateur) {
        filtered = filtered.filter(article =>
          (article.dernier_modifie_par || '') === rechercheAvancee.utilisateur
        );
      }

      if (rechercheAvancee.dateDebut) {
        filtered = filtered.filter(article =>
          article.date_modification && new Date(article.date_modification) >= new Date(rechercheAvancee.dateDebut)
        );
      }

      if (rechercheAvancee.dateFin) {
        filtered = filtered.filter(article =>
          article.date_modification && new Date(article.date_modification) <= new Date(rechercheAvancee.dateFin)
        );
      }

      if (rechercheAvancee.tags.length > 0) {
        filtered = filtered.filter(article =>
          article.tags?.some(tag => rechercheAvancee.tags.includes(tag))
        );
      }
    }

    setFilteredArticles(filtered);
  };

  const handleAdvancedSearch = (criteria: RechercheAvancee) => {
    setRechercheAvancee(criteria);
    setSearchTerm('');
    setFilterCategorie('all');
    setFilterSousCategorie('all');
  };

  const handleResetSearch = () => {
    setRechercheAvancee(null);
    setSearchTerm('');
    setFilterCategorie('all');
    setFilterSousCategorie('all');
  };

  const getUtilisateursUniques = () => {
    return [...new Set(articles.map(article => article.dernier_modifie_par || 'Inconnu'))];
  };

  const getTagsUniques = () => {
    const allTags = articles.flatMap(article => article.tags || []);
    return [...new Set(allTags)];
  };

  const checkRappels = () => {
    const maintenant = new Date();
    const rappelsActifs = articles.filter(article => {
      if (!article.date_rappel) return false;
      return new Date(article.date_rappel) <= maintenant;
    });

    if (rappelsActifs.length > 0) {
      toast({
        title: `${rappelsActifs.length} rappel(s) actif(s)`,
        description: `Des articles nécessitent votre attention`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    checkRappels();
  }, [articles]);

  const handleAddArticle = () => {
    if (!canModifyArticles) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions pour ajouter des articles",
        variant: "destructive",
      });
      return;
    }
    setEditingArticle(null);
    setIsModalOpen(true);
  };

  const handleEditArticle = (article: Article) => {
    if (!canModifyArticles) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions pour modifier des articles",
        variant: "destructive",
      });
      return;
    }
    setEditingArticle(article);
    setIsModalOpen(true);
  };

  const handleDeleteArticle = async (id: number) => {
    if (!canDeleteArticles) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions pour supprimer des articles",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        setLoading(true);
        await deleteArticle(id);
        await loadData();
        toast({
          title: "Article supprimé",
          description: "L'article a été supprimé avec succès",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'article",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveArticle = async (articleData: Omit<Article, 'id'> | Article) => {
    try {
      setLoading(true);
      if ('id' in articleData && articleData.id) {
        await updateArticle(articleData);
        toast({
          title: "Article modifié",
          description: "L'article a été modifié avec succès",
        });
      } else {
        await createArticle(articleData);
        toast({
          title: "Article ajouté",
          description: "L'article a été ajouté avec succès",
        });
      }
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'article",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportDatabase = () => {
    toast({
      title: "Fonctionnalité non disponible",
      description: "L'export de base de données n'est pas encore implémenté avec l'API backend",
      variant: "destructive",
    });
  };

  const handleImportDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    toast({
      title: "Fonctionnalité non disponible",
      description: "L'import de base de données n'est pas encore implémenté avec l'API backend",
      variant: "destructive",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openUserManagement = () => {
    if (canManageUsers) {
      setIsUserManagementOpen(true);
    } else {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Connexion au serveur...</p>
          <p className="mt-2 text-sm text-gray-500">Assurez-vous que FastAPI fonctionne sur http://localhost:8000</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div>Chargement...</div>;
  }

  if (!canViewArticles) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Accès Refusé</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
            <p className="text-sm text-gray-600 mb-4">
              Rôle actuel: <Badge variant="outline">{user.role_display_name}</Badge>
            </p>
            <Button onClick={logout} variant="outline">
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Add loading indicator for actions */}
      {loading && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Traitement en cours...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <img
                  src="/lovable-uploads/35137944-4fd5-4269-95e4-e24464bfaff4.png"
                  alt="Logo"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Gestion des Articles
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="text-gray-600 dark:text-gray-400"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user.nom_complet}
                </span>
                <Badge variant={user.niveau_acces === 'lecture_seule' ? 'secondary' : 'default'} className="text-xs">
                  {user.niveau_acces === 'lecture_seule' ? 'Lecture seule' : 'Lecture + Modification'}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        <StatisticsDashboard statistics={statistics} />

        {/* Recherche avancée */}
        {showAdvancedSearch && (
          <AdvancedSearch
            onSearch={handleAdvancedSearch}
            onReset={handleResetSearch}
            utilisateurs={getUtilisateursUniques()}
            tagsDisponibles={getTagsUniques()}
          />
        )}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={!!rechercheAvancee}
            />
          </div>

          <div className="flex gap-2">
            <Select value={filterCategorie} onValueChange={setFilterCategorie} disabled={!!rechercheAvancee}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories
                  .filter(cat => cat.nom && cat.nom.trim() !== '')
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.nom}>
                      {cat.nom}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={filterSousCategorie} onValueChange={setFilterSousCategorie} disabled={!!rechercheAvancee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sous-catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sous-catégories</SelectItem>
                {sousCategories
                  .filter(sc => sc.nom && sc.nom.trim() !== '' && (filterCategorie === 'all' || sc.categorie === filterCategorie))
                  .map((sc) => (
                    <SelectItem key={sc.id} value={sc.nom}>
                      {sc.nom}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {canModifyArticles && (
            <Button onClick={handleAddArticle} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Article
            </Button>
          )}

          <Button
            variant={showAdvancedSearch ? "default" : "outline"}
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          >
            <Search className="h-4 w-4 mr-2" />
            Recherche avancée
          </Button>

          <div className="flex items-center space-x-2 ml-4">
            <Label htmlFor="view-mode" className="text-sm">Mode:</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('card')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsCategoryManagementOpen(true)}
            disabled={!canManageCategories}
          >
            <FolderTree className="h-4 w-4 mr-2" />
            Gérer les catégories
          </Button>

          {canManageUsers && (
            <Button
              variant="outline"
              onClick={openUserManagement}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <Users className="h-4 w-4 mr-2" />
              Gérer les utilisateurs
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setIsExportModalOpen(true)}
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <FileText className="h-4 w-4 mr-2" />
            Exporter
          </Button>

          <Button variant="outline" onClick={handleExportDatabase}>
            <Download className="h-4 w-4 mr-2" />
            Exporter DB
          </Button>

          {canModifyArticles && (
            <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Importer DB
            </Button>
          )}
          <input
            id="import-file"
            type="file"
            accept=".db"
            onChange={handleImportDatabase}
            className="hidden"
          />
        </div>

        {/* Category Description */}
        <CategoryDescription
          selectedCategory={filterCategorie}
          selectedSousCategory={filterSousCategorie}
        />

        {/* Articles List */}
        {viewMode === 'card' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => {
              const isRappelActif = article.date_rappel && new Date(article.date_rappel) <= new Date();

              return (
                <Card key={article.id} className={`hover:shadow-lg transition-shadow duration-200 ${isRappelActif ? 'ring-2 ring-red-500' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {article.titre}
                          {isRappelActif && (
                            <div title="Rappel actif">
                              <Calendar className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                        </div>
                      </CardTitle>
                      {canModifyArticles && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditArticle(article)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArticle(article.id!)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {article.categorie}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {article.sous_categorie}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {article.description || 'Aucune description'}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-orange-600">
                          {formatPrice(article.prix)}
                        </span>
                        <span className="text-sm text-gray-500">
                          par {article.unite}
                        </span>
                      </div>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {article.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                        Modifié par {article.dernier_modifie_par || 'Inconnu'}<br />
                        le {formatDate(article.date_modification)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <TableView
            articles={filteredArticles}
            canModify={canModifyArticles}
            onEditArticle={handleEditArticle}
            onDeleteArticle={handleDeleteArticle}
            formatPrice={formatPrice}
            formatDate={formatDate}
          />
        )}

        {filteredArticles.length === 0 && !loading && (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400">
                Aucun article trouvé.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {canModifyArticles
                  ? "Commencez par ajouter votre premier article."
                  : "Aucun article disponible pour le moment."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modales */}
      <ArticleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveArticle}
        article={editingArticle}
        categories={categories}
        sousCategories={sousCategories}
      />

      <CategoryManagement
        isOpen={isCategoryManagementOpen}
        onClose={() => setIsCategoryManagementOpen(false)}
        onCategoriesUpdated={loadData}
      />

      {canManageUsers && (
        <UserManagement
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
        />
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        articles={filteredArticles}
      />
    </div>
  );
};
