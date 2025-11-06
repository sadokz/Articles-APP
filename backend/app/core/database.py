"""Database connection and initialization."""

import asyncpg
from app.core.config import settings


async def get_db():
    """Get database connection."""
    return await asyncpg.connect(settings.DATABASE_URL)


async def init_db():
    """Initialize database tables and seed data."""
    conn = await get_db()

    # Create tables
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            description TEXT DEFAULT '',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS permissions (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            description TEXT DEFAULT '',
            resource TEXT NOT NULL,
            action TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS role_permissions (
            id SERIAL PRIMARY KEY,
            role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
            permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
            granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(role_id, permission_id)
        );
        
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            nom TEXT NOT NULL,
            description TEXT DEFAULT ''
        );
        
        CREATE TABLE IF NOT EXISTS sous_categories (
            id SERIAL PRIMARY KEY,
            nom TEXT NOT NULL,
            description TEXT DEFAULT '',
            categorie TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS articles (
            id SERIAL PRIMARY KEY,
            titre TEXT,
            prix FLOAT,
            unite TEXT,
            description TEXT,
            categorie TEXT,
            sous_categorie TEXT,
            date_rappel TEXT,
            piece_jointe TEXT
        );
        
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            hashed_password TEXT NOT NULL,
            role_id INTEGER REFERENCES roles(id) DEFAULT 2,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    # Add columns if they don't exist (for existing databases)
    for alter_sql in [
        "ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id) DEFAULT 2",
        "ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE categories ADD COLUMN description TEXT DEFAULT ''",
        "ALTER TABLE sous_categories ADD COLUMN description TEXT DEFAULT ''",
    ]:
        try:
            await conn.execute(alter_sql)
        except Exception:
            pass  # Column already exists

    # Seed default roles
    existing_roles = await conn.fetch("SELECT COUNT(*) FROM roles")
    if existing_roles[0][0] == 0:
        await conn.execute(
            """
            INSERT INTO roles (name, display_name, description) VALUES 
            ('super_admin', 'Super Administrateur', 'Accès complet au système avec gestion des utilisateurs et des rôles'),
            ('admin', 'Administrateur', 'Accès complet aux articles, catégories et gestion d''équipe'),
            ('manager', 'Gestionnaire', 'Peut gérer les articles et catégories, accès en lecture aux utilisateurs'),
            ('editor', 'Éditeur', 'Peut créer et modifier des articles, accès en lecture aux catégories'),
            ('viewer', 'Observateur', 'Accès en lecture seule à tous les contenus'),
            ('inactive', 'Inactif', 'Compte désactivé, aucun accès')
            """
        )

    # Seed default permissions
    existing_permissions = await conn.fetch("SELECT COUNT(*) FROM permissions")
    if existing_permissions[0][0] == 0:
        await conn.execute(
            """
            INSERT INTO permissions (name, display_name, description, resource, action) VALUES 
            ('articles.read', 'Lire Articles', 'Voir les articles', 'articles', 'read'),
            ('articles.create', 'Créer Articles', 'Créer de nouveaux articles', 'articles', 'create'),
            ('articles.update', 'Modifier Articles', 'Modifier les articles existants', 'articles', 'update'),
            ('articles.delete', 'Supprimer Articles', 'Supprimer des articles', 'articles', 'delete'),
            ('articles.export', 'Exporter Articles', 'Exporter les données des articles', 'articles', 'export'),
            ('categories.read', 'Lire Catégories', 'Voir les catégories', 'categories', 'read'),
            ('categories.create', 'Créer Catégories', 'Créer de nouvelles catégories', 'categories', 'create'),
            ('categories.update', 'Modifier Catégories', 'Modifier les catégories existantes', 'categories', 'update'),
            ('categories.delete', 'Supprimer Catégories', 'Supprimer des catégories', 'categories', 'delete'),
            ('users.read', 'Lire Utilisateurs', 'Voir la liste des utilisateurs', 'users', 'read'),
            ('users.create', 'Créer Utilisateurs', 'Créer de nouveaux utilisateurs', 'users', 'create'),
            ('users.update', 'Modifier Utilisateurs', 'Modifier les utilisateurs existants', 'users', 'update'),
            ('users.delete', 'Supprimer Utilisateurs', 'Supprimer des utilisateurs', 'users', 'delete'),
            ('roles.read', 'Lire Rôles', 'Voir les rôles et permissions', 'roles', 'read'),
            ('roles.create', 'Créer Rôles', 'Créer de nouveaux rôles', 'roles', 'create'),
            ('roles.update', 'Modifier Rôles', 'Modifier les rôles existants', 'roles', 'update'),
            ('roles.delete', 'Supprimer Rôles', 'Supprimer des rôles', 'roles', 'delete'),
            ('system.admin', 'Administration Système', 'Accès complet au système', 'system', 'admin'),
            ('system.backup', 'Sauvegarde Système', 'Créer et restaurer des sauvegardes', 'system', 'backup'),
            ('system.settings', 'Paramètres Système', 'Modifier les paramètres du système', 'system', 'settings')
            """
        )

    # Assign permissions to roles
    existing_role_permissions = await conn.fetch(
        "SELECT COUNT(*) FROM role_permissions"
    )
    if existing_role_permissions[0][0] == 0:
        await conn.execute(
            """
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p 
            WHERE r.name = 'super_admin';
            
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p 
            WHERE r.name = 'admin' AND p.name NOT IN ('roles.create', 'roles.update', 'roles.delete', 'system.admin');
            
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p 
            WHERE r.name = 'manager' AND p.name IN (
                'articles.read', 'articles.create', 'articles.update', 'articles.delete', 'articles.export',
                'categories.read', 'categories.create', 'categories.update', 'categories.delete',
                'users.read'
            );
            
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p 
            WHERE r.name = 'editor' AND p.name IN (
                'articles.read', 'articles.create', 'articles.update', 'articles.export',
                'categories.read'
            );
            
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p 
            WHERE r.name = 'viewer' AND p.name IN (
                'articles.read', 'categories.read'
            );
            """
        )

    # Update existing users to have default roles
    await conn.execute(
        """
        UPDATE users SET role_id = (
            CASE 
                WHEN id = 1 THEN (SELECT id FROM roles WHERE name = 'super_admin')
                ELSE (SELECT id FROM roles WHERE name = 'editor')
            END
        ) WHERE role_id IS NULL
        """
    )

    # Seed sample categories
    existing_categories = await conn.fetch("SELECT COUNT(*) FROM categories")
    if existing_categories[0][0] == 0:
        await conn.execute(
            """
            INSERT INTO categories (nom, description) VALUES 
            ('Alimentaire', 'Produits alimentaires et boissons'),
            ('Électronique', 'Appareils et composants électroniques'),
            ('Vêtements', 'Vêtements et accessoires'),
            ('Maison', 'Articles pour la maison et décoration'),
            ('Sport', 'Articles de sport et loisirs'),
            ('Bureautique', 'Fournitures de bureau et papeterie')
            """
        )

        await conn.execute(
            """
            INSERT INTO sous_categories (nom, description, categorie) VALUES 
            ('Fruits', 'Fruits frais', 'Alimentaire'),
            ('Légumes', 'Légumes frais', 'Alimentaire'),
            ('Boissons', 'Boissons diverses', 'Alimentaire'),
            ('Smartphones', 'Téléphones portables', 'Électronique'),
            ('Ordinateurs', 'PC et accessoires', 'Électronique'),
            ('Audio', 'Écouteurs, haut-parleurs', 'Électronique'),
            ('Hommes', 'Vêtements pour hommes', 'Vêtements'),
            ('Femmes', 'Vêtements pour femmes', 'Vêtements'),
            ('Enfants', 'Vêtements pour enfants', 'Vêtements'),
            ('Cuisine', 'Ustensiles et électroménager', 'Maison'),
            ('Décoration', 'Objets décoratifs', 'Maison'),
            ('Meubles', 'Mobilier de maison', 'Maison'),
            ('Fitness', 'Équipement de fitness', 'Sport'),
            ('Outdoor', 'Sports de plein air', 'Sport'),
            ('Ballons', 'Ballons et équipements de sport', 'Sport'),
            ('Papier', 'Papeterie et fournitures', 'Bureautique'),
            ('Stylos', 'Stylos et crayons', 'Bureautique'),
            ('Classement', 'Dossiers et classeurs', 'Bureautique')
            """
        )

    await conn.close()
