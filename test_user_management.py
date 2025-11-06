#!/usr/bin/env python3
"""
Test script for User Management functionality
"""
import asyncio
import asyncpg
import os


async def test_user_management():
    """Test the user management database setup"""

    # Database connection
    DATABASE_URL = "postgresql://user:password@localhost:5432/gestion_articles"

    try:
        conn = await asyncpg.connect(DATABASE_URL)

        print("✅ Database connection successful")

        # Test 1: Check if tables exist
        tables = await conn.fetch(
            """
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'roles', 'permissions', 'role_permissions')
            ORDER BY table_name
        """
        )

        expected_tables = {"users", "roles", "permissions", "role_permissions"}
        found_tables = {row["table_name"] for row in tables}

        if expected_tables.issubset(found_tables):
            print("✅ All required tables exist")
        else:
            missing = expected_tables - found_tables
            print(f"❌ Missing tables: {missing}")
            return

        # Test 2: Check roles
        roles = await conn.fetch("SELECT name, display_name FROM roles ORDER BY id")
        print(f"✅ Found {len(roles)} roles:")
        for role in roles:
            print(f"   - {role['name']}: {role['display_name']}")

        # Test 3: Check permissions
        permissions = await conn.fetch("SELECT COUNT(*) as count FROM permissions")
        print(f"✅ Found {permissions[0]['count']} permissions")

        # Test 4: Check users
        users = await conn.fetch(
            """
            SELECT u.email, u.nom, u.prenom, r.name as role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            ORDER BY u.id
        """
        )
        print(f"✅ Found {len(users)} users:")
        for user in users:
            print(
                f"   - {user['email']} ({user['prenom']} {user['nom']}) - Role: {user['role_name']}"
            )

        # Test 5: Check role permissions
        role_perms = await conn.fetch(
            """
            SELECT r.name as role_name, COUNT(rp.permission_id) as perm_count
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            GROUP BY r.id, r.name
            ORDER BY r.id
        """
        )
        print("✅ Role permissions:")
        for rp in role_perms:
            print(f"   - {rp['role_name']}: {rp['perm_count']} permissions")

        await conn.close()
        print("\n🎉 User management system is properly configured!")

    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(test_user_management())
