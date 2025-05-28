// src/contexts/AuthContext.js
import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../lib/supabaseClients';
import { supabase } from '../config/supabase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: carga el perfil desde la tabla usuarios
  const fetchProfile = async (userId) => {
    const { data, error } = await db
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  };

  // On mount: intenta restaurar sesión y perfil
  useEffect(() => {
    (async () => {
      try {
        // 1) revisa sesión en GoTrue
        const { data: { session } } = await auth.getSession();
        if (session?.user) {
          // 2) si hay session, trae perfil de tabla
          const profile = await fetchProfile(session.user.id);
          const fullUser = { ...session.user, ...profile };
          setUser(fullUser);
          await AsyncStorage.setItem('@rf_user', JSON.stringify(fullUser));
        } else {
          // 3) si no, intenta cargar de storage
          const json = await AsyncStorage.getItem('@rf_user');
          if (json) setUser(JSON.parse(json));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
    // Suscripción a cambios de auth para refrescar perfil en caliente
    const { data: listener } = auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        const fullUser = { ...session.user, ...profile };
        setUser(fullUser);
        await AsyncStorage.setItem('@rf_user', JSON.stringify(fullUser));
      } else {
        setUser(null);
        AsyncStorage.removeItem('@rf_user');
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // tras login, traemos perfil y guardamos
    const profile  = await fetchProfile(data.user.id);
    const fullUser = { ...data.user, ...profile };
    setUser(fullUser);
    await AsyncStorage.setItem('@rf_user', JSON.stringify(fullUser));
    return fullUser;
  };

   const register = async ({ nombre, email, password, rol }) => {
    // 1) Crear usuario en Auth
    const { data, error: authError } = await auth.signUp({ email, password });
    if (authError) throw authError;

    // 2) Insertar perfil en la tabla usuarios
    const user = data.user;
    const { error: dbError } = await db
      .from('usuarios')
      .insert([{ id: user.id, email, display_name: nombre, rol }]);
    if (dbError) throw dbError;

    // 3) Opcional: cargar perfil completo y persistir
    const profile = await db
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(res => {
        if (res.error) throw res.error;
        return res.data;
      });
    const fullUser = { ...user, ...profile };
    setUser(fullUser);
    await AsyncStorage.setItem('@rf_user', JSON.stringify(fullUser));

    return fullUser;
  };

  const resetPassword = async (email) => {
    const { error } = await auth.requestPasswordRecovery(email);
    if (error) throw error;
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    await AsyncStorage.removeItem('@rf_user');
  };

  if (loading) return null;
  return (
    <AuthContext.Provider value={{ user, signIn, signOut, register, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}
