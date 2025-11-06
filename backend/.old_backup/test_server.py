#!/usr/bin/env python3
import os
import sys
import uvicorn

# Set environment variables
os.environ["DATABASE_URL"] = (
    "postgresql://user:password@localhost:5432/gestion_articles"
)
os.environ["SECRET_KEY"] = "your-secret-key-change-in-production"

print("Starting FastAPI server...")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"DATABASE_URL: {os.environ.get('DATABASE_URL')}")

try:
    from main import app

    print("✅ Main app imported successfully")

    # Test database connection
    import asyncio
    from database import init_db

    async def test_init():
        await init_db()
        print("✅ Database initialized successfully")

    asyncio.run(test_init())

    print("🚀 Starting server on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback

    traceback.print_exc()
