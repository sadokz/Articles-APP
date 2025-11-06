from datetime import timedelta, datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from models import (
    User,
    UserCreate,
    UserUpdate,
    UserLogin,
    Token,
    UserWithRole,
    Role,
    RoleCreate,
    RoleUpdate,
    RoleWithPermissions,
    Permission,
    RolePermissionResponse,
    PermissionCheck,
    PermissionCheckResponse,
)
from auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    get_current_active_user,
    get_current_active_user_with_role,
    get_user_by_email,
    require_permission,
    require_any_permission,
    check_user_permission,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from database import connect

router = APIRouter()


@router.post("/register", response_model=User)
async def register_user(user: UserCreate):
    """Register a new user."""
    # Check if user already exists
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Hash password and create user
    hashed_password = get_password_hash(user.password)

    # Always set new users to viewer role (ID 5) for security
    viewer_role_id = 5

    conn = await connect()
    try:
        result = await conn.fetchrow(
            """
            INSERT INTO users (email, nom, prenom, hashed_password, role_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, nom, prenom, role_id, is_active, created_at, updated_at
            """,
            user.email,
            user.nom,
            user.prenom,
            hashed_password,
            viewer_role_id,
        )

        return User(
            id=result["id"],
            email=result["email"],
            nom=result["nom"],
            prenom=result["prenom"],
            role_id=result["role_id"],
            is_active=result["is_active"],
            created_at=str(result["created_at"]) if result["created_at"] else None,
            updated_at=str(result["updated_at"]) if result["updated_at"] else None,
        )
    finally:
        await conn.close()


@router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin):
    """Login user and return access token."""
    user = await authenticate_user(user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserWithRole)
async def read_users_me(
    current_user: UserWithRole = Depends(get_current_active_user_with_role),
):
    """Get current user information with role and permissions."""
    return current_user


@router.get("/users", response_model=List[UserWithRole])
async def get_all_users(
    current_user: UserWithRole = Depends(require_permission("users.read")),
):
    """Get all users with their roles (requires users.read permission)."""
    conn = await connect()
    try:
        results = await conn.fetch(
            """
            SELECT u.id, u.email, u.nom, u.prenom, u.role_id, u.is_active, 
                   u.created_at, u.updated_at, r.name as role_name, 
                   r.display_name as role_display_name
            FROM users u 
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.id
            """
        )

        users = []
        for row in results:
            # Get user permissions
            permissions = await conn.fetch(
                """
                SELECT p.name 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = $1
                """,
                row["role_id"],
            )

            users.append(
                UserWithRole(
                    id=row["id"],
                    email=row["email"],
                    nom=row["nom"],
                    prenom=row["prenom"],
                    role_id=row["role_id"],
                    is_active=row["is_active"],
                    role_name=row["role_name"],
                    role_display_name=row["role_display_name"],
                    permissions=[perm["name"] for perm in permissions],
                    created_at=str(row["created_at"]) if row["created_at"] else None,
                    updated_at=str(row["updated_at"]) if row["updated_at"] else None,
                )
            )

        return users
    finally:
        await conn.close()


