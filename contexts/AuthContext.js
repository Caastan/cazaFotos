import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true); // mientras lee AsyncStorage

  /* ---------- Persistencia ----------- */
  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem('@rf_user');
        if (json) setUser(JSON.parse(json));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (u) => {
    setUser(u);
    await AsyncStorage.setItem('@rf_user', JSON.stringify(u));
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem('@rf_user');
  };

  if (loading) return null; // o un <SplashScreen/>

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}