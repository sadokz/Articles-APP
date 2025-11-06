import asyncio
import bcrypt
import asyncpg
import os


async def reset_admin_password():
    # Hash the password
    password = "admin123"
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    print(f"New hashed password: {hashed_password}")

    # Connect to database
    DATABASE_URL = "postgresql://user:password@localhost:5432/gestion_articles"
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        # Update admin password
        result = await conn.execute(
            "UPDATE users SET hashed_password = $1 WHERE email = $2",
            hashed_password,
            "admin@example.com",
        )
        print(f"Password updated! {result}")

        # Verify the update
        user = await conn.fetchrow(
            "SELECT id, nom, email FROM users WHERE email = $1", "admin@example.com"
        )
        print(f"Admin user: {user}")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(reset_admin_password())
