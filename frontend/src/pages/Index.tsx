import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dashboard } from '../components/Dashboard';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';
import { LoginModal } from '../components/LoginModal';
import { RegisterModal } from '../components/RegisterModal';

const Index = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Dashboard user={user} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header avec boutons de connexion et inscription */}
      <header className="w-full p-4">
        <div className="max-w-7xl mx-auto flex justify-end space-x-4">
          <Button
            onClick={() => setIsRegisterModalOpen(true)}
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50 font-medium px-6 py-2 transition-all duration-200"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            S'inscrire
          </Button>
          <Button
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 transition-all duration-200"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Connexion
          </Button>
        </div>
      </header>

      {/* Contenu principal de la page d'accueil */}
      <main className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mx-auto mb-8 h-24 w-24 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl">
            <img
              src="/lovable-uploads/35137944-4fd5-4269-95e4-e24464bfaff4.png"
              alt="Logo LA MAÎTRISE"
              className="h-20 w-20 object-contain"
            />
          </div>

          {/* Titre */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            LA MAÎTRISE
          </h1>

          {/* Slogan */}
          <h2 className="text-2xl md:text-3xl font-semibold text-orange-600 mb-8">
            Services d'Ingénierie Électrique Complets
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-12">
            Nous fournissons des solutions professionnelles d'ingénierie électrique adaptées pour répondre à vos besoins et défis spécifiques.
          </p>

          {/* Boutons d'action */}
          <div className="space-x-4 space-y-4">
            <Button
              onClick={() => setIsLoginModalOpen(true)}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8 py-3 text-lg transition-all duration-200"
            >
              Accéder au système de gestion
            </Button>
            <Button
              onClick={() => setIsRegisterModalOpen(true)}
              size="lg"
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50 font-medium px-8 py-3 text-lg transition-all duration-200"
            >
              Créer un compte
            </Button>
          </div>
        </div>
      </main>

      {/* Modals de connexion et inscription */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
};

export default Index;
