"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getUser, registerUser, resendVerificationEmail, verifyEmail } from "@/lib/help-center";
import { CLIENT_KEY } from "@/lib/help-center-config";

interface UserSessionContextType {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
}

const UserSessionContext = createContext<UserSessionContextType | undefined>(
  undefined
);

export function UserSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("starko-token");
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const userData = await getUser(CLIENT_KEY, token);
      if (userData.ok && userData.data) {
        setUser(userData.data);
      } else {
        setUser(null);
        localStorage.removeItem("starko-token");
      }
    } catch (error) {
      setUser(null);
      localStorage.removeItem("starko-token");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <UserSessionContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        checkAuth,
      }}
    >
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession() {
  const context = useContext(UserSessionContext);
  if (context === undefined) {
    throw new Error("useUserSession must be used within UserSessionProvider");
  }
  return context;
}

