from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes import articles, categories, sous_categories, auth
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Initialize FastAPI app
app = FastAPI()

# CORS configuration
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(articles.router, prefix="/api/articles", tags=["Articles"])
app.include_router(categories.router, prefix="/api/categories", tags=["Catégories"])
app.include_router(
    sous_categories.router, prefix="/api/sous-categories", tags=["Sous-catégories"]
)

# Initialize database on startup
@app.on_event("startup")
async def startup():
    await init_db()

# Serve React frontend (if build exists)
frontend_dir = os.path.join(os.path.dirname(__file__), "../frontend/dist")

if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {"detail": "Frontend build not found"}