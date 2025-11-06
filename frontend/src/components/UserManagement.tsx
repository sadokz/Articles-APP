import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  UserWithRole, UserCreate, UserUpdate, Role, RoleWithPermissions,
  Permission, RoleCreate, RoleUpdate
} from '../types/User';
import {
  getAllUsers, updateUser, deleteUser, registerUser,
  getRolesAndPermissions, createRole, updateRole, deleteRole
} from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Edit, Trash2, Users, Shield, Eye, EyeOff,
  UserPlus, Settings, Lock, Unlock, Crown, Key
} from 'lucide-react';

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ isOpen, onClose }) => {
  const { token, user: currentUser, hasPermission } = useAuth();
  const { toast } = useToast();

  // Users state
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [userForm, setUserForm] = useState<UserCreate | UserUpdate>({
    email: '',
    nom: '',
    prenom: '',
    role_id: 4, // Default to 'editor' role
  });

  // Roles state
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [roleForm, setRoleForm] = useState<RoleCreate | RoleUpdate>({
    name: '',
    display_name: '',
    description: '',
    is_active: true,
    permission_ids: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  // Calculate available tabs
  const availableTabs = [];
  if (hasPermission('users.read')) availableTabs.push('users');
  if (hasPermission('roles.read')) availableTabs.push('roles');

  // Set initial tab based on available permissions
  useEffect(() => {
    if (isOpen && availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [isOpen, availableTabs, activeTab]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const promises = [];

      if (hasPermission('users.read')) {
        promises.push(getAllUsers(token!));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (hasPermission('roles.read')) {
        promises.push(getRolesAndPermissions(token!));
      } else {
        promises.push(Promise.resolve({ roles: [], permissions: [] }));
      }

      const [usersData, rolesData] = await Promise.all(promises);

      setUsers(usersData);
      setRoles(rolesData.roles);
      setPermissions(rolesData.permissions);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données. Vérifiez votre connexion et vos permissions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // User Management Functions
  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role_id: user.role_id,
      is_active: user.is_active,
    });
    setIsEditingUser(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      email: '',
      nom: '',
      prenom: '',
      password: '',
      role_id: 4, // Default to 'editor' role
    });
    setIsEditingUser(true);
  };

  const handleSaveUser = async () => {
    try {
      setIsLoading(true);
      if (editingUser) {
        await updateUser(editingUser.id, userForm as UserUpdate, token!);
        toast({
          title: "Utilisateur modifié",
          description: "L'utilisateur a été modifié avec succès",
        });
      } else {
        await registerUser(userForm as UserCreate);
        toast({
          title: "Utilisateur ajouté",
          description: "L'utilisateur a été ajouté avec succès",
        });
      }
      setIsEditingUser(false);
      await loadData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (user: UserWithRole) => {
    if (user.id === currentUser?.id) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer votre propre compte",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.email}" ?`)) {
      try {
        await deleteUser(user.id, token!);
        toast({
          title: "Utilisateur supprimé",
          description: "L'utilisateur a été supprimé avec succès",
        });
        await loadData();
      } catch (error) {
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Impossible de supprimer l'utilisateur",
          variant: "destructive",
        });
      }
    }
  };

  // Role Management Functions
  const handleEditRole = (role: RoleWithPermissions) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      display_name: role.display_name,
      description: role.description,
      is_active: role.is_active,
      permission_ids: role.permissions.map(p => p.id),
    });
    setIsEditingRole(true);
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      display_name: '',
      description: '',
      is_active: true,
      permission_ids: [],
    });
    setIsEditingRole(true);
  };

  const handleSaveRole = async () => {
    try {
      setIsLoading(true);
      if (editingRole) {
        await updateRole(editingRole.id, roleForm as RoleUpdate, token!);
        toast({
          title: "Rôle modifié",
          description: "Le rôle a été modifié avec succès",
        });
      } else {
        await createRole(roleForm as RoleCreate, token!);
        toast({
          title: "Rôle ajouté",
          description: "Le rôle a été ajouté avec succès",
        });
      }
      setIsEditingRole(false);
      await loadData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder le rôle",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (role: RoleWithPermissions) => {
    if (['super_admin', 'admin'].includes(role.name)) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les rôles système",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.display_name}" ?`)) {
      try {
        await deleteRole(role.id, token!);
        toast({
          title: "Rôle supprimé",
          description: "Le rôle a été supprimé avec succès",
        });
        await loadData();
      } catch (error) {
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Impossible de supprimer le rôle",
          variant: "destructive",
        });
      }
    }
  };

  const handlePermissionToggle = (permissionId: number, checked: boolean) => {
    const currentIds = (roleForm.permission_ids as number[]) || [];
    if (checked) {
      setRoleForm({
        ...roleForm,
        permission_ids: [...currentIds, permissionId]
      });
    } else {
      setRoleForm({
        ...roleForm,
        permission_ids: currentIds.filter(id => id !== permissionId)
      });
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      case 'editor': return 'outline';
      case 'viewer': return 'secondary';
      case 'inactive': return 'destructive';
      default: return 'outline';
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'super_admin': return <Crown className="h-3 w-3 mr-1" />;
      case 'admin': return <Shield className="h-3 w-3 mr-1" />;
      case 'manager': return <Key className="h-3 w-3 mr-1" />;
      case 'editor': return <Edit className="h-3 w-3 mr-1" />;
      case 'viewer': return <Eye className="h-3 w-3 mr-1" />;
      case 'inactive': return <EyeOff className="h-3 w-3 mr-1" />;
      default: return <Users className="h-3 w-3 mr-1" />;
    }
  };

  // Group permissions by resource for better UI
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (!hasPermission('users.read') && !hasPermission('roles.read')) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accès refusé</DialogTitle>
            <DialogDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gestion des Utilisateurs et Rôles
            </DialogTitle>
            <DialogDescription>
              Gérez les utilisateurs, leurs rôles et permissions d'accès
              {(!hasPermission('users.read') || !hasPermission('roles.read')) && (hasPermission('users.read') || hasPermission('roles.read')) && (
                <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
                  ⚠️ Permissions limitées : Vous n'avez accès qu'à certaines fonctionnalités de gestion.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className={`grid w-full ${availableTabs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {hasPermission('users.read') && (
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Utilisateurs
                </TabsTrigger>
              )}
              {hasPermission('roles.read') && (
                <TabsTrigger value="roles" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Rôles et Permissions
                </TabsTrigger>
              )}
            </TabsList>

            {/* Users Tab */}
            {hasPermission('users.read') && (
              <TabsContent value="users" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Liste des Utilisateurs</h3>
                  {hasPermission('users.create') && (
                    <Button onClick={handleAddUser}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Nouvel Utilisateur
                    </Button>
                  )}
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Créé le</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-2"></div>
                              Chargement des utilisateurs...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucun utilisateur trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.prenom} {user.nom}</div>
                                <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(user.role_name)}>
                                {getRoleIcon(user.role_name)}
                                {user.role_display_name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                {user.is_active ? (
                                  <>
                                    <Unlock className="h-3 w-3 mr-1" />
                                    Actif
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-3 w-3 mr-1" />
                                    Inactif
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {hasPermission('users.update') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {hasPermission('users.delete') && user.id !== currentUser?.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            )}

            {/* Roles Tab */}
            {hasPermission('roles.read') && (
              <TabsContent value="roles" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Gestion des Rôles</h3>
                  {hasPermission('roles.create') && (
                    <Button onClick={handleAddRole}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau Rôle
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {isLoading ? (
                    <div className="col-span-full flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-2"></div>
                      Chargement des rôles...
                    </div>
                  ) : roles.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      Aucun rôle trouvé
                    </div>
                  ) : (
                    roles.map((role) => (
                      <Card key={role.id} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {getRoleIcon(role.name)}
                              {role.display_name}
                            </CardTitle>
                            <Badge variant={role.is_active ? 'default' : 'secondary'}>
                              {role.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <CardDescription>{role.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <strong>Permissions:</strong> {role.permissions.length}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {role.permissions.slice(0, 3).map((perm) => (
                                <Badge key={perm.id} variant="outline" className="text-xs">
                                  {perm.resource}
                                </Badge>
                              ))}
                              {role.permissions.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{role.permissions.length - 3} plus
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2 pt-2">
                              {hasPermission('roles.update') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditRole(role)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Modifier
                                </Button>
                              )}
                              {hasPermission('roles.delete') && !['super_admin', 'admin'].includes(role.name) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteRole(role)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Supprimer
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* User Edit Modal */}
      <Dialog open={isEditingUser} onOpenChange={setIsEditingUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={userForm.prenom || ''}
                  onChange={(e) => setUserForm({ ...userForm, prenom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={userForm.nom || ''}
                  onChange={(e) => setUserForm({ ...userForm, nom: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email || ''}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </div>

            {!editingUser && (
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={(userForm as UserCreate).password || ''}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>
            )}

            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={userForm.role_id?.toString()}
                onValueChange={(value) => setUserForm({ ...userForm, role_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.filter(role => role.is_active).map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(role.name)}
                        {role.display_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editingUser && 'is_active' in userForm && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={(userForm as UserUpdate).is_active || false}
                  onCheckedChange={(checked) =>
                    setUserForm({ ...userForm, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Compte actif</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingUser(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveUser} disabled={isLoading}>
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Edit Modal */}
      <Dialog open={isEditingRole} onOpenChange={setIsEditingRole}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Modifier Rôle' : 'Nouveau Rôle'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role_name">Nom du rôle (système)</Label>
                <Input
                  id="role_name"
                  value={roleForm.name || ''}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="ex: custom_role"
                />
              </div>
              <div>
                <Label htmlFor="role_display_name">Nom d'affichage</Label>
                <Input
                  id="role_display_name"
                  value={roleForm.display_name || ''}
                  onChange={(e) => setRoleForm({ ...roleForm, display_name: e.target.value })}
                  placeholder="ex: Rôle Personnalisé"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role_description">Description</Label>
              <Textarea
                id="role_description"
                value={roleForm.description || ''}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Description du rôle et de ses responsabilités"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="role_active"
                checked={roleForm.is_active || false}
                onCheckedChange={(checked) => setRoleForm({ ...roleForm, is_active: checked })}
              />
              <Label htmlFor="role_active">Rôle actif</Label>
            </div>

            <div>
              <Label className="text-base font-semibold">Permissions</Label>
              <div className="mt-2 space-y-4 border rounded-lg p-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                  <div key={resource} className="space-y-2">
                    <h4 className="font-medium capitalize text-sm text-muted-foreground">
                      {resource}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      {resourcePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${permission.id}`}
                            checked={(roleForm.permission_ids as number[])?.includes(permission.id) || false}
                            onCheckedChange={(checked) =>
                              handlePermissionToggle(permission.id, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`perm-${permission.id}`}
                            className="text-sm cursor-pointer"
                            title={permission.description}
                          >
                            {permission.display_name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingRole(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveRole} disabled={isLoading}>
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
