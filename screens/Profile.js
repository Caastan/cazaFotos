// src/screens/ProfileScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { AuthContext } from '../contexts/AuthContext';
import { storage, db } from '../lib/supabaseClients';

export default function ProfileScreen() {
  const { user, signIn, signOut } = useContext(AuthContext);
  const [uploading, setUploading]   = useState(false);
  const [postsCount, setPostsCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { count, error } = await db
        .from('fotos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (!error) setPostsCount(count);
    })();
  }, [user]);

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
      console.log(formData.get('file'));

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

      // Refrescamos el contexto y avisamos
      signIn({ ...user, photourl: publicUrl });
      Alert.alert('¡Avatar actualizado!');
    } catch (e) {
      Alert.alert('Error al subir la foto', e.message);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return <ActivityIndicator style={styles.center} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage}>
          {user.photourl ? (
            <Image source={{ uri: user.photourl }} style={styles.avatar} />
          ) : (
            <View
              style={[styles.avatar, styles.avatarPlaceholder]}
            >
              <Text style={styles.avatarInitial}>
                {user.display_name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          {uploading && (
            <ActivityIndicator
              style={{ position: 'absolute', bottom: -10 }}
            />
          )}
        </TouchableOpacity>

        <Text style={styles.name}>{user.display_name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{postsCount}</Text>
          <Text style={styles.statLabel}>Publicaciones</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Votos</Text>
        </View>
      </View>

      <View style={styles.btnRow}>
        <Button
          mode="outlined"
          onPress={pickImage}
          style={styles.btn}
          disabled={uploading}
        >
          Cambiar foto
        </Button>
        <Button
          mode="contained-tonal"
          onPress={signOut}
          style={styles.btn}
        >
          Cerrar sesión
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
    elevation: 2,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    color: '#555',
  },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  email: { fontSize: 14, color: '#888' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 20,
    marginBottom: 10,
    elevation: 1,
  },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 13, color: '#555' },
  btnRow: { padding: 20 },
  btn: { marginVertical: 6 },
});
