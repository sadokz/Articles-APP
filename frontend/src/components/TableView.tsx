
import React from 'react';
import { Article } from '../types/Article';
import { ExtendedUser } from '../types/User';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Calendar, Paperclip } from 'lucide-react';

interface TableViewProps {
  articles: Article[];
  canModify: boolean;
  onEditArticle: (article: Article) => void;
  onDeleteArticle: (id: number) => void;
  formatPrice: (price: number) => string;
  formatDate: (dateString: string) => string;
}

export const TableView: React.FC<TableViewProps> = ({
  articles,
  canModify,
  onEditArticle,
  onDeleteArticle,
  formatPrice,
  formatDate
}) => {
  const checkRappel = (dateRappel?: string) => {
    if (!dateRappel) return false;
    const rappel = new Date(dateRappel);
    const maintenant = new Date();
    return rappel <= maintenant;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Sous-catégorie</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Unité</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Modifié par</TableHead>
            <TableHead>Date</TableHead>
            {canModify && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => (
            <TableRow key={article.id} className={checkRappel(article.date_rappel) ? 'bg-red-50 dark:bg-red-900/20' : ''}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {article.titre}
                  {checkRappel(article.date_rappel) && (
                    <div title="Rappel actif">
                      <Calendar className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                  {article.pieces_jointes && article.pieces_jointes.length > 0 && (
                    <div title={`${article.pieces_jointes.length} pièce(s) jointe(s)`}>
                      <Paperclip className="h-4 w-4 text-blue-500" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {article.categorie}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {article.sous_categorie}
                </Badge>
              </TableCell>
              <TableCell className="font-bold text-orange-600">
                {formatPrice(article.prix)}
              </TableCell>
              <TableCell>{article.unite}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {article.tags && article.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                {article.dernier_modifie_par}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(article.date_modification)}
              </TableCell>
              {canModify && (
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditArticle(article)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteArticle(article.id!)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
