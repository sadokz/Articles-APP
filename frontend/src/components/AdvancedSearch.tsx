
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RechercheAvancee } from '../types/Article';
import { Search, X } from 'lucide-react';

interface AdvancedSearchProps {
  onSearch: (criteria: RechercheAvancee) => void;
  onReset: () => void;
  utilisateurs: string[];
  tagsDisponibles: string[];
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onReset,
  utilisateurs,
  tagsDisponibles
}) => {
  const [criteria, setCriteria] = useState<RechercheAvancee>({
    motCle: '',
    prixMin: null,
    prixMax: null,
    utilisateur: '',
    dateDebut: '',
    dateFin: '',
    tags: []
  });

  const handleSearch = () => {
    onSearch(criteria);
  };

  const handleReset = () => {
    setCriteria({
      motCle: '',
      prixMin: null,
      prixMax: null,
      utilisateur: '',
      dateDebut: '',
      dateFin: '',
      tags: []
    });
    onReset();
  };

  const toggleTag = (tag: string) => {
    setCriteria(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5" />
          Recherche avancée
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="mot-cle">Mot-clé</Label>
            <Input
              id="mot-cle"
              value={criteria.motCle}
              onChange={(e) => setCriteria(prev => ({ ...prev, motCle: e.target.value }))}
              placeholder="Rechercher dans titre/description"
            />
          </div>

          <div>
            <Label htmlFor="prix-min">Prix minimum</Label>
            <Input
              id="prix-min"
              type="number"
              step="0.01"
              value={criteria.prixMin || ''}
              onChange={(e) => setCriteria(prev => ({ ...prev, prixMin: e.target.value ? parseFloat(e.target.value) : null }))}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="prix-max">Prix maximum</Label>
            <Input
              id="prix-max"
              type="number"
              step="0.01"
              value={criteria.prixMax || ''}
              onChange={(e) => setCriteria(prev => ({ ...prev, prixMax: e.target.value ? parseFloat(e.target.value) : null }))}
              placeholder="999.99"
            />
          </div>

          <div>
            <Label htmlFor="utilisateur">Utilisateur</Label>
            <Select value={criteria.utilisateur} onValueChange={(value) => setCriteria(prev => ({ ...prev, utilisateur: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les utilisateurs</SelectItem>
                {utilisateurs.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date-debut">Date début</Label>
            <Input
              id="date-debut"
              type="date"
              value={criteria.dateDebut}
              onChange={(e) => setCriteria(prev => ({ ...prev, dateDebut: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="date-fin">Date fin</Label>
            <Input
              id="date-fin"
              type="date"
              value={criteria.dateFin}
              onChange={(e) => setCriteria(prev => ({ ...prev, dateFin: e.target.value }))}
            />
          </div>
        </div>

        {tagsDisponibles.length > 0 && (
          <div className="mt-4">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tagsDisponibles.map((tag) => (
                <Button
                  key={tag}
                  variant={criteria.tags.includes(tag) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(tag)}
                  className="text-xs"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSearch} className="bg-orange-500 hover:bg-orange-600">
            <Search className="h-4 w-4 mr-2" />
            Rechercher
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <X className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
