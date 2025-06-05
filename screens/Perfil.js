import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { startOfToday } from 'date-fns';
import { db, storage } from '../lib/supabaseClients';
import Constants from 'expo-constants';

export default function Perfil() {
  // Obtiene datos del usuario, función para actualizar perfil y cerrar sesión desde el contexto
  const { user, updateProfile, signOut } = useAuth();

  // Estados locales: nombre a mostrar, URI de la imagen de avatar, y banderas de carga
  const [displayName, setDisplayName] = useState(user.display_name);
  const [imageUri, setImageUri] = useState(user.photourl);
  const [uploading, setUploading] = useState(false);

  // Estadísticas: número total de fotos, votos totales y votos hechos hoy
  const [stats, setStats] = useState({ totalFotos: 0, totalVotos: 0, votosHoy: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Al montar el componente, obtiene estadísticas según el rol del usuario
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user.rol === 'participante') {
          // Si es participante, cuenta cuántas fotos subió
          const { count: fotosCount } = await db
            .from('fotos')
            .select('id', { count: 'exact', head: true })
            .eq('usuario_id', user.id);

          // Llama a una función almacenada (RPC) que suma todos los votos que recibieron sus fotos
          const { data: votosSumData } = await db.rpc('sumar_votos_por_usuario', { p_usuario_id: user.id });
          const totalVotos = votosSumData?.sum || 0;

          setStats({ totalFotos: fotosCount, totalVotos, votosHoy: 0 });
        } else if (user.rol === 'general') {
          // Si es usuario “general”, cuenta cuántos votos usó hoy
          const hoy = startOfToday();
          const isoHoy = hoy.toISOString();

          const { count: votosHoyCount } = await db
            .from('votos')
            .select('id', { count: 'exact', head: true })
            .eq('usuario_id', user.id)
            .gte('created_at', isoHoy);

          setStats({ totalFotos: 0, totalVotos: 0, votosHoy: votosHoyCount });
        }
      } catch (error) {
        console.log('Error fetching stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  /**
   * pickImage: abre el selector de imágenes, sube el archivo a Storage en el bucket "avatars"
   * - Solicita permisos
   * - Genera un nombre de archivo único
   * - Sube mediante fetch al endpoint de Supabase Storage
   * - Obtiene la URL pública y actualiza la tabla "usuarios"
   * - Actualiza el estado local con la nueva URI
   */
  const pickImage = async () => {
    // 1) Solicita permiso para acceder a la galería de imágenes
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería');
    }

    // 2) Lanza el selector de imágenes
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (canceled) return; // Si el usuario cancela, salimos

    setUploading(true);
    try {
      // 3) Construye un nombre de archivo basado en el ID y marca de tiempo
      const { uri } = assets[0];
      const filename = `${user.id}_${Date.now()}.jpg`;

      // 4) Prepara FormData para la subida
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: 'image/jpeg' });

      // 5) Ejecuta la petición POST al endpoint de Storage
      const res = await fetch(
        `${Constants.expoConfig.extra.SUPABASE_URL}/storage/v1/object/avatars/${filename}`,
        {
          method: 'POST',
          headers: {
            apikey: Constants.expoConfig.extra.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${Constants.expoConfig.extra.SUPABASE_ANON_KEY}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Error en subida: ${res.status} ${err}`);
      }

      // 6) Obtiene la URL pública del archivo subido
      const { data: { publicUrl }, error: urlError } = await storage
        .from('avatars')
        .getPublicUrl(filename);
      if (urlError) throw urlError;

      // 7) Actualiza la columna photourl en la tabla "usuarios"
      const { error: dbError } = await db
        .from('usuarios')
        .update({ photourl: publicUrl })
        .eq('id', user.id);
      if (dbError) throw dbError;

      // 8) Guarda la nueva URI en el estado local
      setImageUri(publicUrl);
      Alert.alert('¡Avatar actualizado!');
    } catch (e) {
      Alert.alert('Error al subir la foto', e.message);
    } finally {
      setUploading(false);
    }
  };

  /**
   * handleSaveProfile: guarda los cambios del displayName y photourl llamando a updateProfile del contexto
   */
  const handleSaveProfile = async () => {
    setUploading(true);
    try {
      await updateProfile({ displayName, photourl: imageUri });
      Alert.alert('Perfil actualizado');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1) Avatar: si existe imageUri, mostrará la imagen; de lo contrario, un placeholder */}
      <TouchableOpacity onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>Cambiar Foto</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 2) Input para editar el nombre a mostrar */}
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
      />

      {/* 3) Botón para guardar cambios: mientras uploading=true, muestra spinner */}
      {uploading ? (
        <ActivityIndicator size="small" />
      ) : (
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
          <Text style={styles.saveButtonText}>Guardar Perfil</Text>
        </TouchableOpacity>
      )}

      {/* 4) Sección de estadísticas: muestra datos distintos según rol */}
      <View style={styles.statsContainer}>
        {loadingStats ? (
          <ActivityIndicator />
        ) : (
          <>
            {user.rol === 'participante' && (
              <>
                <Text style={styles.statsText}>
                  Fotos subidas: {stats.totalFotos} / 5
                </Text>
                <Text style={styles.statsText}>
                  Votos recibidos: {stats.totalVotos}
                </Text>
              </>
            )}
            {user.rol === 'general' && (
              <Text style={styles.statsText}>
                Votos usados hoy: {stats.votosHoy} / 10
              </Text>
            )}
          </>
        )}
      </View>

      {/* 5) Botón para cerrar sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    flex: 1,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: '#fff',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    width: '60%',
    alignItems: 'center',
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 12,
    width: '60%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});