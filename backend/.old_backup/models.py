from pydantic import BaseModel
from typing import Optional, List


class ArticleBase(BaseModel):
    titre: str
    prix: float
    unite: str
    description: Optional[str] = ""
    categorie: str
    sous_categorie: str
    date_rappel: Optional[str] = ""
    piece_jointe: Optional[str] = None


class ArticleCreate(ArticleBase):
    pass


class Article(ArticleBase):
    id: int


class Categorie(BaseModel):
    id: int
    nom: str
    description: Optional[str] = ""


class SousCategorie(BaseModel):
    id: int
    nom: str
    description: Optional[str] = ""
    categorie: str


# User Models for Authentication
class UserBase(BaseModel):
    email: str
    nom: str
    prenom: str


class UserCreate(UserBase):
    password: str
    role_id: Optional[int] = 5  # Default to 'viewer' role (Observateur)


class UserUpdate(BaseModel):
    email: Optional[str] = None
    nom: Optional[str] = None
    prenom: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserLogin(BaseModel):
    email: str
    password: str


class User(UserBase):
    id: int
    role_id: int
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class UserWithRole(User):
    role_name: str
    role_display_name: str
    permissions: List[str] = []


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# Role and Permission Models
class PermissionBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = ""
    resource: str
    action: str


class Permission(PermissionBase):
    id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class RoleBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = ""
    is_active: bool = True


class RoleCreate(RoleBase):
    permission_ids: List[int] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    permission_ids: Optional[List[int]] = None


class Role(RoleBase):
    id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class RoleWithPermissions(Role):
    permissions: List[Permission] = []


class RolePermissionResponse(BaseModel):
    roles: List[RoleWithPermissions]
    permissions: List[Permission]


# Permission check models
class PermissionCheck(BaseModel):
    resource: str
    action: str


class PermissionCheckResponse(BaseModel):
    has_permission: bool
    message: Optional[str] = None
