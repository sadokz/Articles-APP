export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithRole extends User {
  role_name: string;
  role_display_name: string;
  permissions: string[];
}

export interface UserCreate {
  email: string;
  nom: string;
  prenom: string;
  password: string;
  role_id?: number;
}

export interface UserUpdate {
  email?: string;
  nom?: string;
  prenom?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: UserWithRole | null;
  token: string | null;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description: string;
  resource: string;
  action: string;
  created_at?: string;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  created_at?: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface RoleCreate {
  name: string;
  display_name: string;
  description?: string;
  is_active?: boolean;
  permission_ids?: number[];
}

export interface RoleUpdate {
  name?: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
  permission_ids?: number[];
}

export interface RolePermissionResponse {
  roles: RoleWithPermissions[];
  permissions: Permission[];
}

export interface PermissionCheck {
  resource: string;
  action: string;
}

export interface PermissionCheckResponse {
  has_permission: boolean;
  message?: string;
}

export interface ExtendedUser {
  id: number;
  username: string;
  nom_complet: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  niveau_acces: 'lecture_seule' | 'lecture_modification' | 'inactif';
}
