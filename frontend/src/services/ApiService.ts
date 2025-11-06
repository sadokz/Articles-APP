// API Service for communicating with FastAPI backend
import { Article, Categorie, SousCategorie } from '../types/Article';
import { ExtendedUser } from '../types/User';

class ApiServiceClass {
    private baseURL: string;

    constructor() {
        // Use import.meta.env for Vite instead of process.env
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    }

    private async fetchApi<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, defaultOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Handle empty responses (like DELETE operations)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return {} as T;
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    // Article methods
    async getArticles(): Promise<Article[]> {
        return this.fetchApi<Article[]>('/api/articles/');
    }

    async addArticle(article: Omit<Article, 'id'>): Promise<Article> {
        // Convert to FormData for file upload support
        const formData = new FormData();
        formData.append('titre', article.titre);
        formData.append('prix', article.prix.toString());
        formData.append('unite', article.unite);
        formData.append('description', article.description || '');
        formData.append('categorie', article.categorie);
        formData.append('sous_categorie', article.sous_categorie);
        formData.append('date_rappel', article.date_rappel || '');

        const response = await fetch(`${this.baseURL}/api/articles/`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async updateArticle(article: Article): Promise<Article> {
        const { id, ...articleData } = article;
        return this.fetchApi<Article>(`/api/articles/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                titre: articleData.titre,
                prix: articleData.prix,
                unite: articleData.unite,
                description: articleData.description || '',
                categorie: articleData.categorie,
                sous_categorie: articleData.sous_categorie,
                date_rappel: articleData.date_rappel || '',
            }),
        });
    }

    async deleteArticle(id: number): Promise<void> {
        await this.fetchApi<void>(`/api/articles/${id}`, {
            method: 'DELETE',
        });
    }

    // Category methods
    async getCategories(): Promise<Categorie[]> {
        return this.fetchApi<Categorie[]>('/api/categories/');
    }

    async addCategory(category: Omit<Categorie, 'id'>): Promise<Categorie> {
        return this.fetchApi<Categorie>('/api/categories/', {
            method: 'POST',
            body: JSON.stringify(category),
        });
    }

    async updateCategory(category: Categorie): Promise<Categorie> {
        const { id, ...categoryData } = category;
        return this.fetchApi<Categorie>(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
        });
    }

    async deleteCategory(id: number): Promise<void> {
        await this.fetchApi<void>(`/api/categories/${id}`, {
            method: 'DELETE',
        });
    }

    // Sous-category methods
    async getSousCategories(categorie?: string): Promise<SousCategorie[]> {
        const endpoint = categorie
            ? `/api/sous-categories/?categorie=${encodeURIComponent(categorie)}`
            : '/api/sous-categories/';
        return this.fetchApi<SousCategorie[]>(endpoint);
    }

    async addSousCategory(sousCategory: Omit<SousCategorie, 'id'>): Promise<SousCategorie> {
        return this.fetchApi<SousCategorie>('/api/sous-categories/', {
            method: 'POST',
            body: JSON.stringify(sousCategory),
        });
    }

    async updateSousCategory(sousCategory: SousCategorie): Promise<SousCategorie> {
        const { id, ...sousCategoryData } = sousCategory;
        return this.fetchApi<SousCategorie>(`/api/sous-categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(sousCategoryData),
        });
    }

    async deleteSousCategory(id: number): Promise<void> {
        await this.fetchApi<void>(`/api/sous-categories/${id}`, {
            method: 'DELETE',
        });
    }

    // User authentication - These would need to be implemented in the backend
    async authenticateUser(username: string, password: string): Promise<ExtendedUser | null> {
        try {
            const response = await this.fetchApi<ExtendedUser>('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            return response;
        } catch (error) {
            // For now, return a mock user if authentication fails
            // This should be properly implemented with JWT tokens
            if (username === 'admin' && password === 'admin') {
                return {
                    id: 1,
                    username: 'admin',
                    nom_complet: 'Administrateur',
                    nom: 'Admin',
                    prenom: 'Super',
                    email: 'admin@example.com',
                    telephone: '',
                    niveau_acces: 'lecture_modification'
                };
            }
            return null;
        }
    }

    // Mock methods for features not yet implemented in backend
    async getUsers(): Promise<ExtendedUser[]> {
        // This would need to be implemented in the backend
        return [];
    }

    async addUser(user: Omit<ExtendedUser, 'id'>): Promise<void> {
        // This would need to be implemented in the backend
        console.warn('User management not implemented in backend yet');
    }

    async updateUser(user: ExtendedUser): Promise<void> {
        // This would need to be implemented in the backend
        console.warn('User management not implemented in backend yet');
    }

    async deleteUser(id: number): Promise<void> {
        // This would need to be implemented in the backend
        console.warn('User management not implemented in backend yet');
    }

    // Export/Import methods - would need backend implementation
    exportDatabase(): Uint8Array {
        console.warn('Database export not implemented for API backend');
        return new Uint8Array();
    }

    async importDatabase(data: Uint8Array): Promise<void> {
        console.warn('Database import not implemented for API backend');
    }

    // Initialize method for compatibility
    async initialize(): Promise<void> {
        // Test connection to backend
        try {
            await this.getArticles();
            console.log('API connection established');
        } catch (error) {
            console.error('Failed to connect to API backend:', error);
            throw new Error('Cannot connect to backend API. Please ensure the FastAPI server is running.');
        }
    }
}

export const ApiService = new ApiServiceClass(); 