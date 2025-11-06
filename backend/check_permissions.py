import asyncio
import asyncpg


async def check_and_fix_admin_permissions():
    """Check admin permissions and fix if needed."""
    DATABASE_URL = "postgresql://user:password@localhost:5432/gestion_articles"
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        # Get admin user info
        admin = await conn.fetchrow(
            "SELECT * FROM users WHERE email = $1", "admin@example.com"
        )
        print(f'✅ Admin user found: ID {admin["id"]}, Role ID: {admin["role_id"]}')

        # Get admin role info
        role = await conn.fetchrow(
            "SELECT * FROM roles WHERE id = $1", admin["role_id"]
        )
        print(f'✅ Admin role: {role["name"]} ({role["display_name"]})')

        # Get current admin permissions
        current_permissions = await conn.fetch(
            """
            SELECT p.name, p.display_name 
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = $1
            ORDER BY p.name
        """,
            admin["role_id"],
        )

        current_perm_names = [perm["name"] for perm in current_permissions]
        print(f"\n📋 Current admin permissions ({len(current_permissions)}):")
        for perm in current_permissions:
            print(f'  ✓ {perm["name"]}: {perm["display_name"]}')

        # Check if categories.read permission exists
        if "categories.read" not in current_perm_names:
            print(f"\n❌ Missing categories.read permission!")

            # Check if super_admin role should have all permissions
            if role["name"] == "super_admin":
                print("🔧 Fixing super_admin permissions...")

                # Get all permissions
                all_permissions = await conn.fetch("SELECT id FROM permissions")
                print(f"📝 Total permissions in system: {len(all_permissions)}")

                # Delete existing role permissions for super_admin
                await conn.execute(
                    "DELETE FROM role_permissions WHERE role_id = $1", admin["role_id"]
                )

                # Add all permissions to super_admin
                for perm in all_permissions:
                    await conn.execute(
                        """
                        INSERT INTO role_permissions (role_id, permission_id) 
                        VALUES ($1, $2) 
                        ON CONFLICT (role_id, permission_id) DO NOTHING
                    """,
                        admin["role_id"],
                        perm["id"],
                    )

                print("✅ Super admin permissions updated!")

                # Verify the fix
                new_permissions = await conn.fetch(
                    """
                    SELECT p.name 
                    FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permission_id
                    WHERE rp.role_id = $1
                    ORDER BY p.name
                """,
                    admin["role_id"],
                )

                print(f"✅ Admin now has {len(new_permissions)} permissions")

                # Check for specific permissions
                new_perm_names = [perm["name"] for perm in new_permissions]
                critical_permissions = [
                    "categories.read",
                    "categories.create",
                    "categories.update",
                    "categories.delete",
                ]

                for critical_perm in critical_permissions:
                    if critical_perm in new_perm_names:
                        print(f"  ✅ {critical_perm} - Available")
                    else:
                        print(f"  ❌ {critical_perm} - Missing")
        else:
            print(f"\n✅ categories.read permission is already available!")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(check_and_fix_admin_permissions())
