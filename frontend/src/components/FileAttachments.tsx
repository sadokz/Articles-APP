
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { SupabaseService } from '../services/SupabaseService';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Download, 
  Trash2, 
  Eye,
  Paperclip
} from 'lucide-react';

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface FileAttachmentsProps {
  attachments: string[];
  onAttachmentsChange: (attachments: string[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // en MB
  allowedTypes?: string[];
}

export const FileAttachments: React.FC<FileAttachmentsProps> = ({
  attachments,
  onAttachmentsChange,
  maxFiles = 10,
  maxSizePerFile = 10,
  allowedTypes = ['image/*', 'application/pdf', 'text/*', '.doc', '.docx', '.xls', '.xlsx']
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseAttachments = (): FileAttachment[] => {
    return attachments.map(attachment => {
      try {
        return JSON.parse(attachment);
      } catch {
        // Format legacy - juste une URL
        return {
          name: attachment.split('/').pop() || 'fichier',
          url: attachment,
          type: 'unknown',
          size: 0,
          uploadedAt: new Date().toISOString()
        };
      }
    });
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentAttachments = parseAttachments();
    
    if (currentAttachments.length + files.length > maxFiles) {
      toast({
        title: "Limite atteinte",
        description: `Maximum ${maxFiles} fichiers autorisés`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const newAttachments: string[] = [];
      const totalFiles = files.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Vérifier la taille
        if (file.size > maxSizePerFile * 1024 * 1024) {
          toast({
            title: "Fichier trop volumineux",
            description: `${file.name} dépasse ${maxSizePerFile}MB`,
            variant: "destructive",
          });
          continue;
        }

        // Vérifier le type
        const isAllowed = allowedTypes.some(type => {
          if (type.includes('*')) {
            return file.type.startsWith(type.replace('*', ''));
          }
          return file.name.toLowerCase().endsWith(type) || file.type === type;
        });

        if (!isAllowed) {
          toast({
            title: "Type de fichier non autorisé",
            description: `${file.name} n'est pas un type de fichier autorisé`,
            variant: "destructive",
          });
          continue;
        }

        try {
          const url = await SupabaseService.uploadFile(file, 'article-attachments');
          
          const attachment: FileAttachment = {
            name: file.name,
            url,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
          };

          newAttachments.push(JSON.stringify(attachment));
          
          setUploadProgress(((i + 1) / totalFiles) * 100);
        } catch (error) {
          console.error('Erreur upload:', error);
          toast({
            title: "Erreur d'upload",
            description: `Impossible d'uploader ${file.name}`,
            variant: "destructive",
          });
        }
      }

      if (newAttachments.length > 0) {
        onAttachmentsChange([...attachments, ...newAttachments]);
        toast({
          title: "Fichiers uploadés",
          description: `${newAttachments.length} fichier(s) ajouté(s)`,
        });
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = async (index: number) => {
    const attachmentsList = parseAttachments();
    const attachment = attachmentsList[index];
    
    try {
      // Extraire le chemin du fichier depuis l'URL pour le supprimer du storage
      const urlPath = attachment.url.split('/').slice(-2).join('/');
      await SupabaseService.deleteFile(urlPath);
      
      const newAttachments = attachments.filter((_, i) => i !== index);
      onAttachmentsChange(newAttachments);
      
      toast({
        title: "Fichier supprimé",
        description: `${attachment.name} a été supprimé`,
      });
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Taille inconnue';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentAttachments = parseAttachments();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Paperclip className="h-5 w-5" />
          Pièces jointes
          <Badge variant="secondary">
            {currentAttachments.length}/{maxFiles}
          </Badge>
        </CardTitle>
        <CardDescription>
          Ajoutez des fichiers à cet article (max {maxSizePerFile}MB par fichier)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Zone d'upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            {uploading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload en cours...
                </p>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Glissez vos fichiers ici ou cliquez pour parcourir
                </p>
                <Button 
                  onClick={handleFileSelect}
                  disabled={currentAttachments.length >= maxFiles}
                  variant="outline"
                >
                  Choisir des fichiers
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Types autorisés: Images, PDF, Documents Word/Excel, Texte
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Liste des fichiers */}
          {currentAttachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                Fichiers attachés
              </h4>
              {currentAttachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(attachment.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.size)} • {formatDate(attachment.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {attachment.type.startsWith('image/') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(attachment.url, '_blank')}
                        title="Prévisualiser"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(attachment.url, '_blank')}
                      title="Télécharger"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveAttachment(index)}
                      className="text-red-600 hover:text-red-700"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
