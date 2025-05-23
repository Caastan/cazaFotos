// /screens/Profile.js
import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../contexts/AuthContext';
import { db, storage } from '../config/firebaseConfig';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/* Enum compatible con SDK 48 y 49+ */
const IMAGE_ENUM =
  ImagePicker?.MediaType?.Images ||             // SDK 49+
  ImagePicker?.MediaTypeOptions?.Images;        // SDK ≤ 48

export default function ProfileScreen() {
  const { user, signOut, signIn } = useContext(AuthContext);

  const [uploading, setUploading] = useState(false);
  const [postsCount, setPostsCount] = useState(0);

  /* ---------- Nº de publicaciones ---------- */
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
          const q = query(
          collectionGroup(db, 'fotos'),          // 🔁 ahora busca en TODAS
          where('userId', '==', user.id)
          );
        const snap = await getDocs(q);
        setPostsCount(snap.size);
      } catch (e) {
        console.log('❌ fetchPosts', e);
      }
    })();
  }, [user]);

  /* ------------ Elegir y subir avatar ------------- */
  const pickImage = async () => {
    /* permiso */
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso denegado', 'Necesitamos acceder a tu galería');
    }

    /* selector */
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: IMAGE_ENUM,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result || result.canceled || result.cancelled) return;

    /* subida */
    try {
      if (!user?.id) throw new Error('Usuario no válido');
      setUploading(true);

      const uri  = result.assets[0].uri;
      const blob = await (await fetch(uri)).blob();
      const path = `avatars/${user.id}_${Date.now()}.jpg`;

      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'usuarios', user.id), { photoURL: url });
      signIn({ ...user, photoURL: url });      // refresca contexto

      Alert.alert('¡Foto actualizada!');
    } catch (e) {
      console.log('❌ Error al subir', e);
      Alert.alert('Error', e.message);
    } finally {
      setUploading(false);
    }
  };

  /* --- Mientras cambia de stack tras cerrar sesión --- */
  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {user.nombre?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          {uploading && (
            <ActivityIndicator style={{ position: 'absolute', bottom: -10 }} />
          )}
        </TouchableOpacity>

        <Text style={styles.name}>{user.nombre}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Estadísticas */}
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

      {/* Botones */}
      <View style={styles.btnRow}>
        <Button mode="outlined" onPress={pickImage} style={styles.btn}>
          Cambiar foto
        </Button>
        <Button mode="contained-tonal" onPress={signOut} style={styles.btn}>
          Cerrar sesión
        </Button>
      </View>
    </View>
  );
}

/* ---------------- Estilos ---------------- */
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
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 48, color: '#555' },

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