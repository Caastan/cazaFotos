import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../config/supabase';
import { db } from '../lib/supabaseClients';

// Creo el contexto de autenticación para compartir estado y funciones de auth
const AuthContext = createContext();

// Hook personalizado para acceder al contexto de autenticación desde cualquier componente
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Estado local para almacenar el perfil del usuario (o null si no hay usuario)
  const [user, setUser] = useState(null);
  // Estado local para controlar el spinner de carga mientras se verifica sesión/perfil
  const [loading, setLoading] = useState(true);

  // Función que obtiene el perfil de usuario desde la tabla "usuarios" en la base de datos
  const fetchUserProfile = async (sbUser) => {
    try {
      // Intentamos seleccionar la fila cuyo id coincide con el id de Supabase
      const { data, error, status } = await db
        .from('usuarios')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      // Si no existe ninguna fila (status 406), asignamos null y salimos
      if (error && status === 406) {
        setUser(null);
        return null;
      }
      // Si ocurre cualquier otro error, lo lanzamos para manejarlo en el catch
      if (error) throw error;

      // Guardamos los datos del perfil en el estado
      setUser(data);
      return data;
    } catch (error) {
      // En caso de error (p. ej. fallo de red), limpiamos el usuario
      setUser(null);
      return null;
    } finally {
      // Siempre desactivamos el loading al finalizar la llamada
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listener que escucha cambios en el estado de autenticación (login/logout/token refresh, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (!session?.user) {
          // Si no hay sesión, limpiamos estado y desactivamos loading
          setUser(null);
          setLoading(false);
          return;
        }

        const sbUser = session.user;
        // Obtenemos el perfil para usuarios activos
        const profile = await fetchUserProfile(sbUser);
        if (!profile) {
          // Sin perfil, cerramos sesión
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }

        // En este punto, usuario Ok (email confirmado y rol general) o participante activo
        // El resto de bloqueos se manejan antes del signIn
      }
    );

    // Al montar el componente, hacemos una comprobación inicial de si ya existe sesión activa
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // Si no hay sesión, paramos el spinner
        setLoading(false);
        return;
      }

      const sbUser = session.user;
      // Solo refresca perfil, sin bloqueos aquí
      await fetchUserProfile(sbUser);
    })();

    // Cleanup: al desmontar el componente, cancelamos la suscripción al listener
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Función para registrar un nuevo usuario
  const register = async ({ email, password, displayName, rolElegido }) => {
    try {
      // Creamos cuenta en Supabase Auth con email y contraseña
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      const sbUser = signUpData.user;

      // Definimos el estado inicial según el rol elegido
      const statusInicial = rolElegido === 'participante' ? 'pending' : 'active';

      // Preparamos el objeto que se insertará en la tabla "usuarios"
      const newUser = {
        id:           sbUser.id,
        email,
        display_name: displayName,
        rol:          rolElegido,
        status:       statusInicial,
        photourl:     null,
      };

      // Insertamos el nuevo registro en la tabla "usuarios"
      const { error: insertError } = await db.from('usuarios').insert(newUser);
      if (insertError) {
        // Si la inserción falla, eliminamos el usuario creado en Auth para no dejar registros huérfanos
        await supabase.auth.admin.deleteUser(sbUser.id);
        throw insertError;
      }

      // Mensaje de feedback en función del rol: general o participante
      if (rolElegido === 'general') {
        Alert.alert(
          'Registro completado',
          'Revisa tu correo para verificar tu cuenta antes de entrar.'
        );
      } else {
        Alert.alert(
          'Registro completado',
          'Tu cuenta de participante está pendiente de aprobación por un administrador.'
        );
      }
    } catch (error) {
      // Mostramos alerta en caso de cualquier error durante el registro
      Alert.alert('Error al registrar', error.message);
      throw error;
    }
  };

  // Función para iniciar sesión con email y contraseña
  const signIn = async ({ email, password }) => {
    try {
      // Revisar en tabla "usuarios" sin iniciar sesión
      const { data: profile, error: pError } = await db
        .from('usuarios')
        .select('rol,status')
        .eq('email', email)
        .single();
      if (pError) throw pError;

      // Bloqueo de participantes PENDING o REJECTED antes de autenticar
      if (profile.rol === 'participante' && profile.status === 'pending') {
        Alert.alert('Cuenta pendiente', 'Tu cuenta aún no ha sido aprobada.');
        return;
      }
      if (profile.rol === 'participante' && profile.status === 'rejected') {
        Alert.alert('Cuenta rechazada', 'Tu solicitud fue rechazada.');
        return;
      }

      // Autenticamos en Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      const sbUser = signInData.user;

      // Verificamos si el email está confirmado; si no, mostramos alerta y salimos
      if (!sbUser.email_confirmed_at) {
        await supabase.auth.signOut();
        Alert.alert(
          'Verifica tu correo',
          'Debes verificar tu email antes de entrar a la aplicación.'
        );
        return;
      }

      // Si todo OK, cargamos perfil para usuario activo
      await fetchUserProfile(sbUser);
    } catch (error) {
      // Manejo de errores específicos según el mensaje que devuelve Supabase
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
        default:
          // Otros errores ya fueron mostrados arriba
          break;
      }
      throw error;
    }
  };

  // Función para cerrar sesión del usuario
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Función para actualizar el perfil del usuario (display name y foto)
  const updateProfile = async ({
      displayName,
      photourl,
      bio = '',
      location = '',
      website = '',
      fechaNacimiento = '',
    }) => {
    try {
      // Objeto con los campos a actualizar
      const updates = {
        display_name: displayName,
        photourl,
        bio,
        location,
        website,
        fecha_nacimiento: fechaNacimiento,
      };
      // Ejecutamos la actualización en la tabla "usuarios" para el id del usuario logueado
      const { error } = await db
        .from('usuarios')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;

      setUser(prev => ({
      ...prev,
      ...updates,
    }));
      Alert.alert('Perfil actualizado', 'Tus datos fueron actualizados correctamente.');
    } catch (error) {
      Alert.alert('Error al actualizar perfil', error.message);
      throw error;
    }
  };

  // Objeto con las funciones y estados que expondremos a través del contexto
  const value = {
    user,
    loading,
    register,
    signIn,
    signOut,
    updateProfile,
  };

  // Renderizamos el Provider envolviendo a los componentes hijos, pasándoles el valor del contexto
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}