@router.put("/users/{user_id}", response_model=UserWithRole)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: UserWithRole = Depends(require_permission("users.update")),
):
    """Update a user (requires users.update permission)."""
    # Prevent non-super-admins from modifying super-admin users
    if current_user.role_name != "super_admin":
        conn = await connect()
        try:
            target_user = await conn.fetchrow(
                "SELECT role_id FROM users WHERE id = $1", user_id
            )
            if target_user:
                target_role = await conn.fetchrow(
                    "SELECT name FROM roles WHERE id = $1", target_user["role_id"]
                )
                if target_role and target_role["name"] == "super_admin":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Cannot modify super admin users",
                    )
        finally:
            await conn.close()

    conn = await connect()
    try:
        # Build dynamic update query
        update_fields = []
        values = []
        param_count = 1

        if user_update.email is not None:
            update_fields.append(f"email = ${param_count}")
            values.append(user_update.email)
            param_count += 1

        if user_update.nom is not None:
            update_fields.append(f"nom = ${param_count}")
            values.append(user_update.nom)
            param_count += 1

        if user_update.prenom is not None:
            update_fields.append(f"prenom = ${param_count}")
            values.append(user_update.prenom)
            param_count += 1

        if user_update.role_id is not None:
            update_fields.append(f"role_id = ${param_count}")
            values.append(user_update.role_id)
            param_count += 1

        if user_update.is_active is not None:
            update_fields.append(f"is_active = ${param_count}")
            values.append(user_update.is_active)
            param_count += 1

        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
            )

        update_fields.append(f"updated_at = ${param_count}")
        values.append(datetime.utcnow())
        param_count += 1

        values.append(user_id)

        query = f"""
            UPDATE users 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
            RETURNING id, email, nom, prenom, role_id, is_active, created_at, updated_at
        """

        result = await conn.fetchrow(query, *values[:-1], user_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Get role information
        role_info = await conn.fetchrow(
            "SELECT name, display_name FROM roles WHERE id = $1", result["role_id"]
        )

        # Get permissions
        permissions = await conn.fetch(
            """
            SELECT p.name 
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = $1
            """,
            result["role_id"],
        )

        return UserWithRole(
            id=result["id"],
            email=result["email"],
            nom=result["nom"],
            prenom=result["prenom"],
            role_id=result["role_id"],
            is_active=result["is_active"],
            role_name=role_info["name"] if role_info else "",
            role_display_name=role_info["display_name"] if role_info else "",
            permissions=[perm["name"] for perm in permissions],
            created_at=str(result["created_at"]) if result["created_at"] else None,
            updated_at=str(result["updated_at"]) if result["updated_at"] else None,
        )
    finally:
        await conn.close()


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: UserWithRole = Depends(require_permission("users.delete")),
):
    """Delete a user (requires users.delete permission)."""
    # Prevent deletion of super admin users and self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    conn = await connect()
    try:
        # Check if target user is super admin
        target_user = await conn.fetchrow(
            """
            SELECT u.id, r.name as role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = $1
            """,
            user_id,
        )

        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        if (
            target_user["role_name"] == "super_admin"
            and current_user.role_name != "super_admin"
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete super admin users",
            )

        await conn.execute("DELETE FROM users WHERE id = $1", user_id)
        return {"message": "User deleted successfully"}
    finally:
        await conn.close()


# Role Management Endpoints


@router.get("/roles", response_model=RolePermissionResponse)
async def get_roles_and_permissions(
    current_user: UserWithRole = Depends(require_permission("roles.read")),
):
    """Get all roles with their permissions and all available permissions."""
    conn = await connect()
    try:
        # Get all roles
        roles_data = await conn.fetch(
            "SELECT id, name, display_name, description, is_active, created_at FROM roles ORDER BY id"
        )

        # Get all permissions
        permissions_data = await conn.fetch(
            "SELECT id, name, display_name, description, resource, action, created_at FROM permissions ORDER BY resource, action"
        )

        roles = []
        for role_row in roles_data:
            # Get permissions for this role
            role_permissions = await conn.fetch(
                """
                SELECT p.id, p.name, p.display_name, p.description, p.resource, p.action, p.created_at
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = $1
                ORDER BY p.resource, p.action
                """,
                role_row["id"],
            )

            roles.append(
                RoleWithPermissions(
                    id=role_row["id"],
                    name=role_row["name"],
                    display_name=role_row["display_name"],
                    description=role_row["description"] or "",
                    is_active=role_row["is_active"],
                    created_at=(
                        str(role_row["created_at"]) if role_row["created_at"] else None
                    ),
                    permissions=[
                        Permission(
                            id=perm["id"],
                            name=perm["name"],
                            display_name=perm["display_name"],
                            description=perm["description"] or "",
                            resource=perm["resource"],
                            action=perm["action"],
                            created_at=(
                                str(perm["created_at"]) if perm["created_at"] else None
                            ),
                        )
                        for perm in role_permissions
                    ],
                )
            )

        permissions = [
            Permission(
                id=perm["id"],
                name=perm["name"],
                display_name=perm["display_name"],
                description=perm["description"] or "",
                resource=perm["resource"],
                action=perm["action"],
                created_at=str(perm["created_at"]) if perm["created_at"] else None,
            )
            for perm in permissions_data
        ]

        return RolePermissionResponse(roles=roles, permissions=permissions)
    finally:
        await conn.close()


@router.post("/roles", response_model=RoleWithPermissions)
async def create_role(
    role: RoleCreate,
    current_user: UserWithRole = Depends(require_permission("roles.create")),
):
    """Create a new role with permissions."""
    conn = await connect()
    try:
        # Create role
        role_result = await conn.fetchrow(
            """
            INSERT INTO roles (name, display_name, description, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, display_name, description, is_active, created_at
            """,
            role.name,
            role.display_name,
            role.description,
            role.is_active,
        )

        # Assign permissions to role
        if role.permission_ids:
            for perm_id in role.permission_ids:
                await conn.execute(
                    "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
                    role_result["id"],
                    perm_id,
                )

        # Get assigned permissions
        permissions = await conn.fetch(
            """
            SELECT p.id, p.name, p.display_name, p.description, p.resource, p.action, p.created_at
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = $1
            """,
            role_result["id"],
        )

        return RoleWithPermissions(
            id=role_result["id"],
            name=role_result["name"],
            display_name=role_result["display_name"],
            description=role_result["description"] or "",
            is_active=role_result["is_active"],
            created_at=(
                str(role_result["created_at"]) if role_result["created_at"] else None
            ),
            permissions=[
                Permission(
                    id=perm["id"],
                    name=perm["name"],
                    display_name=perm["display_name"],
                    description=perm["description"] or "",
                    resource=perm["resource"],
                    action=perm["action"],
                    created_at=str(perm["created_at"]) if perm["created_at"] else None,
                )
                for perm in permissions
            ],
        )
    except Exception as e:
        if "unique constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create role",
        )
    finally:
        await conn.close()


