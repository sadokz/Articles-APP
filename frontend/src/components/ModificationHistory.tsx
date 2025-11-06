
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SupabaseService } from '../services/SupabaseService';
import { History, Filter, Calendar, User, Edit, Plus, Trash2 } from 'lucide-react';

interface ModificationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  articleId?: number;
  tableName?: string;
}

interface HistoryEntry {
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

export const ModificationHistory: React.FC<ModificationHistoryProps> = ({
  isOpen,
  onClose,
  articleId,
  tableName
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTable, setFilterTable] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, articleId, tableName]);

  useEffect(() => {
    filterHistoryData();
  }, [history, filterTable, filterUser, filterAction, filterDate, searchTerm]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await SupabaseService.getModificationHistory(tableName, articleId);
      // Assurer que chaque entrée a un id valide
      const validatedData: HistoryEntry[] = data.map(entry => ({
        ...entry,
        id: entry.id || 0
      }));
      setHistory(validatedData);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistoryData = () => {
    let filtered = history;

    if (filterTable !== 'all') {
      filtered = filtered.filter(entry => entry.table_name === filterTable);
    }

    if (filterUser !== 'all') {
      filtered = filtered.filter(entry => entry.modified_by === filterUser);
    }

    if (filterAction !== 'all') {
      filtered = filtered.filter(entry => entry.action === filterAction);
    }

    if (filterDate) {
      filtered = filtered.filter(entry => 
        entry.modified_at.startsWith(filterDate)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.old_value && entry.old_value.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.new_value && entry.new_value.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredHistory(filtered);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    const variants = {
      INSERT: 'default',
      UPDATE: 'secondary', 
      DELETE: 'destructive'
    };
    return variants[action as keyof typeof variants] || 'outline';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (value: string | null) => {
    if (!value) return '(vide)';
    if (value.length > 100) return value.substring(0, 100) + '...';
    return value;
  };

  const getUniqueUsers = () => {
    return [...new Set(history.map(entry => entry.modified_by))];
  };

  const getUniqueTables = () => {
    return [...new Set(history.map(entry => entry.table_name))];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des modifications
            {articleId && <Badge variant="outline">Article #{articleId}</Badge>}
            {tableName && <Badge variant="outline">{tableName}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {/* Filtres */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search">Recherche</Label>
                <Input
                  id="search"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="table-filter">Table</Label>
                <Select value={filterTable} onValueChange={setFilterTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les tables" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les tables</SelectItem>
                    {getUniqueTables().map(table => (
                      <SelectItem key={table} value={table}>{table}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="user-filter">Utilisateur</Label>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les utilisateurs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les utilisateurs</SelectItem>
                    {getUniqueUsers().map(user => (
                      <SelectItem key={user} value={user}>{user}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="action-filter">Action</Label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les actions</SelectItem>
                    <SelectItem value="INSERT">Création</SelectItem>
                    <SelectItem value="UPDATE">Modification</SelectItem>
                    <SelectItem value="DELETE">Suppression</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date-filter">Date</Label>
                <Input
                  id="date-filter"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setFilterTable('all');
                  setFilterUser('all');
                  setFilterAction('all');
                  setFilterDate('');
                  setSearchTerm('');
                }}
              >
                Réinitialiser les filtres
              </Button>
              <Badge variant="secondary">
                {filteredHistory.length} entrée(s) trouvée(s)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Liste de l'historique */}
        <div className="space-y-3">
          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </CardContent>
            </Card>
          )}

          {!loading && filteredHistory.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune modification trouvée</p>
              </CardContent>
            </Card>
          )}

          {!loading && filteredHistory.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getActionIcon(entry.action)}
                    <div>
                      <CardTitle className="text-base">
                        {entry.table_name} #{entry.record_id}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.modified_at)}
                        <User className="h-3 w-3 ml-2" />
                        {entry.modified_by}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={getActionBadge(entry.action) as any}>
                    {entry.action}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {entry.field_name}
                    </Badge>
                  </div>
                  
                  {entry.action === 'UPDATE' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <Label className="text-xs text-red-700 dark:text-red-300">
                          Ancienne valeur
                        </Label>
                        <p className="text-sm text-red-800 dark:text-red-200 mt-1 break-all">
                          {formatValue(entry.old_value)}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <Label className="text-xs text-green-700 dark:text-green-300">
                          Nouvelle valeur
                        </Label>
                        <p className="text-sm text-green-800 dark:text-green-200 mt-1 break-all">
                          {formatValue(entry.new_value)}
                        </p>
                      </div>
                    </div>
                  )}

                  {entry.action === 'INSERT' && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <Label className="text-xs text-green-700 dark:text-green-300">
                        Valeur créée
                      </Label>
                      <p className="text-sm text-green-800 dark:text-green-200 mt-1 break-all">
                        {formatValue(entry.new_value)}
                      </p>
                    </div>
                  )}

                  {entry.action === 'DELETE' && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <Label className="text-xs text-gray-700 dark:text-gray-300">
                        Valeur supprimée
                      </Label>
                      <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 break-all">
                        {formatValue(entry.old_value)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
