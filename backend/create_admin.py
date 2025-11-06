import asyncio
import asyncpg
import os
from auth import get_password_hash


async def create_admin_user():
    """Create the admin user if it doesn't exist."""
    DATABASE_URL = "postgresql://user:password@localhost:5432/gestion_articles"

    try:
        # First, try to create the database
        # Connect to default postgres database first
        conn = await asyncpg.connect(
            "postgresql://user:password@localhost:5432/postgres"
        )
        try:
            # Check if database exists
            result = await conn.fetchrow(
                "SELECT datname FROM pg_catalog.pg_database WHERE datname = 'gestion_articles'"
            )
            if not result:
                await conn.execute("CREATE DATABASE gestion_articles")
                print("✅ Created database 'gestion_articles'")
            else:
                print("✅ Database 'gestion_articles' already exists")
        except Exception as e:
            print(f"❌ Error creating database: {e}")
        finally:
            await conn.close()

        # Now connect to the actual database
        conn = await asyncpg.connect(DATABASE_URL)

        try:
            # Initialize database tables first
            from database import init_db

            print("🔄 Initializing database tables...")
            await init_db()
            print("✅ Database tables initialized")

            # Check if admin user already exists
            existing_admin = await conn.fetchrow(
                "SELECT id, email FROM users WHERE email = $1", "admin@example.com"
            )

            if existing_admin:
                print(f"✅ Admin user already exists with ID: {existing_admin['id']}")
                return

            # Get the super_admin role ID
            super_admin_role = await conn.fetchrow(
                "SELECT id FROM roles WHERE name = $1", "super_admin"
            )

            if not super_admin_role:
                print(
                    "❌ Super admin role not found. Make sure database is properly initialized."
                )
                return

            # Hash the admin password
            hashed_password = get_password_hash("admin123")

            # Create admin user
            result = await conn.fetchrow(
                """
                INSERT INTO users (email, nom, prenom, hashed_password, role_id, is_active)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, email, nom, prenom
                """,
                "admin@example.com",
                "Admin",
                "User",
                hashed_password,
                super_admin_role["id"],
                True,
            )

            print(f"✅ Admin user created successfully!")
            print(f"   - ID: {result['id']}")
            print(f"   - Email: {result['email']}")
            print(f"   - Name: {result['nom']} {result['prenom']}")
            print(f"   - Password: admin123")

        finally:
            await conn.close()

    except asyncpg.InvalidCatalogNameError:
        print("❌ Database 'gestion_articles' does not exist. Creating it...")
        # Create database if it doesn't exist
        conn = await asyncpg.connect(
            "postgresql://user:password@localhost:5432/postgres"
        )
        try:
            await conn.execute("CREATE DATABASE gestion_articles")
            print("✅ Database created successfully")
        finally:
            await conn.close()

        # Retry the admin user creation
        await create_admin_user()

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(create_admin_user())
