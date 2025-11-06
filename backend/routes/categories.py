from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from database import connect
from models import Categorie
from auth import get_current_active_user_with_role, require_permission
from pydantic import BaseModel

router = APIRouter()


class CategorieCreate(BaseModel):
    nom: str
    description: Optional[str] = ""


class CategorieUpdate(BaseModel):
    nom: Optional[str] = None
    description: Optional[str] = None


@router.get("/", response_model=List[Categorie])
async def list_categories(current_user=Depends(require_permission("categories.read"))):
    """Get all categories (requires categories.read permission)."""
    conn = await connect()
    try:
        rows = await conn.fetch("SELECT * FROM categories ORDER BY nom")
        return [
            Categorie(
                id=row["id"], nom=row["nom"], description=row["description"] or ""
            )
            for row in rows
        ]
    finally:
        await conn.close()


@router.post("/", response_model=Categorie)
async def create_category(
    category: CategorieCreate,
    current_user=Depends(require_permission("categories.create")),
):
    """Create a new category (requires categories.create permission)."""
    conn = await connect()
    try:
        # Check if category already exists
        existing = await conn.fetchrow(
            "SELECT id FROM categories WHERE nom = $1", category.nom
        )
        if existing:
            raise HTTPException(status_code=400, detail="Category already exists")

        # Insert new category
        row = await conn.fetchrow(
            "INSERT INTO categories (nom, description) VALUES ($1, $2) RETURNING *",
            category.nom,
            category.description,
        )
        return Categorie(
            id=row["id"], nom=row["nom"], description=row["description"] or ""
        )
    finally:
        await conn.close()


@router.put("/{category_id}", response_model=Categorie)
async def update_category(
    category_id: int,
    category: CategorieUpdate,
    current_user=Depends(require_permission("categories.update")),
):
    """Update a category (requires categories.update permission)."""
    conn = await connect()
    try:
        # Check if category exists
        existing = await conn.fetchrow(
            "SELECT * FROM categories WHERE id = $1", category_id
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")

        # Build update query dynamically
        updates = []
        values = []
        counter = 1

        if category.nom is not None:
            updates.append(f"nom = ${counter}")
            values.append(category.nom)
            counter += 1

        if category.description is not None:
            updates.append(f"description = ${counter}")
            values.append(category.description)
            counter += 1

        if not updates:
            # No changes provided
            return Categorie(
                id=existing["id"],
                nom=existing["nom"],
                description=existing["description"] or "",
            )

        # Add category_id to values
        values.append(category_id)

        query = f"UPDATE categories SET {', '.join(updates)} WHERE id = ${counter} RETURNING *"
        row = await conn.fetchrow(query, *values)

        return Categorie(
            id=row["id"], nom=row["nom"], description=row["description"] or ""
        )
    finally:
        await conn.close()


@router.delete("/{category_id}")
async def delete_category(
    category_id: int, current_user=Depends(require_permission("categories.delete"))
):
    """Delete a category (requires categories.delete permission)."""
    conn = await connect()
    try:
        # Check if category exists
        existing = await conn.fetchrow(
            "SELECT id FROM categories WHERE id = $1", category_id
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")

        # Check if category is being used by articles
        articles_using = await conn.fetchval(
            "SELECT COUNT(*) FROM articles WHERE categorie = (SELECT nom FROM categories WHERE id = $1)",
            category_id,
        )
        if articles_using > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete category: {articles_using} articles are using this category",
            )

        # Delete the category
        await conn.execute("DELETE FROM categories WHERE id = $1", category_id)
        return {"message": "Category deleted successfully"}
    finally:
        await conn.close()
