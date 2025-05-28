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

  const handlePickImage = async () => {
    // 1. Elegir imagen
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (canceled) return;

    setUploading(true);
    try {
      // 2. Convertir URI a blob
      const blob = await fetch(assets[0].uri).then(r => r.blob());

      // 3. Generar nombre en el bucket
      const filename = `${contestId}/${user.id}_${Date.now()}.jpg`;

      // 4. Subir al bucket 'photos'
      await storage.upload(filename, blob, {
        cacheControl: '3600',
        upsert: false,
      });

      // 5. Obtener URL pública
      const { publicUrl } = await storage.getPublicUrl(filename);

      // 6. Registrar metadata en la tabla 'fotos'
      const { error } = await db
        .from('fotos')
        .insert([
          {
            concurso_id: contestId,
            user_id:     user.id,
            ruta:        filename,
            url:         publicUrl,
            votos:       0,
            fecha:       new Date().toISOString(),
          },
        ]);
      if (error) throw error;

      Alert.alert('¡Foto subida correctamente!');
    } catch (e) {
      Alert.alert('Error al subir la foto', e.message);
    } finally {
      setUploading(false);
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
