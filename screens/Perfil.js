// screens/Perfil.js
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
  const { user, updateProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(user.display_name);
  const [imageUri, setImageUri] = useState(user.photourl);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ totalFotos: 0, totalVotos: 0, votosHoy: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user.rol === 'participante') {
          const { count: fotosCount } = await db
            .from('fotos')
            .select('id', { count: 'exact', head: true })
            .eq('usuario_id', user.id);
          const { data: votosSumData } = await db
            .rpc('sumar_votos_por_usuario', { p_usuario_id: user.id });
          const totalVotos = votosSumData?.sum || 0;
          setStats({ totalFotos: fotosCount, totalVotos, votosHoy: 0 });
        } else if (user.rol === 'general') {
          const { count: votosHoyCount } = await db
            .from('votos')
            .select('id', { count: 'exact', head: true })
            .eq('usuario_id', user.id)
            .gte('created_at', startOfToday());
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

    const pickImage = async () => {
    // 1) permisos
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería');
    }

    // 2) picker
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:   ImagePicker.MediaTypeOptions.Images,
      allowsEditing:true,
      quality:      0.8,
    });
    if (canceled) return;

    setUploading(true);
    try {
      const { uri } = assets[0];
      const filename = `${user.id}_${Date.now()}.jpg`;

      // Construimos el FormData sin usar blob()
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: 'image/jpeg' });

      // Hacemos el POST directamente al endpoint de Storage
      const res = await fetch(
        `${Constants.expoConfig.extra.SUPABASE_URL}/storage/v1/object/avatars/${filename}`,
        {
          method: 'POST',
          headers: {
            apikey:        Constants.expoConfig.extra.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${Constants.expoConfig.extra.SUPABASE_ANON_KEY}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );
    console.log('Respuesta de subida:', res.status, res.ok);

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Error en subida: ${res.status} ${err}`);
      }

      // Obtenemos la URL pública con el cliente ligero
      const { data: { publicUrl }, error: urlError } = await storage
        .from('avatars')
        .getPublicUrl(filename);
      if (urlError) throw urlError;

      // Actualizamos la tabla de usuarios
      const { error: dbError } = await db
        .from('usuarios')
        .update({ photourl: publicUrl })
        .eq('id', user.id);
      if (dbError) throw dbError;

      setImageUri(publicUrl);
      Alert.alert('¡Avatar actualizado!');
    } catch (e) {
      Alert.alert('Error al subir la foto', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setUploading(true);
    try {
      let publicURL = user.photourl;

      // Si cambió la imagen, la subimos a bucket "avatars"
      if (imageUri && imageUri !== user.photourl) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const ext = imageUri.split('.').pop();
        const fileName = `avatar_${user.id}.${ext}`;
        const uploadPath = `avatars/${user.id}/${fileName}`;

        // 1) Subimos a supabase.storage.from('avatars').upload(...)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')                         // <-- bucket "avatars"
          .upload(uploadPath, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        // 2) Obtenemos la URL pública
        const { publicUrl, error: urlError } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path);

        if (urlError) throw urlError;
        publicURL = publicUrl;
      }

      // 3) Actualizamos la tabla "usuarios"
      await updateProfile({ displayName, photourl: publicURL });
    } catch (error) {
      console.log('Error actualizando perfil:', error);
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>Cambiar Foto</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
      />

      {uploading ? (
        <ActivityIndicator size="small" />
      ) : (
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
          <Text style={styles.saveButtonText}>Guardar Perfil</Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsContainer}>
        {loadingStats ? (
          <ActivityIndicator />
        ) : (
          <>
            {user.rol === 'participante' && (
              <>
                <Text>Fotos subidas: {stats.totalFotos}</Text>
                <Text>Votos totales recibidos: {stats.totalVotos}</Text>
              </>
            )}
            {user.rol === 'general' && (
              <Text>Votos usados hoy: {stats.votosHoy} / 10</Text>
            )}
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#007aff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  statsContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 12,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
  },
});
