import asyncio
import bcrypt
import asyncpg
from auth import verify_password, authenticate_user, get_user_by_email


async def debug_get_user_by_email():
    """Debug the get_user_by_email function specifically"""
    print("\n=== Debugging get_user_by_email function ===")

    try:
        # Import and test the database connection from auth.py
        from database import connect

        print("✅ Imported database.connect successfully")

        # Test database connection
        conn = await connect()
        print("✅ Database connection successful")

        # Test the exact query from get_user_by_email
        result = await conn.fetchrow(
            """
            SELECT u.id, u.email, u.nom, u.prenom, u.hashed_password, u.is_active, 
                   u.role_id, u.created_at, u.updated_at
            FROM users u 
            WHERE u.email = $1
            """,
            "admin@example.com",
        )

        if result:
            print(f"✅ Direct query successful: {dict(result)}")
        else:
            print("❌ Direct query returned no results")

        await conn.close()

        # Now test the actual get_user_by_email function
        user_result = await get_user_by_email("admin@example.com")
        if user_result:
            print(f"✅ get_user_by_email function successful: {user_result}")
        else:
            print("❌ get_user_by_email function returned None")

    except Exception as e:
        print(f"❌ Error in get_user_by_email debugging: {e}")
        import traceback

        traceback.print_exc()


async def debug_login():
    print("=== Debugging Login Process ===")

    # Test database connection
    DATABASE_URL = "postgresql://user:password@localhost:5432/gestion_articles"
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        # Get admin user from database
        user = await conn.fetchrow(
            "SELECT id, email, nom, prenom, hashed_password, is_active FROM users WHERE email = $1",
            "admin@example.com",
        )

        if not user:
            print("❌ Admin user not found in database")
            return

        print(f"✅ Found admin user: {user['email']}")
        print(f"   - ID: {user['id']}")
        print(f"   - Name: {user['nom']} {user['prenom']}")
        print(f"   - Active: {user['is_active']}")
        print(
            f"   - Hashed password (first 50 chars): {user['hashed_password'][:50]}..."
        )

        # Test password verification
        test_password = "admin123"
        print(f"\n--- Testing password verification ---")
        print(f"Testing password: '{test_password}'")

        # Method 1: Direct bcrypt check
        try:
            is_valid_bcrypt = bcrypt.checkpw(
                test_password.encode("utf-8"), user["hashed_password"].encode("utf-8")
            )
            print(f"✅ Direct bcrypt check: {is_valid_bcrypt}")
        except Exception as e:
            print(f"❌ Direct bcrypt check failed: {e}")

        # Method 2: Using passlib (from auth.py)
        try:
            is_valid_passlib = verify_password(test_password, user["hashed_password"])
            print(f"✅ Passlib verification: {is_valid_passlib}")
        except Exception as e:
            print(f"❌ Passlib verification failed: {e}")

        # Method 3: Test get_user_by_email function separately
        try:
            user_from_auth = await get_user_by_email("admin@example.com")
            if user_from_auth:
                print(f"✅ get_user_by_email: SUCCESS")
                print(f"   - Retrieved user ID: {user_from_auth['id']}")
                print(f"   - Email: {user_from_auth['email']}")
                print(f"   - Active: {user_from_auth['is_active']}")

                # Test password verification with user from auth function
                is_valid_auth_user = verify_password(
                    test_password, user_from_auth["hashed_password"]
                )
                print(f"   - Password verification: {is_valid_auth_user}")
            else:
                print(f"❌ get_user_by_email: FAILED")
        except Exception as e:
            print(f"❌ get_user_by_email error: {e}")

        # Method 4: Full authentication function
        try:
            auth_result = await authenticate_user("admin@example.com", test_password)
            if auth_result:
                print(f"✅ Full authentication: SUCCESS")
                print(f"   - Returned user ID: {auth_result['id']}")
            else:
                print(f"❌ Full authentication: FAILED")
        except Exception as e:
            print(f"❌ Full authentication error: {e}")

    finally:
        await conn.close()

    # Debug get_user_by_email separately
    await debug_get_user_by_email()


if __name__ == "__main__":
    asyncio.run(debug_login())
