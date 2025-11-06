import initSqlJs, { Database } from 'sql.js';
import { User, ExtendedUser } from '../types/User';
import { Article, Categorie, SousCategorie } from '../types/Article';

class DatabaseServiceClass {
  private db: Database | null = null;
  private SQL: any = null;

  async initialize() {
    if (!this.SQL) {
      this.SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });
    }

    // Essayer de charger la base existante depuis localStorage
    const existingData = localStorage.getItem('articleDB');
    if (existingData) {
      const binaryData = new Uint8Array(JSON.parse(existingData));
      this.db = new this.SQL.Database(binaryData);
      await this.updateSchema();
    } else {
      this.db = new this.SQL.Database();
      await this.createTables();
      await this.insertDefaultData();
    }
  }

  private async updateSchema() {
    if (!this.db) throw new Error('Base de données non initialisée');

    // Ajouter les nouvelles colonnes à la table users si elles n'existent pas
    try {
      this.db.run(`ALTER TABLE users ADD COLUMN nom TEXT`);
    } catch (e) {
      // Colonne existe déjà
    }

    try {
      this.db.run(`ALTER TABLE users ADD COLUMN prenom TEXT`);
    } catch (e) {
      // Colonne existe déjà
    }

    try {
      this.db.run(`ALTER TABLE users ADD COLUMN email TEXT`);
    } catch (e) {
      // Colonne existe déjà
    }

    try {
      this.db.run(`ALTER TABLE users ADD COLUMN telephone TEXT`);
    } catch (e) {
      // Colonne existe déjà
    }

    try {
      this.db.run(`ALTER TABLE users ADD COLUMN niveau_acces TEXT DEFAULT 'lecture_modification'`);
    } catch (e) {
      // Colonne existe déjà
    }

    this.saveToLocalStorage();
  }

  private async createTables() {
    if (!this.db) throw new Error('Base de données non initialisée');

    // Table des utilisateurs
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nom_complet TEXT NOT NULL,
        nom TEXT,
        prenom TEXT,
        email TEXT,
        telephone TEXT,
        niveau_acces TEXT DEFAULT 'lecture_modification'
      )
    `);

    // Table des catégories
    this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT UNIQUE NOT NULL,
        description TEXT
      )
    `);

    // Table des sous-catégories
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sous_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        description TEXT,
        categorie TEXT NOT NULL
      )
    `);

    // Table des articles
    this.db.run(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        prix REAL NOT NULL,
        unite TEXT NOT NULL,
        description TEXT,
        categorie TEXT NOT NULL,
        sous_categorie TEXT NOT NULL,
        dernier_modifie_par TEXT NOT NULL,
        date_modification TEXT NOT NULL,
        ordre INTEGER DEFAULT 0
      )
    `);
  }

  private async insertDefaultData() {
    if (!this.db) return;

    // Utilisateur par défaut
    this.db.run(
      "INSERT INTO users (username, password, nom_complet, nom, prenom, niveau_acces) VALUES (?, ?, ?, ?, ?, ?)",
      ['admin', 'admin', 'Administrateur', 'Admin', 'Super', 'lecture_modification']
    );

    // Catégories par défaut
    const categories = [
      ['Alimentation', 'Produits alimentaires et boissons'],
      ['Électronique', 'Appareils et accessoires électroniques'],
      ['Vêtements', 'Articles vestimentaires et accessoires'],
    ];

    categories.forEach(([nom, description]) => {
      this.db!.run(
        "INSERT INTO categories (nom, description) VALUES (?, ?)",
        [nom, description]
      );
    });

    // Sous-catégories par défaut
    const sousCategories = [
      ['Fruits', 'Fruits frais et secs', 'Alimentation'],
      ['Légumes', 'Légumes frais et conservés', 'Alimentation'],
      ['Smartphones', 'Téléphones portables et accessoires', 'Électronique'],
      ['Ordinateurs', 'PC, laptops et accessoires', 'Électronique'],
      ['T-shirts', 'T-shirts et polos', 'Vêtements'],
      ['Pantalons', 'Pantalons et jeans', 'Vêtements'],
    ];

    sousCategories.forEach(([nom, description, categorie]) => {
      this.db!.run(
        "INSERT INTO sous_categories (nom, description, categorie) VALUES (?, ?, ?)",
        [nom, description, categorie]
      );
    });

    // Articles par défaut
    const articles = [
      ['Pommes Gala', 2.50, 'kg', 'Pommes Gala fraîches du verger', 'Alimentation', 'Fruits', 'admin', new Date().toISOString()],
      ['iPhone 15', 999.99, 'unité', 'Smartphone Apple iPhone 15', 'Électronique', 'Smartphones', 'admin', new Date().toISOString()],
      ['T-shirt Blanc', 19.99, 'unité', 'T-shirt blanc 100% coton', 'Vêtements', 'T-shirts', 'admin', new Date().toISOString()],
    ];

    articles.forEach((article, index) => {
      this.db!.run(
        "INSERT INTO articles (titre, prix, unite, description, categorie, sous_categorie, dernier_modifie_par, date_modification, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [...article, index]
      );
    });

    this.saveToLocalStorage();
  }

  saveToLocalStorage() {
    if (!this.db) return;
    const data = this.db.export();
    localStorage.setItem('articleDB', JSON.stringify(Array.from(data)));
  }

  // Méthodes d'authentification
  async authenticateUser(username: string, password: string): Promise<ExtendedUser | null> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const stmt = this.db.prepare("SELECT * FROM users WHERE username = ? AND password = ?");
    const result = stmt.getAsObject([username, password]);
    stmt.free();

    if (result.id) {
      // Vérifier si le compte est inactif
      if (result.niveau_acces === 'inactif') {
        return null;
      }

      return {
        id: result.id as number,
        username: result.username as string,
        nom_complet: result.nom_complet as string,
        nom: result.nom as string,
        prenom: result.prenom as string,
        email: result.email as string,
        telephone: result.telephone as string,
        niveau_acces: result.niveau_acces as 'lecture_seule' | 'lecture_modification' | 'inactif'
      };
    }
    return null;
  }

  // Méthodes pour les utilisateurs
  async getUsers(): Promise<ExtendedUser[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const stmt = this.db.prepare("SELECT * FROM users ORDER BY username");
    const users: ExtendedUser[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      users.push({
        id: row.id as number,
        username: row.username as string,
        nom_complet: row.nom_complet as string,
        nom: row.nom as string,
        prenom: row.prenom as string,
        email: row.email as string,
        telephone: row.telephone as string,
        niveau_acces: row.niveau_acces as 'lecture_seule' | 'lecture_modification' | 'inactif'
      });
    }
    stmt.free();
    return users;
  }

  async addUser(user: Omit<ExtendedUser, 'id'>): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    this.db.run(
      "INSERT INTO users (username, password, nom_complet, nom, prenom, email, telephone, niveau_acces) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user.username,
        user.password || 'password123',
        user.nom_complet,
        user.nom || '',
        user.prenom || '',
        user.email || '',
        user.telephone || '',
        user.niveau_acces || 'lecture_modification'
      ]
    );
    this.saveToLocalStorage();
  }

  async updateUser(user: ExtendedUser): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const updateFields = [
      "nom_complet = ?",
      "nom = ?",
      "prenom = ?",
      "email = ?",
      "telephone = ?",
      "niveau_acces = ?"
    ];

    const values = [
      user.nom_complet,
      user.nom || '',
      user.prenom || '',
      user.email || '',
      user.telephone || '',
      user.niveau_acces || 'lecture_modification'
    ];

    // Si un nouveau mot de passe est fourni, l'inclure
    if (user.password && user.password.trim() !== '') {
      updateFields.push("password = ?");
      values.push(user.password);
    }

    // Ne pas permettre de modifier l'identifiant admin
    if (user.username !== 'admin') {
      updateFields.push("username = ?");
      values.push(user.username);
    }

    values.push(user.id.toString());

    this.db.run(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    this.saveToLocalStorage();
  }

  async deleteUser(id: number): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    this.db.run("DELETE FROM users WHERE id = ?", [id.toString()]);
    this.saveToLocalStorage();
  }

  // Nouvelles méthodes pour les catégories
  async addCategory(category: Omit<Categorie, 'id'>): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    this.db.run(
      "INSERT INTO categories (nom, description) VALUES (?, ?)",
      [category.nom, category.description]
    );
    this.saveToLocalStorage();
  }

  async updateCategory(category: Categorie): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    this.db.run(
      "UPDATE categories SET nom = ?, description = ? WHERE id = ?",
      [category.nom, category.description, category.id]
    );
    this.saveToLocalStorage();
  }

  async deleteCategory(id: number): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    this.db.run("DELETE FROM categories WHERE id = ?", [id]);
    this.saveToLocalStorage();
  }

  // Nouvelles méthodes pour les sous-catégories
  async addSousCategory(sousCategory: Omit<SousCategorie, 'id'>): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    this.db.run(
      "INSERT INTO sous_categories (nom, description, categorie) VALUES (?, ?, ?)",
      [sousCategory.nom, sousCategory.description, sousCategory.categorie]
    );
    this.saveToLocalStorage();
  }

  async updateSousCategory(sousCategory: SousCategorie): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    this.db.run(
      "UPDATE sous_categories SET nom = ?, description = ?, categorie = ? WHERE id = ?",
      [sousCategory.nom, sousCategory.description, sousCategory.categorie, sousCategory.id]
    );
    this.saveToLocalStorage();
  }

  async deleteSousCategory(id: number): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    this.db.run("DELETE FROM sous_categories WHERE id = ?", [id]);
    this.saveToLocalStorage();
  }

  // Méthodes pour les articles
  async getArticles(): Promise<Article[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const stmt = this.db.prepare("SELECT * FROM articles ORDER BY ordre ASC, id DESC");
    const articles: Article[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      articles.push({
        id: row.id as number,
        titre: row.titre as string,
        prix: row.prix as number,
        unite: row.unite as string,
        description: row.description as string,
        categorie: row.categorie as string,
        sous_categorie: row.sous_categorie as string,
        dernier_modifie_par: row.dernier_modifie_par as string,
        date_modification: row.date_modification as string,
        ordre: row.ordre as number
      });
    }
    stmt.free();
    return articles;
  }

  async addArticle(article: Omit<Article, 'id'>): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    this.db.run(
      "INSERT INTO articles (titre, prix, unite, description, categorie, sous_categorie, dernier_modifie_par, date_modification, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        article.titre,
        article.prix,
        article.unite,
        article.description,
        article.categorie,
        article.sous_categorie,
        article.dernier_modifie_par,
        article.date_modification,
        article.ordre || 0
      ]
    );
    this.saveToLocalStorage();
  }

  async updateArticle(article: Article): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    this.db.run(
      "UPDATE articles SET titre = ?, prix = ?, unite = ?, description = ?, categorie = ?, sous_categorie = ?, dernier_modifie_par = ?, date_modification = ?, ordre = ? WHERE id = ?",
      [
        article.titre,
        article.prix,
        article.unite,
        article.description,
        article.categorie,
        article.sous_categorie,
        article.dernier_modifie_par,
        article.date_modification,
        article.ordre || 0,
        article.id
      ]
    );
    this.saveToLocalStorage();
  }

  async deleteArticle(id: number): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    this.db.run("DELETE FROM articles WHERE id = ?", [id]);
    this.saveToLocalStorage();
  }

  // Méthodes pour les catégories
  async getCategories(): Promise<Categorie[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const stmt = this.db.prepare("SELECT * FROM categories ORDER BY nom");
    const categories: Categorie[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      categories.push({
        id: row.id as number,
        nom: row.nom as string,
        description: row.description as string
      });
    }
    stmt.free();
    return categories;
  }

  async getSousCategories(categorie?: string): Promise<SousCategorie[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const query = categorie
      ? "SELECT * FROM sous_categories WHERE categorie = ? ORDER BY nom"
      : "SELECT * FROM sous_categories ORDER BY nom";

    const stmt = this.db.prepare(query);
    const sousCategories: SousCategorie[] = [];
    const params = categorie ? [categorie] : [];

    if (categorie) {
      while (stmt.step()) {
        const row = stmt.getAsObject();
        sousCategories.push({
          id: row.id as number,
          nom: row.nom as string,
          description: row.description as string,
          categorie: row.categorie as string
        });
      }
    } else {
      while (stmt.step()) {
        const row = stmt.getAsObject();
        sousCategories.push({
          id: row.id as number,
          nom: row.nom as string,
          description: row.description as string,
          categorie: row.categorie as string
        });
      }
    }
    stmt.free();
    return sousCategories;
  }

  // Export/Import de la base
  exportDatabase(): Uint8Array {
    if (!this.db) throw new Error('Base de données non initialisée');
    return this.db.export();
  }

  async importDatabase(data: Uint8Array): Promise<void> {
    if (!this.SQL) throw new Error('SQL.js non initialisé');
    this.db = new this.SQL.Database(data);
    await this.updateSchema();
    this.saveToLocalStorage();
  }
}

export const DatabaseService = new DatabaseServiceClass();
