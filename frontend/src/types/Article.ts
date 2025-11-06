
export interface Article {
  id?: number;
  titre: string;
  prix: number;
  unite: string;
  description: string;
  categorie: string;
  sous_categorie: string;
  dernier_modifie_par: string;
  date_modification: string;
  ordre?: number;
  tags?: string[];
  date_rappel?: string;
  pieces_jointes?: string[];
}

export interface Categorie {
  id?: number;
  nom: string;
  description: string;
}

export interface SousCategorie {
  id?: number;
  nom: string;
  description: string;
  categorie: string;
}

export interface Statistiques {
  totalArticles: number;
  totalCategories: number;
  totalSousCategories: number;
  articlesModifiesCeMois: number;
  utilisateurLePlusActif: string;
}

export interface RechercheAvancee {
  motCle: string;
  prixMin: number | null;
  prixMax: number | null;
  utilisateur: string;
  dateDebut: string;
  dateFin: string;
  tags: string[];
}
