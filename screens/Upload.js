// src/screens/UploadScreen.js
import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRoute } from '@react-navigation/native';
import { storage, db } from '../lib/supabaseClients';
import { AuthContext } from '../contexts/AuthContext';

export default function UploadScreen() {
  const { user } = useContext(AuthContext);
  const { params: { contestId } } = useRoute();
  const [uploading, setUploading] = useState(false);

  async function handlePickImage() {
  // 1) Pide permisos y abre picker
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería');
  }
  const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:   ImagePicker.MediaTypeOptions.Images,
    allowsEditing:true,
    quality:      1,
  });
  if (canceled) return;

  // 2) Prepara el FormData
  const uri      = assets[0].uri;
  const filename = `photos/${contest.id}/${user.id}_${Date.now()}.jpg`;
  const formData = new FormData();
  formData.append('file', { uri, name: filename, type: 'image/jpeg' });

  try {
    // 3) POST directo al endpoint de Storage SIN Content-Type
    const res = await fetch(
      `${Constants.expoConfig.extra.SUPABASE_URL}/storage/v1/object/${filename}`,
      {
        method: 'POST',
        headers: {
          apikey:        Constants.expoConfig.extra.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${await supabase.auth.getSession().then(r=>r.data.session.access_token)}`,
          // ¡ojo! NO pongas 'Content-Type' aquí
        },
        body: formData,
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Status ${res.status}: ${text}`);
    }

    // 4) Inserta tu metadato en la tabla
    const publicUrl = supabase
      .storage
      .from('photos')          // o el bucket que corresponda
      .getPublicUrl(filename)
      .data.publicUrl;

    const { error } = await supabase
      .from('fotos')
      .insert([{
        concurso_id: contest.id,
        user_id:     user.id,
        url:         publicUrl,
        status:      'pending',
        created_at:  new Date().toISOString(),
      }]);
    if (error) throw error;

    Alert.alert('Foto subida, pendiente de revisión.');
  } catch (e) {
    Alert.alert('Error al subir la foto', e.message);
  }
};

  return (
    <View style={styles.container}>
      {uploading ? (
        <ActivityIndicator />
      ) : (
        <Button mode="contained" onPress={handlePickImage}>
          Seleccionar foto
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center' },
});
