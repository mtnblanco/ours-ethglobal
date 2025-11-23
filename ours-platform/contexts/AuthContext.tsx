'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    worldId: string;
    verified: boolean;
    kycCompleted: boolean;
    email?: string;
    fullName?: string;
    country?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (worldId: string, proof: any) => void;
    logout: () => void;
    completeKYC: (kycData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('ours_user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
        }
    }, []);

    const login = (worldId: string, proof: any) => {
        const newUser: User = {
            worldId,
            verified: true,
            kycCompleted: false,
        };

        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem('ours_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('ours_user');
    };

    const completeKYC = (kycData: Partial<User>) => {
        if (user) {
            const updatedUser = {
                ...user,
                ...kycData,
                kycCompleted: true,
            };
            setUser(updatedUser);
            localStorage.setItem('ours_user', JSON.stringify(updatedUser));
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, completeKYC }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
