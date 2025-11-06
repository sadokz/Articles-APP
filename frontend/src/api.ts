import {
  User, UserCreate, UserLogin, UserUpdate, UserWithRole, AuthToken,
  Role, RoleCreate, RoleUpdate, RoleWithPermissions, Permission,
  RolePermissionResponse, PermissionCheck, PermissionCheckResponse
} from './types/User';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Helper function to get auth headers
const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// Authentication API functions
export async function loginUser(credentials: UserLogin): Promise<AuthToken> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(credentials)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export async function registerUser(userData: UserCreate): Promise<User> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export async function getCurrentUser(token: string): Promise<UserWithRole> {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: getAuthHeaders(token)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

// User Management API functions
export async function getAllUsers(token: string): Promise<UserWithRole[]> {
  const res = await fetch(`${BASE_URL}/api/auth/users`, {
    headers: getAuthHeaders(token)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export async function updateUser(userId: number, userData: UserUpdate, token: string): Promise<UserWithRole> {
  const res = await fetch(`${BASE_URL}/api/auth/users/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(userData)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export async function deleteUser(userId: number, token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }
}

// Role Management API functions
export async function getRolesAndPermissions(token: string): Promise<RolePermissionResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/roles`, {
    headers: getAuthHeaders(token)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export async function createRole(roleData: RoleCreate, token: string): Promise<RoleWithPermissions> {
  const res = await fetch(`${BASE_URL}/api/auth/roles`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(roleData)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export async function updateRole(roleId: number, roleData: RoleUpdate, token: string): Promise<RoleWithPermissions> {
  const res = await fetch(`${BASE_URL}/api/auth/roles/${roleId}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(roleData)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export async function deleteRole(roleId: number, token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/roles/${roleId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }
}

export async function checkPermission(permissionCheck: PermissionCheck, token: string): Promise<PermissionCheckResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/check-permission`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(permissionCheck)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

// Article API functions (existing - keeping for compatibility)
export async function getArticles(token?: string) {
  const res = await fetch(`${BASE_URL}/api/articles`, {
    headers: token ? getAuthHeaders(token) : {}
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function getArticle(id) {
  const res = await fetch(`${BASE_URL}/api/articles/${id}`);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function createArticle(articleData: any) {
  // Convert article object to FormData for file upload support
  const formData = new FormData();
  formData.append('titre', articleData.titre);
  formData.append('prix', articleData.prix.toString());
  formData.append('unite', articleData.unite);
  formData.append('description', articleData.description || '');
  formData.append('categorie', articleData.categorie);
  formData.append('sous_categorie', articleData.sous_categorie);
  formData.append('date_rappel', articleData.date_rappel || '');

  const res = await fetch(`${BASE_URL}/api/articles/`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const errorData = await res.json();
    console.error('Create article error:', errorData);
    throw new Error(`HTTP error! status: ${res.status} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

export async function updateArticle(id, article) {
  const res = await fetch(`${BASE_URL}/api/articles/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(article)
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function deleteArticle(id) {
  const res = await fetch(`${BASE_URL}/api/articles/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function getCategories(token?: string) {
  const res = await fetch(`${BASE_URL}/api/categories/`, {
    headers: token ? getAuthHeaders(token) : {}
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function createCategory(nom: string, description: string = "", token: string) {
  const res = await fetch(`${BASE_URL}/api/categories/`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ nom, description })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function updateCategory(id: number, nom: string, description: string = "", token: string) {
  const res = await fetch(`${BASE_URL}/api/categories/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ nom, description })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function deleteCategory(id: number, token: string) {
  const res = await fetch(`${BASE_URL}/api/categories/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function getSousCategories(token?: string) {
  const res = await fetch(`${BASE_URL}/api/sous-categories/`, {
    headers: token ? getAuthHeaders(token) : {}
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function createSousCategorie(nom: string, categorie: string, description: string = "", token: string) {
  const res = await fetch(`${BASE_URL}/api/sous-categories/`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ nom, categorie, description })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function updateSousCategorie(id: number, nom: string, categorie: string, description: string = "", token: string) {
  const res = await fetch(`${BASE_URL}/api/sous-categories/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ nom, categorie, description })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function deleteSousCategorie(id: number, token: string) {
  const res = await fetch(`${BASE_URL}/api/sous-categories/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}
