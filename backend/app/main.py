"""Main FastAPI application."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import articles, categories, sous_categories, auth

# Initialize FastAPI app
app = FastAPI(
    title="Articles Management API",
    description="Backend API for Articles Management Application",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(articles.router, prefix="/api/articles", tags=["Articles"])
app.include_router(categories.router, prefix="/api/categories", tags=["Catégories"])
app.include_router(
    sous_categories.router,
    prefix="/api/sous-categories",
    tags=["Sous-catégories"],
)


# Initialize database on startup
@app.on_event("startup")
async def startup():
    """Initialize database on application startup."""
    await init_db()


# Serve React frontend (if build exists)
frontend_dir = os.path.join(os.path.dirname(__file__), settings.FRONTEND_DIR)

if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
else:

    @app.get("/")
    async def root():
        return {"detail": "Frontend build not found"}
