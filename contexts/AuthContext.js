// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../config/supabase';
import { db } from '../lib/supabaseClients';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtiene el perfil desde la tabla "usuarios"
  const fetchUserProfile = async (sbUser) => {
    try {
      const { data, error, status } = await db
        .from('usuarios')
        .select('*')
        .eq('id', sbUser.id)
        .single();
      if (error && status === 406) {
        // No hay fila aún
        setUser(null);
        return;
      }
      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.log('Error fetching user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session?.user) {
          const sbUser = session.user;
          // Si el correo no está verificado, cerramos sesión
          if (!sbUser.email_confirmed_at) {
            await supabase.auth.signOut();
            Alert.alert(
              'Verifica tu correo',
              'Debes verificar tu email antes de entrar a la aplicación.'
            );
            setUser(null);
            setLoading(false);
            return;
          }
          await fetchUserProfile(sbUser);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const sbUser = session.user;
        if (!sbUser.email_confirmed_at) {
          setLoading(false);
          return;
        }
        await fetchUserProfile(sbUser);
      } else {
        setLoading(false);
      }
    })();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const register = async ({ email, password, displayName, rolElegido }) => {
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;
      const sbUser = signUpData.user;

      const statusInicial = rolElegido === 'participante' ? 'pending' : 'active';
      const newUser = {
        id:           sbUser.id,
        email,
        display_name: displayName,
        rol:          rolElegido,
        status:       statusInicial,
        photourl:     null,
      };
      // Insertamos en la tabla "usuarios"
      const { error: insertError } = await db.from('usuarios').insert(newUser);
      if (insertError) {
        // Si falla, eliminamos el usuario de Auth
        await supabase.auth.admin.deleteUser(sbUser.id);
        throw insertError;
      }

      if (rolElegido === 'general') {
        Alert.alert(
          'Registro completado',
          'Revisa tu correo para verificar tu cuenta antes de entrar.'
        );
        // Enviamos email de verificación
      } else {
        Alert.alert(
          'Registro completado',
          'Tu cuenta de participante está pendiente de aprobación por un administrador.'
        );
      }
    } catch (error) {
      Alert.alert('Error al registrar', error.message);
      throw error;
    }
  };

  const signIn = async ({ email, password }) => {
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      const sbUser = signInData.user;
      // Verificar email confirmado
      if (!sbUser.email_confirmed_at) {
        await supabase.auth.signOut();
        Alert.alert(
          'Verifica tu correo',
          'Debes verificar tu email antes de entrar a la aplicación.'
        );
        return;
      }

      // Rebuscamos el perfil en la tabla "usuarios"
      await fetchUserProfile(sbUser);

      // Para participantes pendientes o rechazados, mostramos alerta y cerramos sesión
      if (user?.rol === 'participante' && user.status === 'pending') {
        Alert.alert('Cuenta pendiente', 'Tu cuenta aún no ha sido aprobada.');
        await supabase.auth.signOut();
        setUser(null);
      }
      if (user?.status === 'rejected') {
        Alert.alert(
          'Cuenta rechazada',
          'Tu solicitud fue rechazada. Contacta al administrador.'
        );
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (error) {
       switch (error.message) {
         case 'missing email or phone': 
            Alert.alert('Campos Vacíos', 'Por favor, rellene los campos.');
            break;
          case 'Invalid login credentials':
            Alert.alert('Credenciales inválidas', 'El correo o la contraseña son incorrectos.');
            break;
          case 'Email not confirmed':
            Alert.alert('Email no confirmado', 'Por favor, verifica tu correo electrónico.');
            break;
       }
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async ({ displayName, photourl }) => {
    try {
      const updates = {
        display_name: displayName,
        photourl,
      };
      const { error } = await db
        .from('usuarios')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
      setUser({ ...user, ...updates });
      Alert.alert('Perfil actualizado', 'Tus datos fueron actualizados correctamente.');
    } catch (error) {
      Alert.alert('Error al actualizar perfil', error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    register,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
