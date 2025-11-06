import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthContextType, UserWithRole, UserLogin, UserCreate } from '../types/User';
import { loginUser, registerUser, getCurrentUser } from '../api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserWithRole | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('auth_token');
            if (storedToken) {
                try {
                    setToken(storedToken);
                    const userData = await getCurrentUser(storedToken);
                    setUser(userData as UserWithRole);
                } catch (error) {
                    console.error('Token validation failed:', error);
                    localStorage.removeItem('auth_token');
                    setToken(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback(async (credentials: UserLogin) => {
        setIsLoading(true);
        try {
            const authResponse = await loginUser(credentials);
            const newToken = authResponse.access_token;

            setToken(newToken);
            localStorage.setItem('auth_token', newToken);

            const userData = await getCurrentUser(newToken);
            setUser(userData as UserWithRole);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (userData: UserCreate) => {
        setIsLoading(true);
        try {
            // Register user first
            await registerUser(userData);

            // Then log them in automatically
            await login({ email: userData.email, password: userData.password });
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [login]);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
    }, []);

    // Permission checking methods
    const hasPermission = useCallback((permission: string): boolean => {
        if (!user || !user.permissions) {
            return false;
        }
        return user.permissions.includes(permission);
    }, [user]);

    const hasAnyPermission = useCallback((permissions: string[]): boolean => {
        if (!user || !user.permissions) {
            return false;
        }
        return permissions.some(permission => user.permissions.includes(permission));
    }, [user]);

    const hasRole = useCallback((roleName: string): boolean => {
        if (!user) {
            return false;
        }
        return user.role_name === roleName;
    }, [user]);

    const isAuthenticated = !!user && !!token;

    const value: AuthContextType = {
        user,
        token,
        login,
        register,
        logout,
        isLoading,
        isAuthenticated,
        hasPermission,
        hasAnyPermission,
        hasRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 