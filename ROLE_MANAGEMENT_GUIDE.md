  # Guide de Gestion des Rôles et Permissions

## Vue d'ensemble

Le système de gestion des articles dispose maintenant d'un système complet de rôles et permissions qui permet un contrôle granulaire des accès aux différentes fonctionnalités.

## Architecture du Système

### 1. Composants Principaux

- **Utilisateurs** : Comptes utilisateur avec authentification JWT
- **Rôles** : Groupes de permissions assignés aux utilisateurs
- **Permissions** : Droits spécifiques pour accéder à des ressources ou actions

### 2. Structure des Permissions

Les permissions suivent le format `{resource}.{action}` :

#### Ressources Articles
- `articles.read` - Consulter les articles
- `articles.create` - Créer de nouveaux articles
- `articles.update` - Modifier les articles existants
- `articles.delete` - Supprimer des articles

#### Ressources Catégories
- `categories.read` - Consulter les catégories
- `categories.create` - Créer de nouvelles catégories
- `categories.update` - Modifier les catégories
- `categories.delete` - Supprimer des catégories

#### Ressources Sous-Catégories
- `subcategories.read` - Consulter les sous-catégories
- `subcategories.create` - Créer de nouvelles sous-catégories
- `subcategories.update` - Modifier les sous-catégories
- `subcategories.delete` - Supprimer des sous-catégories

#### Ressources Utilisateurs
- `users.read` - Consulter la liste des utilisateurs
- `users.create` - Créer de nouveaux utilisateurs
- `users.update` - Modifier les comptes utilisateur
- `users.delete` - Supprimer des utilisateurs

#### Ressources Rôles
- `roles.read` - Consulter les rôles et permissions
- `roles.create` - Créer de nouveaux rôles
- `roles.update` - Modifier les rôles existants
- `roles.delete` - Supprimer des rôles

## Rôles Pré-configurés

### 1. Super Admin (`super_admin`)
- **Description** : Accès complet au système
- **Permissions** : Toutes les permissions
- **Usage** : Compte principal pour la configuration système

### 2. Admin (`admin`)
- **Description** : Administration générale
- **Permissions** : Gestion complète sauf super-admin
- **Usage** : Administrateurs de l'application

### 3. Manager (`manager`)
- **Description** : Gestion des contenus et équipes
- **Permissions** : Articles (CRUD), Catégories (CRUD), Utilisateurs (lecture/modification)
- **Usage** : Responsables d'équipe

### 4. Editor (`editor`)
- **Description** : Création et modification de contenu
- **Permissions** : Articles (CRUD), Catégories (lecture)
- **Usage** : Éditeurs de contenu

### 5. Viewer (`viewer`)
- **Description** : Consultation uniquement
- **Permissions** : Articles (lecture), Catégories (lecture)
- **Usage** : Utilisateurs en lecture seule

### 6. Inactive (`inactive`)
- **Description** : Compte désactivé
- **Permissions** : Aucune
- **Usage** : Comptes temporairement suspendus

## Utilisation du Système

### 1. Connexion et Authentification

```typescript
// Via l'interface utilisateur
const { login } = useAuth();
await login({ email: "user@example.com", password: "password" });

// Vérification des permissions
const { hasPermission, hasRole } = useAuth();
const canEditArticles = hasPermission('articles.update');
const isAdmin = hasRole('admin');
```

### 2. Gestion des Utilisateurs

#### Accès au panneau de gestion :
1. Se connecter avec un compte ayant la permission `users.read`
2. Cliquer sur "Gestion Utilisateurs" dans le dashboard
3. Onglet "Utilisateurs" pour voir la liste

#### Créer un nouvel utilisateur :
1. Cliquer sur "Nouvel Utilisateur"
2. Remplir le formulaire (prénom, nom, email, mot de passe)
3. Sélectionner un rôle approprié
4. Sauvegarder

#### Modifier un utilisateur :
1. Cliquer sur l'icône d'édition dans la liste
2. Modifier les informations nécessaires
3. Changer le rôle si nécessaire
4. Activer/désactiver le compte avec le commutateur

### 3. Gestion des Rôles

