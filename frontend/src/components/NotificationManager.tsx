
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { SupabaseService } from '../services/SupabaseService';
import { 
  Bell, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';

interface NotificationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  articleId?: number;
  articleTitle?: string;
}

interface Reminder {
  id?: number;
  article_id: number;
  reminder_date: string;
  message: string;
  is_sent: boolean;
  user_id: string;
  created_at: string;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  isOpen,
  onClose,
  articleId,
  articleTitle
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderMessage, setNewReminderMessage] = useState('');
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadReminders();
      checkActiveReminders();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoCheckEnabled && isOpen) {
      interval = setInterval(() => {
        checkActiveReminders();
      }, 60000); // Vérifier toutes les minutes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoCheckEnabled, isOpen]);

  const loadReminders = async () => {
    setLoading(true);
    try {
      // Pour l'instant, on charge tous les rappels
      // Dans une vraie implémentation, on filtrerait par article si articleId est fourni
      const activeData = await SupabaseService.getActiveReminders();
      setActiveReminders(activeData);
    } catch (error) {
      console.error('Erreur lors du chargement des rappels:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rappels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkActiveReminders = async () => {
    try {
      const activeData = await SupabaseService.getActiveReminders();
      setActiveReminders(activeData);
      
      // Notifier l'utilisateur des rappels actifs
      if (activeData.length > 0) {
        const newReminders = activeData.filter(reminder => !reminder.is_sent);
        if (newReminders.length > 0) {
          toast({
            title: `${newReminders.length} rappel(s) actif(s)`,
            description: "Des articles nécessitent votre attention",
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des rappels:', error);
    }
  };

  const handleAddReminder = async () => {
    if (!articleId || !newReminderDate || !newReminderTime || !newReminderMessage.trim()) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    try {
      const reminderDateTime = `${newReminderDate}T${newReminderTime}:00`;
      
      await SupabaseService.addReminder(
        articleId,
        reminderDateTime,
        newReminderMessage
      );

      setNewReminderDate('');
      setNewReminderTime('');
      setNewReminderMessage('');
      setIsAddingReminder(false);
      
      await loadReminders();
      
      toast({
        title: "Rappel ajouté",
        description: "Le rappel a été programmé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du rappel:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le rappel",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsSent = async (reminderId: number) => {
    try {
      await SupabaseService.markReminderAsSent(reminderId);
      await loadReminders();
      
      toast({
        title: "Rappel marqué comme traité",
        description: "Le rappel a été marqué comme envoyé",
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rappel:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rappel",
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isReminderActive = (reminder: Reminder) => {
    return new Date(reminder.reminder_date) <= new Date() && !reminder.is_sent;
  };

  const isReminderPending = (reminder: Reminder) => {
    return new Date(reminder.reminder_date) > new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Gestion des notifications et rappels
            {articleTitle && (
              <Badge variant="outline">{articleTitle}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rappels actifs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Rappels actifs
                <Badge variant="destructive">
                  {activeReminders.filter(r => isReminderActive(r)).length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Rappels qui nécessitent votre attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              )}

              {!loading && activeReminders.filter(r => isReminderActive(r)).length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun rappel actif</p>
                </div>
              )}

              <div className="space-y-3">
                {activeReminders
                  .filter(r => isReminderActive(r))
                  .map((reminder) => (
                    <div
                      key={reminder.id}
                      className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-red-800 dark:text-red-200">
                            Article #{reminder.article_id}
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            {reminder.message}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDateTime(reminder.reminder_date)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsSent(reminder.id!)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Traité
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Ajouter un rappel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5" />
                Ajouter un rappel
              </CardTitle>
              <CardDescription>
                Programmez un rappel pour cet article
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!articleId ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Sélectionnez un article pour ajouter un rappel
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reminder-date">Date</Label>
                      <Input
                        id="reminder-date"
                        type="date"
                        value={newReminderDate}
                        onChange={(e) => setNewReminderDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reminder-time">Heure</Label>
                      <Input
                        id="reminder-time"
                        type="time"
                        value={newReminderTime}
                        onChange={(e) => setNewReminderTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reminder-message">Message du rappel</Label>
                    <Textarea
                      id="reminder-message"
                      placeholder="Vérifier le stock, renouveler la commande, etc."
                      value={newReminderMessage}
                      onChange={(e) => setNewReminderMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleAddReminder}
                    className="w-full"
                    disabled={!newReminderDate || !newReminderTime || !newReminderMessage.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter le rappel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rappels à venir */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-blue-500" />
              Rappels programmés
              <Badge variant="secondary">
                {activeReminders.filter(r => isReminderPending(r)).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeReminders.filter(r => isReminderPending(r)).length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Aucun rappel programmé
              </p>
            )}

            <div className="space-y-2">
              {activeReminders
                .filter(r => isReminderPending(r))
                .map((reminder) => (
                  <div
                    key={reminder.id}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-blue-800 dark:text-blue-200">
                          Article #{reminder.article_id}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {reminder.message}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatDateTime(reminder.reminder_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Paramètres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              Paramètres des notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-check">Vérification automatique</Label>
                <p className="text-sm text-gray-500">
                  Vérifier les rappels toutes les minutes
                </p>
              </div>
              <Switch
                id="auto-check"
                checked={autoCheckEnabled}
                onCheckedChange={setAutoCheckEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
