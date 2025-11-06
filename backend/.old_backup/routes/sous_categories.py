from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from database import connect
from models import SousCategorie
from auth import get_current_active_user_with_role, require_permission
from pydantic import BaseModel

router = APIRouter()


class SousCategorieCreate(BaseModel):
    nom: str
    description: Optional[str] = ""
    categorie: str


class SousCategorieUpdate(BaseModel):
    nom: Optional[str] = None
    description: Optional[str] = None
    categorie: Optional[str] = None


@router.get("/", response_model=List[SousCategorie])
async def list_sous_categories(
    current_user=Depends(require_permission("categories.read")),
):
    """Get all sous-categories (requires categories.read permission)."""
    conn = await connect()
    try:
        rows = await conn.fetch("SELECT * FROM sous_categories ORDER BY nom")
        return [
            SousCategorie(
                id=row["id"],
                nom=row["nom"],
                description=row["description"] or "",
                categorie=row["categorie"],
            )
            for row in rows
        ]
    finally:
        await conn.close()


@router.post("/", response_model=SousCategorie)
async def create_sous_category(
    sous_category: SousCategorieCreate,
    current_user=Depends(require_permission("categories.create")),
):
    """Create a new sous-category (requires categories.create permission)."""
    conn = await connect()
    try:
        # Check if sous-category already exists
        existing = await conn.fetchrow(
            "SELECT id FROM sous_categories WHERE nom = $1", sous_category.nom
        )
        if existing:
            raise HTTPException(status_code=400, detail="Sous-category already exists")

        # Verify that the parent category exists
        category_exists = await conn.fetchrow(
            "SELECT id FROM categories WHERE nom = $1", sous_category.categorie
        )
        if not category_exists:
            raise HTTPException(
                status_code=400, detail="Parent category does not exist"
            )

        # Insert new sous-category
        row = await conn.fetchrow(
            "INSERT INTO sous_categories (nom, description, categorie) VALUES ($1, $2, $3) RETURNING *",
            sous_category.nom,
            sous_category.description,
            sous_category.categorie,
        )
        return SousCategorie(
            id=row["id"],
            nom=row["nom"],
            description=row["description"] or "",
            categorie=row["categorie"],
        )
    finally:
        await conn.close()


@router.put("/{sous_category_id}", response_model=SousCategorie)
async def update_sous_category(
    sous_category_id: int,
    sous_category: SousCategorieUpdate,
    current_user=Depends(require_permission("categories.update")),
):
    """Update a sous-category (requires categories.update permission)."""
    conn = await connect()
    try:
        # Check if sous-category exists
        existing = await conn.fetchrow(
            "SELECT * FROM sous_categories WHERE id = $1", sous_category_id
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Sous-category not found")

        # Build update query dynamically
        updates = []
        values = []
        counter = 1

        if sous_category.nom is not None:
            updates.append(f"nom = ${counter}")
            values.append(sous_category.nom)
            counter += 1

        if sous_category.description is not None:
            updates.append(f"description = ${counter}")
            values.append(sous_category.description)
            counter += 1

        if sous_category.categorie is not None:
            # Verify that the parent category exists
            category_exists = await conn.fetchrow(
                "SELECT id FROM categories WHERE nom = $1", sous_category.categorie
            )
            if not category_exists:
                raise HTTPException(
                    status_code=400, detail="Parent category does not exist"
                )

            updates.append(f"categorie = ${counter}")
            values.append(sous_category.categorie)
            counter += 1

        if not updates:
            # No changes provided
            return SousCategorie(
                id=existing["id"],
                nom=existing["nom"],
                description=existing["description"] or "",
                categorie=existing["categorie"],
            )

        # Add sous_category_id to values
        values.append(sous_category_id)

        query = f"UPDATE sous_categories SET {', '.join(updates)} WHERE id = ${counter} RETURNING *"
        row = await conn.fetchrow(query, *values)

        return SousCategorie(
            id=row["id"],
            nom=row["nom"],
            description=row["description"] or "",
            categorie=row["categorie"],
        )
    finally:
        await conn.close()


@router.delete("/{sous_category_id}")
async def delete_sous_category(
    sous_category_id: int, current_user=Depends(require_permission("categories.delete"))
):
    """Delete a sous-category (requires categories.delete permission)."""
    conn = await connect()
    try:
        # Check if sous-category exists
        existing = await conn.fetchrow(
            "SELECT id FROM sous_categories WHERE id = $1", sous_category_id
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Sous-category not found")

        # Check if sous-category is being used by articles
        articles_using = await conn.fetchval(
            "SELECT COUNT(*) FROM articles WHERE sous_categorie = (SELECT nom FROM sous_categories WHERE id = $1)",
            sous_category_id,
        )
        if articles_using > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete sous-category: {articles_using} articles are using this sous-category",
            )

        # Delete the sous-category
        await conn.execute(
            "DELETE FROM sous_categories WHERE id = $1", sous_category_id
        )
        return {"message": "Sous-category deleted successfully"}
    finally:
        await conn.close()
