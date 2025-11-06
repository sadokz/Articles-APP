from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes import articles, categories, sous_categories, auth

app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(articles.router, prefix="/api/articles", tags=["Articles"])
app.include_router(categories.router, prefix="/api/categories", tags=["Catégories"])
app.include_router(
    sous_categories.router, prefix="/api/sous-categories", tags=["Sous-catégories"]
)


@app.on_event("startup")
async def startup():
    await init_db()
