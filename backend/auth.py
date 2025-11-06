import os
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models import TokenData, User, UserWithRole
from database import connect

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email from database."""
    conn = await connect()
    try:
        result = await conn.fetchrow(
            """
            SELECT u.id, u.email, u.nom, u.prenom, u.hashed_password, u.is_active, 
                   u.role_id, u.created_at, u.updated_at
            FROM users u 
            WHERE u.email = $1
            """,
            email,
        )
        return dict(result) if result else None
    finally:
        await conn.close()


async def get_user_with_role(email: str) -> Optional[dict]:
    """Get user with role and permissions from database."""
    conn = await connect()
    try:
        result = await conn.fetchrow(
            """
            SELECT u.id, u.email, u.nom, u.prenom, u.hashed_password, u.is_active, 
                   u.role_id, u.created_at, u.updated_at, r.name as role_name, 
                   r.display_name as role_display_name
            FROM users u 
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = $1
            """,
            email,
        )

        if not result:
            return None

        user_data = dict(result)

        # Get user permissions
        permissions = await conn.fetch(
            """
            SELECT p.name 
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = $1
            """,
            user_data["role_id"],
        )

        user_data["permissions"] = [perm["name"] for perm in permissions]
        return user_data
    finally:
        await conn.close()


async def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Authenticate user with email and password."""
    user = await get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """Get current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = await get_user_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception

    return User(
        id=user["id"],
        email=user["email"],
        nom=user["nom"],
        prenom=user["prenom"],
        role_id=user["role_id"],
        is_active=user["is_active"],
        created_at=str(user["created_at"]) if user["created_at"] else None,
        updated_at=str(user["updated_at"]) if user["updated_at"] else None,
    )


async def get_current_user_with_role(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserWithRole:
    """Get current user with role and permissions from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = await get_user_with_role(email=token_data.email)
    if user is None:
        raise credentials_exception

    return UserWithRole(
        id=user["id"],
        email=user["email"],
        nom=user["nom"],
        prenom=user["prenom"],
        role_id=user["role_id"],
        is_active=user["is_active"],
        role_name=user["role_name"],
        role_display_name=user["role_display_name"],
        permissions=user["permissions"],
        created_at=str(user["created_at"]) if user["created_at"] else None,
        updated_at=str(user["updated_at"]) if user["updated_at"] else None,
    )


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_active_user_with_role(
    current_user: UserWithRole = Depends(get_current_user_with_role),
) -> UserWithRole:
    """Get current active user with role."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_permission(permission: str):
    """Dependency factory for requiring specific permissions."""

    async def permission_check(
        current_user: UserWithRole = Depends(get_current_active_user_with_role),
    ) -> UserWithRole:
        if permission not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required",
            )
        return current_user

    return permission_check


def require_any_permission(permissions: List[str]):
    """Dependency factory for requiring any of the specified permissions."""

    async def permission_check(
        current_user: UserWithRole = Depends(get_current_active_user_with_role),
    ) -> UserWithRole:
        if not any(perm in current_user.permissions for perm in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these permissions required: {', '.join(permissions)}",
            )
        return current_user

    return permission_check


def require_role(role_name: str):
    """Dependency factory for requiring specific role."""

    async def role_check(
        current_user: UserWithRole = Depends(get_current_active_user_with_role),
    ) -> UserWithRole:
        if current_user.role_name != role_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role_name}' required",
            )
        return current_user

    return role_check


async def check_user_permission(user_id: int, permission: str) -> bool:
    """Check if a user has a specific permission."""
    conn = await connect()
    try:
        result = await conn.fetchrow(
            """
            SELECT COUNT(*) as count
            FROM users u
            JOIN role_permissions rp ON u.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE u.id = $1 AND p.name = $2 AND u.is_active = TRUE
            """,
            user_id,
            permission,
        )
        return result["count"] > 0 if result else False
    finally:
        await conn.close()