#### Accès au panneau de gestion :
1. Se connecter avec un compte ayant la permission `roles.read`
2. Aller dans "Gestion Utilisateurs"
3. Onglet "Rôles et Permissions"

#### Créer un nouveau rôle :
1. Cliquer sur "Nouveau Rôle"
2. Définir le nom système (ex: `custom_role`)
3. Définir le nom d'affichage (ex: "Rôle Personnalisé")
4. Ajouter une description
5. Sélectionner les permissions appropriées
6. Sauvegarder

#### Modifier un rôle :
1. Cliquer sur "Modifier" sur la carte du rôle
2. Ajuster les permissions selon les besoins
3. Sauvegarder les modifications

**Note** : Les rôles système (`super_admin`, `admin`) ne peuvent pas être supprimés.

## API Endpoints

### Authentification
```
POST /api/auth/login          # Connexion
POST /api/auth/register       # Inscription
GET  /api/auth/me            # Profil utilisateur
```

### Gestion des Utilisateurs
```
GET    /api/auth/users           # Liste des utilisateurs
PUT    /api/auth/users/{id}      # Modifier un utilisateur
DELETE /api/auth/users/{id}      # Supprimer un utilisateur
```

### Gestion des Rôles
```
GET    /api/auth/roles           # Rôles et permissions
POST   /api/auth/roles           # Créer un rôle
PUT    /api/auth/roles/{id}      # Modifier un rôle
DELETE /api/auth/roles/{id}      # Supprimer un rôle
```

### Vérification de Permissions
```
POST /api/auth/check-permission  # Vérifier une permission
```

## Configuration Frontend

### Utilisation du Hook useAuth

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { 
    user,           // Utilisateur connecté avec rôle
    hasPermission,  // Fonction de vérification permission
    hasRole,        // Fonction de vérification rôle
    hasAnyPermission // Vérifier plusieurs permissions
  } = useAuth();

  // Vérifications de permissions
  const canEdit = hasPermission('articles.update');
  const canManageUsers = hasRole('admin') || hasRole('super_admin');
  const hasWriteAccess = hasAnyPermission([
    'articles.create', 
    'articles.update'
  ]);

  return (
    <div>
      {canEdit && <EditButton />}
      {canManageUsers && <UserManagementLink />}
    </div>
  );
}
```

### Protection de Routes

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

## Sécurité

### Bonnes Pratiques

1. **Principe du moindre privilège** : Accordez uniquement les permissions nécessaires
2. **Rotation des tokens** : Les tokens JWT expirent après 30 minutes
3. **Validation côté serveur** : Toutes les permissions sont vérifiées au niveau API
4. **Audit des accès** : Les actions sont loggées avec l'utilisateur responsable

### Protections Implémentées

- **Protection contre l'auto-suppression** : Impossible de supprimer son propre compte
- **Protection des rôles système** : Super-admin et admin ne peuvent pas être supprimés
- **Hiérarchie des rôles** : Seuls les super-admin peuvent modifier d'autres super-admin
- **Validation des permissions** : Vérification automatique avant chaque action

## Dépannage

### Problèmes Courants

1. **"Accès refusé"** : Vérifiez que l'utilisateur a les bonnes permissions
2. **Token expiré** : Reconnectez-vous à l'application
3. **Rôle non trouvé** : Vérifiez que le rôle existe et est actif

### Logs et Monitoring

- Les erreurs d'authentification sont loggées dans la console backend
- Les tentatives d'accès non autorisées génèrent des warnings
- Le frontend affiche des messages d'erreur explicites

## Migration et Mise à Jour

### Utilisateurs Existants

Les utilisateurs existants sont automatiquement assignés au rôle `admin` lors de la migration. Ajustez les rôles selon vos besoins après la mise en place du système.

### Base de Données

```sql
-- Vérifier les rôles créés
SELECT * FROM roles;

-- Vérifier les permissions
SELECT * FROM permissions;

-- Voir les assignations utilisateur-rôle
SELECT u.email, r.display_name, r.name 
FROM users u 
JOIN roles r ON u.role_id = r.id;
```

Cette implémentation fournit un système de gestion des rôles flexible, sécurisé et extensible pour votre application de gestion d'articles. 