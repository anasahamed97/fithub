import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "owner" | "trainer" | "member";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  joinedDate: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: Record<UserRole, UserProfile> = {
  owner: {
    id: "owner-1",
    name: "Marcus Rivera",
    email: "marcus@fitforge.com",
    role: "owner",
    phone: "+1 (555) 100-2000",
    joinedDate: "Sep 2024",
  },
  trainer: {
    id: "trainer-1",
    name: "David Park",
    email: "david@fitforge.com",
    role: "trainer",
    phone: "+1 (555) 200-3000",
    joinedDate: "Jan 2025",
  },
  member: {
    id: "member-1",
    name: "Alex Johnson",
    email: "alex@email.com",
    role: "member",
    phone: "+1 (555) 300-4000",
    joinedDate: "Jan 2026",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  const login = useCallback(async (email: string, _password: string, role: UserRole): Promise<boolean> => {
    // Mock login — accepts any credentials
    await new Promise((r) => setTimeout(r, 800));
    setUser({ ...MOCK_USERS[role], email });
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
