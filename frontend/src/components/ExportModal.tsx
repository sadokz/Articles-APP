
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Article } from '../types/Article';
import { Download, File } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, articles }) => {
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [exportFormat, setExportFormat] = useState<'excel' | 'word'>('excel');

  const toggleArticle = (id: number) => {
    setSelectedArticles(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedArticles(articles.map(a => a.id!));
  };

  const deselectAll = () => {
    setSelectedArticles([]);
  };

  const exportToCSV = () => {
    const selectedData = articles.filter(a => selectedArticles.includes(a.id!));
    const headers = ['Titre', 'Catégorie', 'Sous-catégorie', 'Prix', 'Unité', 'Description', 'Tags', 'Modifié par', 'Date modification'];
    const csvContent = [
      headers.join(','),
      ...selectedData.map(article =>
        [
          `"${article.titre}"`,
          `"${article.categorie}"`,
          `"${article.sous_categorie}"`,
          article.prix,
          `"${article.unite}"`,
          `"${article.description}"`,
          `"${article.tags?.join('; ') || ''}"`,
          `"${article.dernier_modifie_par}"`,
          `"${new Date(article.date_modification).toLocaleDateString('fr-FR')}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'articles_export.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportToWord = () => {
    const selectedData = articles.filter(a => selectedArticles.includes(a.id!));
    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Export Articles</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Export des Articles</h1>
          <table>
            <tr>
              <th>Titre</th>
              <th>Catégorie</th>
              <th>Sous-catégorie</th>
              <th>Prix</th>
              <th>Unité</th>
              <th>Description</th>
              <th>Tags</th>
              <th>Modifié par</th>
              <th>Date modification</th>
            </tr>
    `;

    selectedData.forEach(article => {
      htmlContent += `
        <tr>
          <td>${article.titre}</td>
          <td>${article.categorie}</td>
          <td>${article.sous_categorie}</td>
          <td>${article.prix}€</td>
          <td>${article.unite}</td>
          <td>${article.description}</td>
          <td>${article.tags?.join(', ') || ''}</td>
          <td>${article.dernier_modifie_par}</td>
          <td>${new Date(article.date_modification).toLocaleDateString('fr-FR')}</td>
        </tr>
      `;
    });

    htmlContent += `
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'articles_export.doc';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExport = () => {
    if (selectedArticles.length === 0) return;

    if (exportFormat === 'excel') {
      exportToCSV();
    } else {
      exportToWord();
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exporter les articles</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={exportFormat === 'excel' ? 'default' : 'outline'}
              onClick={() => setExportFormat('excel')}
              className="flex items-center gap-2"
            >
              <File className="h-4 w-4" />
              Excel (CSV)
            </Button>
            <Button
              variant={exportFormat === 'word' ? 'default' : 'outline'}
              onClick={() => setExportFormat('word')}
              className="flex items-center gap-2"
            >
              <File className="h-4 w-4" />
              Word
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Tout sélectionner
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Tout désélectionner
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-2">
            {articles.map((article) => (
              <div key={article.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`article-${article.id}`}
                  checked={selectedArticles.includes(article.id!)}
                  onCheckedChange={() => toggleArticle(article.id!)}
                />
                <Label htmlFor={`article-${article.id}`} className="text-sm cursor-pointer">
                  {article.titre}
                </Label>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            <span className="text-sm text-gray-600">
              {selectedArticles.length} article(s) sélectionné(s)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                onClick={handleExport}
                disabled={selectedArticles.length === 0}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