@router.put("/roles/{role_id}", response_model=RoleWithPermissions)
async def update_role(
    role_id: int,
    role_update: RoleUpdate,
    current_user: UserWithRole = Depends(require_permission("roles.update")),
):
    """Update a role and its permissions."""
    conn = await connect()
    try:
        # Check if role exists
        existing_role = await conn.fetchrow(
            "SELECT * FROM roles WHERE id = $1", role_id
        )
        if not existing_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
            )

        # Build update query
        update_fields = []
        values = []
        param_count = 1

        if role_update.name is not None:
            update_fields.append(f"name = ${param_count}")
            values.append(role_update.name)
            param_count += 1

        if role_update.display_name is not None:
            update_fields.append(f"display_name = ${param_count}")
            values.append(role_update.display_name)
            param_count += 1

        if role_update.description is not None:
            update_fields.append(f"description = ${param_count}")
            values.append(role_update.description)
            param_count += 1

        if role_update.is_active is not None:
            update_fields.append(f"is_active = ${param_count}")
            values.append(role_update.is_active)
            param_count += 1

        if update_fields:
            values.append(role_id)
            query = f"""
                UPDATE roles 
                SET {', '.join(update_fields)}
                WHERE id = ${param_count}
                RETURNING id, name, display_name, description, is_active, created_at
            """
            role_result = await conn.fetchrow(query, *values)
        else:
            role_result = existing_role

        # Update permissions if provided
        if role_update.permission_ids is not None:
            # Remove existing permissions
            await conn.execute(
                "DELETE FROM role_permissions WHERE role_id = $1", role_id
            )

            # Add new permissions
            for perm_id in role_update.permission_ids:
                await conn.execute(
                    "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
                    role_id,
                    perm_id,
                )

        # Get current permissions
        permissions = await conn.fetch(
            """
            SELECT p.id, p.name, p.display_name, p.description, p.resource, p.action, p.created_at
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = $1
            """,
            role_id,
        )

        return RoleWithPermissions(
            id=role_result["id"],
            name=role_result["name"],
            display_name=role_result["display_name"],
            description=role_result["description"] or "",
            is_active=role_result["is_active"],
            created_at=(
                str(role_result["created_at"]) if role_result["created_at"] else None
            ),
            permissions=[
                Permission(
                    id=perm["id"],
                    name=perm["name"],
                    display_name=perm["display_name"],
                    description=perm["description"] or "",
                    resource=perm["resource"],
                    action=perm["action"],
                    created_at=str(perm["created_at"]) if perm["created_at"] else None,
                )
                for perm in permissions
            ],
        )
    finally:
        await conn.close()


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    current_user: UserWithRole = Depends(require_permission("roles.delete")),
):
    """Delete a role (prevents deletion of system roles)."""
    conn = await connect()
    try:
        # Check if role exists and is deletable
        role = await conn.fetchrow("SELECT name FROM roles WHERE id = $1", role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
            )

        # Prevent deletion of system roles
        system_roles = ["super_admin", "admin"]
        if role["name"] in system_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete system roles",
            )

        # Check if role is assigned to users
        user_count = await conn.fetchrow(
            "SELECT COUNT(*) as count FROM users WHERE role_id = $1", role_id
        )
        if user_count["count"] > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete role assigned to users",
            )

        await conn.execute("DELETE FROM roles WHERE id = $1", role_id)
        return {"message": "Role deleted successfully"}
    finally:
        await conn.close()


@router.post("/check-permission", response_model=PermissionCheckResponse)
async def check_permission_endpoint(
    permission_check: PermissionCheck,
    current_user: UserWithRole = Depends(get_current_active_user_with_role),
):
    """Check if current user has a specific permission."""
    permission_name = f"{permission_check.resource}.{permission_check.action}"
    has_permission = permission_name in current_user.permissions

    return PermissionCheckResponse(
        has_permission=has_permission,
        message=f"Permission '{permission_name}' {'granted' if has_permission else 'denied'}",
    )
